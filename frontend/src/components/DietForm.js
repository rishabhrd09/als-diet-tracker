import React, { useState, useEffect, useRef } from 'react';
import { addDietItem, updateDietItem } from '../api/dietApi';
// Ensure all necessary MUI components are imported
import {
    TextField, Button, Grid, Box, Typography, CircularProgress, Alert, Autocomplete, Paper
} from '@mui/material';

// Helper function to format date
const formatDate = (date) => {
   if (!date || !(date instanceof Date) || isNaN(date)) return '';
   const d = new Date(date);
   let month = '' + (d.getMonth() + 1); let day = '' + d.getDate(); const year = d.getFullYear();
   if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day;
   return [year, month, day].join('-');
};

// Accept onCloseForm prop
function DietForm({ refreshItems, selectedItem, clearSelection, currentViewDate, availableFormulas = [], isDisabled, onCloseForm }) {
    // --- State variables ---
    const [foodName, setFoodName] = useState('');
    const [timing, setTiming] = useState('');
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scheduledDate, setScheduledDate] = useState(formatDate(currentViewDate));
    const [selectedSourceFormula, setSelectedSourceFormula] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    // Combine external disable flag with internal loading state
    const formDisabled = isDisabled || loading;

    // Effect to pre-fill form when editing
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
            setSelectedSourceFormula(null); // Don't pre-select formula when editing specific item
        } else {
            setIsEditing(false);
            resetFormFields();
            setScheduledDate(formatDate(currentViewDate));
        }
        setError(null); // Clear error on mode change
    }, [selectedItem, currentViewDate]);

    // Effect to auto-fill from formula when adding
     useEffect(() => {
        if (!isEditing && selectedSourceFormula) {
            if (!foodName) setFoodName(selectedSourceFormula.name || '');
            if (!quantity) setQuantity(selectedSourceFormula.default_quantity_ml || '');
            if (!calories) setCalories(selectedSourceFormula.default_calories || '');
            if (!protein) setProtein(selectedSourceFormula.default_protein_g || '');
            if (!carbs) setCarbs(selectedSourceFormula.default_carbs_g || '');
            if (!fat) setFat(selectedSourceFormula.default_fat_g || '');
            if (!description) setDescription(selectedSourceFormula.default_description || '');
        }
    }, [selectedSourceFormula, isEditing, foodName, quantity, calories, protein, carbs, fat, description]);


    // Helper function to reset form fields
    const resetFormFields = () => {
         setFoodName(''); setTiming(''); setQuantity(''); setCalories('');
         setProtein(''); setCarbs(''); setFat(''); setDescription('');
         setImage(null); setImagePreview(null); setSelectedSourceFormula(null);
         if(fileInputRef.current) fileInputRef.current.value = null;
    };

    // Helper function for image input changes
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setImage(null);
            setImagePreview(selectedItem?.image || null);
        }
     };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        if (!foodName || !timing || !quantity || !scheduledDate) { setError("Food Name, Timing, Quantity, and Date are required."); setLoading(false); return; }

        const formData = new FormData();
        formData.append('food_name', foodName); formData.append('scheduled_date', scheduledDate); formData.append('timing', timing); formData.append('quantity_ml', quantity);
        formData.append('calories', calories || ''); formData.append('protein_g', protein || ''); formData.append('carbs_g', carbs || ''); formData.append('fat_g', fat || '');
        formData.append('description', description);
        if (image) { formData.append('image', image); } else if (isEditing && !imagePreview) { formData.append('image', ''); }

        try {
            if (isEditing && selectedItem?.id) { await updateDietItem(selectedItem.id, formData); }
            else if (!isEditing) { await addDietItem(formData); }
            else { throw new Error("Cannot update item without an ID."); }
            refreshItems(); clearSelection(); resetFormFields();
            if (onCloseForm) onCloseForm(); // Close form on success
        } catch (error) {
            console.error("Error submitting form:", error.response?.data || error.message);
             const backendError = error.response?.data;
            if (typeof backendError === 'object' && backendError !== null) { setError(Object.entries(backendError).map(([key, value]) => `${key}: ${value.join ? value.join(', ') : value}`).join('; ')); }
            else { setError(`Failed to ${isEditing ? 'update' : 'add'} item.`); }
        } finally { setLoading(false); }
    };

    // --- Handle Cancel ---
    const handleCancel = () => {
        clearSelection(); resetFormFields();
        if (onCloseForm) onCloseForm(); // Close form on cancel
    }

    // --- Render ---
    return (
        <Paper elevation={2} sx={{ p: 2, opacity: formDisabled ? 0.7 : 1 }}>
            <Typography variant="h6" gutterBottom> {isEditing ? `Edit Item (ID: ${selectedItem?.id})` : 'Add Ad-hoc Daily Item'} </Typography>
            <form onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                <Grid container spacing={2}>
                    {/* Formula Selector (only when adding) */}
                    {!isEditing && (
                         <Grid item xs={12}>
                            {/* --- VERIFIED AUTOCOMPLETE USAGE --- */}
                            <Autocomplete
                                id="formula-select-adhoc"
                                options={availableFormulas}
                                getOptionLabel={(option) => option.name || ""} // Function to display option text
                                value={selectedSourceFormula}
                                onChange={(event, newValue) => {
                                    setSelectedSourceFormula(newValue); // Update state with selected object
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value.id} // Function to compare options
                                renderInput={(params) => ( // Function to render the input field
                                    <TextField
                                        {...params} // Spread params onto TextField
                                        label="Select Formula to Pre-fill (Optional)"
                                        variant="outlined"
                                        size="small"
                                    />
                                )}
                                disabled={formDisabled}
                                fullWidth // Ensure it takes full width
                            />
                            {/* --- END VERIFIED AUTOCOMPLETE --- */}
                        </Grid>
                    )}
                    {/* Standard Fields - Ensure disabled={formDisabled} is applied */}
                    <Grid item xs={12} sm={isEditing ? 6 : 12}> <TextField label="Food Name" value={foodName} onChange={(e) => setFoodName(e.target.value)} required fullWidth size="small" disabled={formDisabled} /> </Grid>
                    <Grid item xs={6} sm={3}> <TextField label="Timing" type="time" value={timing} onChange={(e) => setTiming(e.target.value)} required fullWidth size="small" InputLabelProps={{ shrink: true }} disabled={formDisabled} /> </Grid>
                    <Grid item xs={6} sm={3}> <TextField label="Date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required fullWidth size="small" InputLabelProps={{ shrink: true }} disabled={formDisabled || isEditing} /> </Grid>
                    <Grid item xs={6} sm={3}> <TextField label="Quantity (ml)" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required fullWidth size="small" InputProps={{ inputProps: { min: 0 } }} disabled={formDisabled} /> </Grid>
                    <Grid item xs={6} sm={3}> <TextField label="Calories (kcal)" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0 } }} disabled={formDisabled} /> </Grid>
                    <Grid item xs={4} sm={2}> <TextField label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0, step: "0.1" } }} disabled={formDisabled} /> </Grid>
                    <Grid item xs={4} sm={2}> <TextField label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0, step: "0.1" } }} disabled={formDisabled} /> </Grid>
                    <Grid item xs={4} sm={2}> <TextField label="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0, step: "0.1" } }} disabled={formDisabled} /> </Grid>
                    <Grid item xs={12}> <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} size="small" disabled={formDisabled} /> </Grid>
                    <Grid item xs={12} sm={6}> <TextField label="Image" type="file" InputLabelProps={{ shrink: true }} inputRef={fileInputRef} onChange={handleImageChange} fullWidth size="small" disabled={formDisabled} InputProps={{inputProps: { accept:"image/*" }}}/> </Grid>
                    {imagePreview && ( <Grid item xs={12} sm={6}> <Box sx={{textAlign: 'center', position: 'relative'}}> <img src={imagePreview} alt="Preview" style={{ maxHeight: '80px', maxWidth: '100%', borderRadius: '4px', border: '1px solid #eee', display: 'block', margin: 'auto' }} /> <Button size="small" color="secondary" onClick={() => { setImage(null); setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = null;}} disabled={formDisabled} sx={{mt: 0.5}} > Remove Image </Button> </Box> </Grid> )}
                    {/* Actions */}
                    <Grid item xs={12} sx={{ textAlign: 'right', mt: 1 }}>
                        <Button onClick={handleCancel} disabled={formDisabled} sx={{ mr: 1 }} size="small" > {isEditing ? 'Cancel Edit' : 'Clear Form'} </Button>
                        <Button type="submit" variant="contained" disabled={formDisabled} size="small" > {loading ? <CircularProgress size={20} color="inherit"/> : (isEditing ? 'Update Item' : 'Add Item')} </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}

export default DietForm;
