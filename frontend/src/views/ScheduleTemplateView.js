import React, { useState, useEffect, useCallback } from 'react';
import { getScheduleTemplates, deleteScheduleTemplate, getFoodFormulas } from '../api/dietApi';
import ScheduleTemplateForm from '../components/ScheduleTemplateForm'; // We will create this next

// MUI Components
import {
    Container, Typography, Box, Button, CircularProgress, Alert,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider, Paper
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // For time icon

// Helper to format time (HH:MM:SS -> HH:MM AM/PM)
const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

function ScheduleTemplateView() {
    const [templates, setTemplates] = useState([]);
    const [formulas, setFormulas] = useState([]); // Need formulas for the form dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null); // For editing

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch both templates and formulas (formulas needed for the add/edit form)
            const [templateResponse, formulaResponse] = await Promise.all([
                getScheduleTemplates(),
                getFoodFormulas() // Fetch formulas for the dropdown in the form
            ]);
            setTemplates(templateResponse.data);
            setFormulas(formulaResponse.data);
        } catch (err) {
            console.error("Error fetching schedule data:", err);
            setError("Failed to load schedule template or formula library. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (template = null) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTemplate(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        fetchData(); // Refresh the list
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to remove "${name}" from the schedule template?`)) {
            try {
                await deleteScheduleTemplate(id);
                fetchData(); // Refresh list
            } catch (err) {
                console.error("Error deleting template item:", err);
                setError(`Failed to delete schedule item "${name}".`);
                setTimeout(() => setError(null), 5000);
            }
        }
    };

    return (
        <Container maxWidth="md"> {/* Using medium width for a list view */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Fixed Daily Schedule
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => handleOpenModal()}
                >
                    Add Schedule Item
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper elevation={2}> {/* Wrap list in Paper for background/elevation */}
                    <List disablePadding>
                        {templates.map((template, index) => (
                            <React.Fragment key={template.id}>
                                <ListItem>
                                     <AccessTimeIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                                    <ListItemText
                                        primary={`${formatTime(template.timing)} - ${template.display_name}`}
                                        secondary={
                                            `Qty: ${template.quantity_ml}ml` +
                                            (template.calories ? ` | ${template.calories} kcal` : '') +
                                            (template.protein_g ? ` | P: ${template.protein_g}g` : '') +
                                            (template.carbs_g ? ` | C: ${template.carbs_g}g` : '') +
                                            (template.fat_g ? ` | F: ${template.fat_g}g` : '') +
                                            (template.description ? ` | Notes: ${template.description}` : '')
                                        }
                                        primaryTypographyProps={{ fontWeight: 'medium' }}
                                        secondaryTypographyProps={{ color: 'text.secondary', whiteSpace: 'normal' }}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenModal(template)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(template.id, template.display_name)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < templates.length - 1 && <Divider component="li" />} {/* Divider between items */}
                            </React.Fragment>
                        ))}
                        {templates.length === 0 && (
                             <ListItem>
                                <ListItemText primary="No items in the fixed schedule yet. Add some!" sx={{textAlign: 'center', color: 'text.secondary'}}/>
                            </ListItem>
                        )}
                    </List>
                </Paper>
            )}

            {/* Modal for Add/Edit Form */}
            <ScheduleTemplateForm
                open={isModalOpen}
                onClose={handleCloseModal}
                onSaveSuccess={handleSaveSuccess}
                templateData={selectedTemplate}
                availableFormulas={formulas} // Pass formulas for the dropdown
            />
        </Container>
    );
}

export default ScheduleTemplateView;

