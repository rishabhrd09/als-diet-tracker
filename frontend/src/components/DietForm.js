import React, { useState, useEffect, useRef } from 'react';
import { addDietItem, updateDietItem } from '../api/dietApi';

// MUI Components
import {
    TextField, Button, Grid, Box, Typography, CircularProgress, Alert, Autocomplete, Paper
} from '@mui/material';

// Helper to format date to YYYY-MM-DD
const formatDate = (date) => {
   // ... (keep existing function) ...
   if (!date || !(date instanceof Date) || isNaN(date)) return '';
   const d = new Date(date);
   let month = '' + (d.getMonth() + 1);
   let day = '' + d.getDate();
   const year = d.getFullYear();
   if (month.length < 2) month = '0' + month;
   if (day.length < 2) day = '0' + day;
   return [year, month, day].join('-');
}

// Accept isDisabled prop from parent (DailyTrackerView)
function DietForm({ refreshItems, selectedItem, clearSelection, currentViewDate, availableFormulas = [], isDisabled }) {
    // --- State for form fields ---
    const [foodName, setFoodName] = useState('');
    const [timing, setTiming] = useState(''); // HH:MM
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scheduledDate, setScheduledDate] = useState(formatDate(currentViewDate));
    const [selectedSourceFormula, setSelectedSourceFormula] = useState(null); // For selecting formula when adding

    // --- State for form logic ---
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false); // Internal form submission loading
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Combine external disable flag with internal loading state
    const formDisabled = isDisabled || loading;

    // --- Effects ---
    // Effect to pre-fill form when editing an existing DietItem
    useEffect(() => {
        if (selectedItem) {
            setIsEditing(true);
            setFoodName(selectedItem.food_name || '');
            setTiming(selectedItem.timing ? selectedItem.timing.substring(0, 5) : '');
            setQuantity(selectedItem.quantity_ml || '');
            setCalories(selectedItem.calories || '');
            setProtein(selectedItem.protein_g || '');
            setCarbs(selectedItem.carbs_g || '');
            setFat(selectedItem.fat_g || '');
            setDescription(selectedItem.description || '');
            setScheduledDate(selectedItem.scheduled_date || formatDate(currentViewDate));
            setImage(null);
            setImagePreview(selectedItem.image || null);
            setSelectedSourceFormula(null); // Don't show formula selector when editing specific item
        } else {
            // Reset form for adding new ad-hoc item
            setIsEditing(false);
            resetFormFields(); // Use helper to reset
            setScheduledDate(formatDate(currentViewDate)); // Ensure date is current view date
        }
        setError(null); // Clear error on mode change or new item selected
    }, [selectedItem, currentViewDate]); // Rerun if selectedItem or currentViewDate changes


    // Effect to auto-fill fields when a formula is selected (only when ADDING new)
     useEffect(() => {
        if (!isEditing && selectedSourceFormula) {
            // Autofill fields from selected formula if they are empty
            if (!foodName) setFoodName(selectedSourceFormula.name || '');
            if (!quantity) setQuantity(selectedSourceFormula.default_quantity_ml || '');
            if (!calories) setCalories(selectedSourceFormula.default_calories || '');
            if (!protein) setProtein(selectedSourceFormula.default_protein_g || '');
            if (!carbs) setCarbs(selectedSourceFormula.default_carbs_g || '');
            if (!fat) setFat(selectedSourceFormula.default_fat_g || '');
            if (!description) setDescription(selectedSourceFormula.default_description || '');
        }
    }, [selectedSourceFormula, isEditing]); // Rerun only if selected formula changes while adding


    // --- Helper Functions ---
    const resetFormFields = () => {
         setFoodName(''); setTiming(''); setQuantity(''); setCalories('');
         setProtein(''); setCarbs(''); setFat(''); setDescription('');
         setImage(null); setImagePreview(null); setSelectedSourceFormula(null);
         if(fileInputRef.current) fileInputRef.current.value = null;
    }

    const handleImageChange = (e) => { /* ... unchanged ... */ };

    // --- Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Use internal loading state
        setError(null);

        // Basic Validation
        if (!foodName || !timing || !quantity || !scheduledDate) {
            setError("Food Name, Timing, Quantity, and Date are required.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        // ... (append form data - unchanged) ...
        formData.append('food_name', foodName);
        formData.append('scheduled_date', scheduledDate);
        formData.append('timing', timing);
        formData.append('quantity_ml', quantity);
        if (calories) formData.append('calories', calories);
        if (protein) formData.append('protein_g', protein);
        if (carbs) formData.append('carbs_g', carbs);
        if (fat) formData.append('fat_g', fat);
        if (description) formData.append('description', description);
        if (image) {
            formData.append('image', image);
        } else if (isEditing && !imagePreview) {
             formData.append('image', ''); // Signal backend to clear image
        }

        try {
            if (isEditing) {
                await updateDietItem(selectedItem.id, formData);
            } else {
                await addDietItem(formData); // Add ad-hoc item
            }
            resetFormFields(); // Clear fields after successful add
            clearSelection(); // Clear edit selection in parent
            refreshItems(); // Refresh list in parent component
        } catch (error) {
            console.error("Error submitting form:", error.response?.data || error.message);
             const backendError = error.response?.data;
            if (typeof backendError === 'object' && backendError !== null) {
                 setError(Object.entries(backendError).map(([key, value]) => `${key}: ${value.join ? value.join(', ') : value}`).join('; '));
            } else {
                setError(`Failed to ${isEditing ? 'update' : 'add'} item. Check console for details.`);
            }
        } finally {
            setLoading(false); // Turn off internal loading state
        }
    };

    return (
        // Use formDisabled which combines parent state and internal state
        <Paper elevation={0} sx={{ border: '1px solid #eee', p: 2, opacity: formDisabled ? 0.7 : 1 }}>
            <Typography variant="h6" gutterBottom>
                {isEditing ? 'Edit Daily Item' : 'Add Ad-hoc Daily Item'}
            </Typography>
            <form onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Grid container spacing={2}>
                    {/* Formula Selector - Show only when ADDING */}
                    {!isEditing && (
                         <Grid item xs={12}>
                            <Autocomplete
                                id="formula-select-adhoc"
                                options={availableFormulas}
                                getOptionLabel={(option) => option.name || ""}
                                value={selectedSourceFormula}
                                onChange={(event, newValue) => { setSelectedSourceFormula(newValue); }}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Formula to Pre-fill (Optional)" variant="outlined" size="small" />
                                )}
                                disabled={formDisabled} // Disable based on combined state
                            />
                        </Grid>
                    )}

                    {/* Standard Fields - Add disabled={formDisabled} to all */}
                    <Grid item xs={12} sm={isEditing ? 6 : 12}>
                         <TextField label="Food Name" value={foodName} onChange={(e) => setFoodName(e.target.value)} required fullWidth size="small" disabled={formDisabled} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                         <TextField label="Timing" type="time" value={timing} onChange={(e) => setTiming(e.target.value)} required fullWidth size="small" InputLabelProps={{ shrink: true }} disabled={formDisabled} />
                    </Grid>
                     <Grid item xs={6} sm={3}>
                         <TextField label="Date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required fullWidth size="small" InputLabelProps={{ shrink: true }} disabled={formDisabled || isEditing} />
                    </Grid>
                     <Grid item xs={6} sm={3}>
                         <TextField label="Quantity (ml)" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required fullWidth size="small" InputProps={{ inputProps: { min: 0 } }} disabled={formDisabled} />
                    </Grid>
                     <Grid item xs={6} sm={3}>
                         <TextField label="Calories (kcal)" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0 } }} disabled={formDisabled} />
                    </Grid>
                     <Grid item xs={4} sm={2}>
                         <TextField label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0, step: "0.1" } }} disabled={formDisabled} />
                    </Grid>
                     <Grid item xs={4} sm={2}>
                         <TextField label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0, step: "0.1" } }} disabled={formDisabled} />
                    </Grid>
                     <Grid item xs={4} sm={2}>
                         <TextField label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0, step: "0.1" } }} disabled={formDisabled} />
                    </Grid>
                    <Grid item xs={12}>
                         <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} size="small" disabled={formDisabled} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                         <TextField label="Image" type="file" InputLabelProps={{ shrink: true }} inputRef={fileInputRef} onChange={handleImageChange} fullWidth size="small" disabled={formDisabled} />
                    </Grid>
                     {imagePreview && ( <Grid item xs={12} sm={6}> {/* ... image preview ... */} </Grid> )}

                    {/* Actions - disable buttons based on formDisabled */}
                    <Grid item xs={12} sx={{ textAlign: 'right', mt: 1 }}>
                        <Button onClick={clearSelection} disabled={formDisabled} sx={{ mr: 1 }} size="small">
                            {isEditing ? 'Cancel Edit' : 'Clear Form'}
                        </Button>
                        <Button type="submit" variant="contained" disabled={formDisabled} size="small">
                            {loading ? <CircularProgress size={20} /> : (isEditing ? 'Update Item' : 'Add Item')}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}

export default DietForm;
