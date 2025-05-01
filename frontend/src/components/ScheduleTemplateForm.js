import React, { useState, useEffect } from 'react';
import { addScheduleTemplate, updateScheduleTemplate } from '../api/dietApi';

// MUI Components
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Grid, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Autocomplete
} from '@mui/material';

function ScheduleTemplateForm({ open, onClose, onSaveSuccess, templateData, availableFormulas }) {
    // Form state
    const [timing, setTiming] = useState(''); // Store as HH:MM
    const [selectedFormula, setSelectedFormula] = useState(null); // Store the selected formula *object* or null
    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [description, setDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Pre-fill form when editing
    useEffect(() => {
        if (templateData) {
            setIsEditing(true);
            setTiming(templateData.timing.substring(0, 5)); // HH:MM format for input type="time"
            // Find the full formula object from availableFormulas based on ID
            const formulaObj = availableFormulas.find(f => f.id === templateData.food_formula) || null;
            setSelectedFormula(formulaObj);
            setCustomName(templateData.custom_food_name || '');
            setQuantity(templateData.quantity_ml || '');
            setCalories(templateData.calories || '');
            setProtein(templateData.protein_g || '');
            setCarbs(templateData.carbs_g || '');
            setFat(templateData.fat_g || '');
            setDescription(templateData.description || '');
        } else {
            // Reset form for adding new
            setIsEditing(false);
            setTiming('');
            setSelectedFormula(null);
            setCustomName('');
            setQuantity('');
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setDescription('');
        }
        setError(null);
    }, [templateData, open, availableFormulas]);

    // Auto-fill nutrient fields when a formula is selected
    useEffect(() => {
        // Only autofill if NOT editing (or maybe if editing and fields are empty?)
        // Let's autofill always, user can override. Clear if formula deselected.
        if (selectedFormula) {
            // Only set if the field is currently empty, allowing overrides
            if (!quantity) setQuantity(selectedFormula.default_quantity_ml || '');
            if (!calories) setCalories(selectedFormula.default_calories || '');
            if (!protein) setProtein(selectedFormula.default_protein_g || '');
            if (!carbs) setCarbs(selectedFormula.default_carbs_g || '');
            if (!fat) setFat(selectedFormula.default_fat_g || '');
            // Maybe prefill description too?
            // if (!description) setDescription(selectedFormula.default_description || '');
        } else {
             // If formula is deselected, maybe clear the fields? Or leave them?
             // Let's leave them for now, user might want custom values.
        }
        // Fields like quantity might need specific logic if they are mandatory in the template
        // The model requires quantity_ml, so let's ensure it's set if a formula is chosen
         if (selectedFormula && !quantity) {
             setQuantity(selectedFormula.default_quantity_ml || '');
         }

    }, [selectedFormula]); // Rerun when selectedFormula changes


    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (!selectedFormula && !customName) {
            setError("Please select a Formula or enter a Custom Food Name.");
            setLoading(false);
            return;
        }
         if (!quantity) {
            setError("Quantity (ml) is required for a schedule item.");
            setLoading(false);
            return;
        }
         if (!timing) {
            setError("Timing is required.");
            setLoading(false);
            return;
        }


        const payload = {
            timing: timing, // Send as HH:MM
            food_formula: selectedFormula ? selectedFormula.id : null, // Send ID or null
            custom_food_name: customName,
            quantity_ml: quantity,
            calories: calories || null,
            protein_g: protein || null,
            carbs_g: carbs || null,
            fat_g: fat || null,
            description: description,
        };

        try {
            if (isEditing) {
                await updateScheduleTemplate(templateData.id, payload);
            } else {
                await addScheduleTemplate(payload);
            }
            onSaveSuccess(); // Notify parent view
        } catch (err) {
            console.error("Error saving schedule template:", err.response?.data || err.message);
             const backendError = err.response?.data;
            if (typeof backendError === 'object' && backendError !== null) {
                 setError(Object.entries(backendError).map(([key, value]) => `${key}: ${value.join ? value.join(', ') : value}`).join('; '));
            } else {
                 setError(`Failed to ${isEditing ? 'update' : 'add'} schedule item. Please check the details.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Schedule Item' : 'Add Schedule Item'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Timing */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                required
                                id="timing"
                                label="Scheduled Time"
                                type="time"
                                fullWidth
                                value={timing}
                                onChange={(e) => setTiming(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={loading}
                            />
                        </Grid>

                        {/* Formula Selection or Custom Name */}
                        <Grid item xs={12} sm={8}>
                             <Autocomplete
                                id="formula-select"
                                options={availableFormulas}
                                getOptionLabel={(option) => option.name || ""} // How to display option text
                                value={selectedFormula}
                                onChange={(event, newValue) => {
                                    setSelectedFormula(newValue); // newValue is the selected formula object or null
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value.id} // How to compare options
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Formula (Optional)"
                                        variant="outlined"
                                        helperText="Select a pre-defined formula to auto-fill details."
                                    />
                                )}
                                disabled={loading}
                                // clearOnBlur // Optional: clear input if user blurs without selecting
                            />
                        </Grid>
                        <Grid item xs={12}>
                             <TextField
                                margin="dense"
                                id="customName"
                                label="OR Custom Food Name"
                                helperText="Use this if not selecting a formula above."
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                disabled={loading}
                            />
                        </Grid>


                        {/* Nutrient Overrides */}
                         <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                required // Quantity is required in the template model
                                margin="dense"
                                id="quantity"
                                label="Quantity (ml)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                InputProps={{ inputProps: { min: 0 } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                margin="dense"
                                id="calories"
                                label="Calories (kcal)"
                                helperText="(Overrides formula)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                InputProps={{ inputProps: { min: 0 } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={4} md={2}>
                            <TextField
                                margin="dense"
                                id="protein"
                                label="Protein (g)"
                                helperText="(Overrides)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={4} md={2}>
                            <TextField
                                margin="dense"
                                id="carbs"
                                label="Carbs (g)"
                                helperText="(Overrides)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={4} md={2}>
                            <TextField
                                margin="dense"
                                id="fat"
                                label="Fat (g)"
                                helperText="(Overrides)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={fat}
                                onChange={(e) => setFat(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                id="description"
                                label="Notes for this schedule slot"
                                type="text"
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ padding: '16px 24px' }}>
                    <Button onClick={onClose} disabled={loading} color="secondary">Cancel</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Item' : 'Add Item')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default ScheduleTemplateForm;

