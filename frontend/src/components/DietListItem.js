import React, { useState } from 'react';
import { markItemAdministered, markItemSkipped, markItemPending, deleteDietItem } from '../api/dietApi';

// MUI Components
import {
    ListItem, ListItemText, IconButton, Box, Typography, Chip, Tooltip, CircularProgress,
    Button // <<< Correctly Imported Button HERE
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Administered
import CancelIcon from '@mui/icons-material/Cancel'; // Skipped
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // Pending
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo'; // For Mark Pending


// Helper to format time (HH:MM:SS -> HH:MM AM/PM) - can be moved to a utils file
const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};


// Accept isDisabled prop
function DietListItem({ item, refreshItems, onEdit, isDisabled }) {

    // Optional: Add internal loading state for individual button actions
    const [actionLoading, setActionLoading] = useState(false);

    // Combine external disable flag with internal action loading
    const buttonsDisabled = isDisabled || actionLoading;

    /**
     * Generic handler for API actions on this item.
     * @param {function} actionFn - The API function to call (e.g., markItemAdministered).
     * @param {string} successMsg - Console message on success.
     * @param {string} errorMsg - Alert message prefix on failure.
     */
    const handleAction = async (actionFn, successMsg, errorMsg) => {
        setActionLoading(true); // Show loading state
        try {
            await actionFn(item.id); // Call the specific API function
            // console.log(successMsg, item.id); // Optional success logging
            refreshItems(); // Refresh the parent list after successful action
        } catch (error) {
            // Log detailed error and show alert to user
            console.error(`${errorMsg} (ID: ${item.id}):`, error.response?.data || error.message || error);
            alert(`${errorMsg}. Status: ${error.response?.status || 'Unknown'}`); // Simple alert for now
        } finally {
             // Ensure loading state is turned off, regardless of success/failure
             setActionLoading(false);
        }
    };

    // Specific handlers calling the generic handler
    const handleAdminister = () => handleAction(markItemAdministered, "Marked administered", "Failed to mark as administered");
    const handleSkip = () => handleAction(markItemSkipped, "Marked skipped", "Failed to mark as skipped");
    const handlePending = () => handleAction(markItemPending, "Marked pending", "Failed to reset status");

    const handleDelete = () => {
         // Confirmation dialog before deleting
         if (window.confirm(`Are you sure you want to delete "${item.food_name}" from this day's tracker?`)) {
             handleAction(deleteDietItem, "Item deleted", "Failed to delete item");
         }
    };

    // Handler for the edit action
    const handleEdit = () => {
        // Only proceed if buttons are not disabled
        if (!buttonsDisabled) {
            onEdit(item); // Call the onEdit function passed from the parent
        }
    };

    // Determine status chip appearance based on item state
    let statusChip;
    if (item.is_administered) {
        statusChip = <Chip icon={<CheckCircleIcon />} label="Administered" color="success" size="small" variant="outlined" />;
    } else if (item.is_skipped) {
        statusChip = <Chip icon={<CancelIcon />} label="Skipped" color="error" size="small" variant="outlined" />;
    } else {
        statusChip = <Chip icon={<HourglassEmptyIcon />} label="Pending" color="warning" size="small" variant="outlined" />;
    }

    // Get image URL if available
    const imageUrl = item.image ? item.image : null; // API gives full URL

    // Render the list item using MUI components
    return (
        <ListItem
            divider // Adds a line between items
            sx={{
                // Apply visual cues based on status directly to the ListItem
                opacity: (item.is_administered || item.is_skipped) ? 0.7 : 1,
                backgroundColor: item.is_administered ? 'action.hover' : 'inherit', // Subtle background for administered
                textDecoration: item.is_skipped ? 'line-through' : 'none',
                alignItems: 'flex-start', // Align items to top for multi-line content
                py: 1.5 // Vertical padding
            }}
        >
            {/* Main text content */}
            <ListItemText
                primary={
                    <Typography variant="body1" component="span" sx={{ fontWeight: 'medium' }}>
                        {/* Display time */}
                        <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>{formatTime(item.timing)}</Box>
                        {/* Display food name */}
                        {item.food_name}
                        {/* Display quantity */}
                        <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.9em' }}>({item.quantity_ml} ml)</Box>
                    </Typography>
                }
                secondary={
                    <>
                        {/* Display nutritional info if available */}
                        <Typography variant="body2" color="text.secondary" component="span">
                            {item.calories ? ` ${item.calories} kcal` : ''}
                            {item.protein_g ? ` | P: ${item.protein_g}g` : ''}
                            {item.carbs_g ? ` | C: ${item.carbs_g}g` : ''}
                            {item.fat_g ? ` | F: ${item.fat_g}g` : ''}
                        </Typography>
                        {/* Display description if available */}
                        {item.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', whiteSpace: 'normal' }}>
                                {item.description}
                            </Typography>
                        )}
                        {/* Display image if available */}
                         {imageUrl && (
                            <Box sx={{ mt: 1 }}>
                                <img
                                    src={imageUrl}
                                    alt={item.food_name}
                                    style={{ maxHeight: '60px', maxWidth: '100px', borderRadius: '4px', border: '1px solid #eee', display: 'block' }}
                                    // Add error handling for broken images
                                    onError={(e) => { e.target.style.display = 'none'; /* Hide broken image */ }}
                                />
                            </Box>
                         )}
                         {/* Display Status Chip */}
                         <Box sx={{ mt: 1 }}>
                            {statusChip}
                            {/* Display administered time if applicable */}
                            {item.is_administered && item.administered_at && (
                                <Typography variant="caption" color="text.secondary" sx={{ml: 1}}>
                                    ({new Date(item.administered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </Typography>
                            )}
                         </Box>
                    </>
                }
            />
            {/* Action Buttons Area */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1, flexShrink: 0 }}>
                 {/* Show spinner if an action is loading for this specific item */}
                 {actionLoading ? (
                     <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '120px'}}><CircularProgress size={20} /></Box>
                 ) : (
                     <>
                        {/* Conditional rendering of Administer/Skip or Mark Pending buttons */}
                        {!item.is_administered && !item.is_skipped && (
                            <>
                                <Tooltip title="Mark as Administered">
                                    {/* Wrap disabled button in span for tooltip to work */}
                                    <span>
                                        <Button
                                            size="small" variant="contained" color="success"
                                            startIcon={<CheckCircleIcon />} onClick={handleAdminister}
                                            disabled={buttonsDisabled} // Use combined disable flag
                                            sx={{ minWidth: 110, justifyContent: 'flex-start' }} // Align text left
                                        >
                                            Administer
                                        </Button>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Mark as Skipped">
                                     <span>
                                        <Button
                                            size="small" variant="contained" color="error"
                                            startIcon={<CancelIcon />} onClick={handleSkip}
                                            disabled={buttonsDisabled}
                                            sx={{ minWidth: 110, justifyContent: 'flex-start' }}
                                        >
                                            Skip
                                        </Button>
                                     </span>
                                </Tooltip>
                            </>
                        )}
                        {(item.is_administered || item.is_skipped) && (
                             <Tooltip title="Reset Status to Pending">
                                 <span>
                                    <Button
                                        size="small" variant="outlined" color="warning"
                                        startIcon={<UndoIcon />} onClick={handlePending}
                                        disabled={buttonsDisabled}
                                        sx={{ minWidth: 110, justifyContent: 'flex-start' }}
                                    >
                                        Pending
                                    </Button>
                                 </span>
                             </Tooltip>
                        )}

                        {/* Edit and Delete Buttons */}
                         <Tooltip title="Edit this item for this day">
                             <span>
                                <Button
                                    size="small" variant="outlined" color="primary"
                                    startIcon={<EditIcon />} onClick={handleEdit}
                                    disabled={buttonsDisabled}
                                    sx={{ minWidth: 110, justifyContent: 'flex-start', mt: 0.5 }}
                                >
                                    Edit
                                </Button>
                             </span>
                         </Tooltip>
                         <Tooltip title="Delete this item for this day">
                             <span>
                                <Button
                                    size="small" variant="outlined" color="secondary" // Or use a grey color like default
                                    startIcon={<DeleteIcon />} onClick={handleDelete}
                                    disabled={buttonsDisabled}
                                    sx={{ minWidth: 110, justifyContent: 'flex-start' }}
                                >
                                    Delete
                                </Button>
                             </span>
                         </Tooltip>
                     </>
                 )}
            </Box>
        </ListItem>
    );
}

export default DietListItem;