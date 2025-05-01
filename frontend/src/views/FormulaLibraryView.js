import React, { useState, useEffect, useCallback } from 'react';
import { getFoodFormulas, deleteFoodFormula } from '../api/dietApi';
import FormulaForm from '../components/FormulaForm'; // We will create this next

// MUI Components
import {
    Container, Typography, Box, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function FormulaLibraryView() {
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFormula, setSelectedFormula] = useState(null); // For editing

    const fetchFormulas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getFoodFormulas();
            setFormulas(response.data);
        } catch (err) {
            console.error("Error fetching formulas:", err);
            setError("Failed to load formula library. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFormulas();
    }, [fetchFormulas]);

    const handleOpenModal = (formula = null) => {
        setSelectedFormula(formula); // Set to null for Add, formula object for Edit
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedFormula(null); // Clear selection on close
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        fetchFormulas(); // Refresh the list after saving
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the formula "${name}"? This cannot be undone.`)) {
            try {
                await deleteFoodFormula(id);
                fetchFormulas(); // Refresh list
            } catch (err) {
                console.error("Error deleting formula:", err);
                setError(`Failed to delete formula "${name}". It might be in use in the schedule template.`);
                // Clear error after some time
                setTimeout(() => setError(null), 5000);
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Food Formula Library
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => handleOpenModal()}
                >
                    Add New Formula
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="formula table">
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                <TableCell>Name</TableCell>
                                <TableCell align="right">Qty (ml)</TableCell>
                                <TableCell align="right">Calories (kcal)</TableCell>
                                <TableCell align="right">Protein (g)</TableCell>
                                <TableCell align="right">Carbs (g)</TableCell>
                                <TableCell align="right">Fat (g)</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {formulas.map((formula) => (
                                <TableRow
                                    key={formula.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {formula.name}
                                    </TableCell>
                                    <TableCell align="right">{formula.default_quantity_ml ?? '-'}</TableCell>
                                    <TableCell align="right">{formula.default_calories ?? '-'}</TableCell>
                                    <TableCell align="right">{formula.default_protein_g ?? '-'}</TableCell>
                                    <TableCell align="right">{formula.default_carbs_g ?? '-'}</TableCell>
                                    <TableCell align="right">{formula.default_fat_g ?? '-'}</TableCell>
                                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formula.default_description}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => handleOpenModal(formula)} color="primary" aria-label="edit">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(formula.id, formula.name)} color="error" aria-label="delete">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {formulas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">No formulas found. Add some!</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal for Add/Edit Form */}
            <FormulaForm
                open={isModalOpen}
                onClose={handleCloseModal}
                onSaveSuccess={handleSaveSuccess}
                formulaData={selectedFormula} // Pass selected formula for editing
            />
        </Container>
    );
}

export default FormulaLibraryView;
