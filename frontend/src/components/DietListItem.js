import React, { useState, useEffect } from 'react';
// Import all necessary API calls for status changes
import { markItemAdministered, markItemSkipped, markItemPending } from '../api/dietApi';
// Removed deleteDietItem import

// MUI Components
import {
    ListItem, ListItemText, Box, Typography, Chip, Tooltip, CircularProgress,
    Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Consumed
import CancelIcon from '@mui/icons-material/Cancel'; // Skip
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // Pending
import EditIcon from '@mui/icons-material/Edit'; // Edit Button
import UndoIcon from '@mui/icons-material/Undo'; // Reset Status (Pending) Button
// Removed DeleteIcon import

// Helper to format time
const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Accept onEdit, isDisabled, isEditMode props
function DietListItem({ item, refreshItems, onEdit, isDisabled, isEditMode }) {
    const [actionLoading, setActionLoading] = useState(false);
    // Buttons disabled if parent is loading OR if not in edit mode OR if this item's action is loading
    const buttonsDisabled = isDisabled || !isEditMode || actionLoading;

    // Log item rendering (optional for debugging)
    useEffect(() => {
        // console.log(`DietListItem rendering/updated for ID: ${item?.id}, Status: ${item.is_administered ? 'Admin' : (item.is_skipped ? 'Skip' : 'Pend')}`);
    }, [item]);

    /** Generic handler for API actions */
    const handleAction = async (actionFn, itemId, actionName) => {
        console.log(`HANDLE ACTION: Triggered '${actionName}' for item ID: ${itemId}`);
        if (!itemId) {
            console.error(`HANDLE ACTION ERROR: Cannot perform ${actionName} - Item ID missing.`, itemId);
            alert(`Cannot perform action: Item ID is missing.`);
            return;
        }
        setActionLoading(true);
        try {
            await actionFn(itemId); // Call the API function
            console.log(`HANDLE ACTION: API call ${actionFn.name} successful for ID: ${itemId}. Refreshing items...`);
            refreshItems(); // Refresh the list in the parent component
        } catch (error) {
            console.error(`HANDLE ACTION ERROR (${actionName}, ID: ${itemId}):`, error.response?.data || error.message || error);
            if (error.response?.status === 404) {
                 alert(`${actionName} failed. Item with ID ${itemId} not found on server. The list might be out of sync.`);
            } else {
                alert(`${actionName} failed. Status: ${error.response?.status || 'Unknown'}`);
            }
        } finally {
             setActionLoading(false); // Ensure loading state is reset
        }
    };

    // --- Action Handlers ---
    const handleConsumedClick = () => handleAction(markItemAdministered, item.id, "Consumed");
    const handleSkipClick = () => handleAction(markItemSkipped, item.id, "Skip");
    const handlePendingClick = () => handleAction(markItemPending, item.id, "Mark Pending");
    // Removed handleDeleteClick

    // Handler for the "Edit" button
    const handleEditClick = () => {
        // Only trigger edit if buttons are not generally disabled
        if (!buttonsDisabled) {
            // console.log(`Calling onEdit for current item prop ID: ${item?.id}`);
            onEdit(item); // Call the onEdit function passed from the parent
        }
    };

    // --- Status Chip Logic ---
    // Determines the appearance of the status indicator
    let statusChip;
    if (item.is_administered) {
        statusChip = <Chip icon={<CheckCircleIcon />} label="Consumed" color="success" size="small" variant="outlined" />;
    } else if (item.is_skipped) {
        statusChip = <Chip icon={<CancelIcon />} label="Skipped" color="error" size="small" variant="outlined" />;
    } else { // Pending state
        statusChip = <Chip icon={<HourglassEmptyIcon />} label="Pending" color="warning" size="small" variant="outlined" />;
    }

    // Get image URL if available
    const imageUrl = item.image ? item.image : null;

    // --- Render ---
    return (
        <ListItem
            divider // Adds a visual separator line
            sx={{
                // Apply visual styles based on the item's status
                opacity: (item.is_administered || item.is_skipped) ? 0.8 : 1, // Slightly fade completed/skipped items
                backgroundColor: item.is_administered ? 'action.hover' : 'inherit', // Subtle background for consumed
                // textDecoration: item.is_skipped ? 'line-through' : 'none', // Optional: line through skipped items
                alignItems: 'flex-start', // Align content to the top
                py: 1.5 // Vertical padding
            }}
        >
            {/* Main content area (left side) */}
            <ListItemText
                primary={
                    <Typography variant="body1" component="span" sx={{ fontWeight: 'medium' }}>
                        {/* Time */}
                        <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>{formatTime(item.timing)}</Box>
                        {/* Food Name */}
                        {item.food_name}
                        {/* Quantity */}
                        <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.9em' }}>({item.quantity_ml} ml)</Box>
                    </Typography>
                }
                secondary={
                    <>
                        {/* Nutritional Info */}
                        <Typography variant="body2" color="text.secondary" component="span">
                            {item.calories ? ` ${item.calories} kcal` : ''}
                            {item.protein_g ? ` | P: ${item.protein_g}g` : ''}
                            {item.carbs_g ? ` | C: ${item.carbs_g}g` : ''}
                            {item.fat_g ? ` | F: ${item.fat_g}g` : ''}
                        </Typography>
                        {/* Description */}
                        {item.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', whiteSpace: 'normal' }}>
                                {item.description}
                            </Typography>
                        )}
                        {/* Image */}
                        {imageUrl && (
                            <Box sx={{ mt: 1 }}>
                                <img
                                    src={imageUrl}
                                    alt={item.food_name}
                                    style={{ maxHeight: '60px', maxWidth: '100px', borderRadius: '4px', border: '1px solid #eee', display: 'block' }}
                                    onError={(e) => { e.target.style.display = 'none'; /* Hide broken image */ }}
                                />
                            </Box>
                         )}
                         {/* Status Chip and Administered Time */}
                         <Box sx={{ mt: 1 }}>
                            {statusChip}
                            {item.is_administered && item.administered_at && (
                                <Typography variant="caption" color="text.secondary" sx={{ml: 1}}>
                                    ({new Date(item.administered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </Typography>
                            )}
                         </Box>
                    </>
                }
            />
            {/* Action Buttons Area - Renders only if isEditMode is true */}
            {isEditMode && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1, flexShrink: 0 }}>
                    {/* Show loading spinner if an action is in progress */}
                    {actionLoading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '90px'}}>
                            <CircularProgress size={20} />
                        </Box>
                    ) : (
                        <>
                            {/* Show "Consumed" and "Skip" buttons only if item is Pending */}
                            {!item.is_administered && !item.is_skipped && (
                                <>
                                    <Tooltip title="Mark as Consumed"><span>
                                        <Button
                                            size="small" variant="contained" color="success"
                                            startIcon={<CheckCircleIcon />} onClick={handleConsumedClick}
                                            disabled={buttonsDisabled}
                                            sx={{ minWidth: 110, justifyContent: 'flex-start' }}
                                        >
                                            Consumed
                                        </Button>
                                    </span></Tooltip>
                                    <Tooltip title="Mark as Skipped"><span>
                                        <Button
                                            size="small" variant="contained" color="error"
                                            startIcon={<CancelIcon />} onClick={handleSkipClick}
                                            disabled={buttonsDisabled}
                                            sx={{ minWidth: 110, justifyContent: 'flex-start' }}
                                        >
                                            Skip
                                        </Button>
                                    </span></Tooltip>
                                </>
                            )}
                            {/* Show "Pending" (Reset Status) button only if item is NOT Pending */}
                            {(item.is_administered || item.is_skipped) && (
                                 <Tooltip title="Reset Status to Pending"><span>
                                    <Button
                                        size="small" variant="outlined" color="warning"
                                        startIcon={<UndoIcon />} onClick={handlePendingClick}
                                        disabled={buttonsDisabled}
                                        sx={{ minWidth: 110, justifyContent: 'flex-start' }}
                                    >
                                        Pending
                                    </Button>
                                 </span></Tooltip>
                            )}
                            {/* Show "Edit" button always (when in edit mode) */}
                            <Tooltip title="Edit this item for this day"><span>
                                <Button
                                    size="small" variant="outlined" color="primary"
                                    startIcon={<EditIcon />} onClick={handleEditClick}
                                    disabled={buttonsDisabled} // Disable based on parent state or if action loading
                                    sx={{ minWidth: 110, justifyContent: 'flex-start', mt: 0.5 }}
                                >
                                    Edit
                                </Button>
                            </span></Tooltip>
                            {/* Delete button is removed */}
                        </>
                    )}
                </Box>
            )}
        </ListItem>
    );
}

export default DietListItem;
