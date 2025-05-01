import React, { useState, useEffect } from 'react';
import { addFoodFormula, updateFoodFormula } from '../api/dietApi';

// MUI Components
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Grid, CircularProgress, Alert
} from '@mui/material';

function FormulaForm({ open, onClose, onSaveSuccess, formulaData }) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // Pre-fill form if formulaData is provided (editing mode)
        if (formulaData) {
            setIsEditing(true);
            setName(formulaData.name || '');
            setQuantity(formulaData.default_quantity_ml || '');
            setCalories(formulaData.default_calories || '');
            setProtein(formulaData.default_protein_g || '');
            setCarbs(formulaData.default_carbs_g || '');
            setFat(formulaData.default_fat_g || '');
            setDescription(formulaData.default_description || '');
        } else {
            // Reset form for adding new
            setIsEditing(false);
            setName('');
            setQuantity('');
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setDescription('');
        }
        setError(null); // Clear error when opening/switching mode
    }, [formulaData, open]); // Depend on formulaData and open status

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            name: name,
            default_quantity_ml: quantity || null, // Send null if empty
            default_calories: calories || null,
            default_protein_g: protein || null,
            default_carbs_g: carbs || null,
            default_fat_g: fat || null,
            default_description: description,
        };

        try {
            if (isEditing) {
                await updateFoodFormula(formulaData.id, payload);
            } else {
                await addFoodFormula(payload);
            }
            onSaveSuccess(); // Notify parent view
        } catch (err) {
            console.error("Error saving formula:", err.response?.data || err.message);
            // Extract specific error messages if backend provides them
            const backendError = err.response?.data;
            if (typeof backendError === 'object' && backendError !== null) {
                 setError(Object.entries(backendError).map(([key, value]) => `${key}: ${value.join ? value.join(', ') : value}`).join('; '));
            } else {
                 setError(`Failed to ${isEditing ? 'update' : 'add'} formula. Please check the details.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Formula' : 'Add New Formula'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="name"
                                label="Formula Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                id="quantity"
                                label="Default Quantity (ml)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                InputProps={{ inputProps: { min: 0 } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                id="calories"
                                label="Default Calories (kcal)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                InputProps={{ inputProps: { min: 0 } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={4}>
                            <TextField
                                margin="dense"
                                id="protein"
                                label="Default Protein (g)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={4}>
                            <TextField
                                margin="dense"
                                id="carbs"
                                label="Default Carbs (g)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                                disabled={loading}
                            />
                        </Grid>
                         <Grid item xs={12} sm={4}>
                            <TextField
                                margin="dense"
                                id="fat"
                                label="Default Fat (g)"
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
                                label="Default Description/Notes"
                                type="text"
                                fullWidth
                                multiline
                                rows={3}
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
                        {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Formula' : 'Add Formula')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default FormulaForm;
