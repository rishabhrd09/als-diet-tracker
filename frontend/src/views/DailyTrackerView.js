// src/views/DailyTrackerView.js
import React, { useState, useEffect, useCallback } from 'react';
// --- ADD MISSING IMPORTS ---
import DietList from '../components/DietList';
import DietForm from '../components/DietForm';
import DailySummary from '../components/DailySummary';
import NextFeed from '../components/NextFeed';
// --- END MISSING IMPORTS ---
import { getDietItems, getFoodFormulas } from '../api/dietApi'; // Keep existing API imports
import { Container, Box, Typography, CircularProgress, Alert, Button, Grid, Paper, TextField } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1); let day = '' + d.getDate(); const year = d.getFullYear();
    if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

// --- Date Range Constants ---
const MAX_DAYS_PAST = 30;
const MAX_DAYS_FUTURE = 30;

function DailyTrackerView({ isEditMode }) {
    // ... (state variables remain the same) ...
    const [dietItems, setDietItems] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // fetchItems remains the same
    const fetchItems = useCallback(async (dateToFetch) => {
        setLoading(true); setError(null); const dateString = formatDate(dateToFetch);
        if (!dateString) { setError("Invalid date selected."); setLoading(false); setDietItems([]); setFormulas([]); return; }
        try {
            const [itemsResponse, formulasResponse] = await Promise.all([ getDietItems(dateString), getFoodFormulas() ]);
            setDietItems(itemsResponse.data); setFormulas(formulasResponse.data);
        } catch (err) {
            console.error("Error fetching daily tracker data:", err);
            if (err.response) { setError(`Failed to load data (Status: ${err.response.status}). Check API connection.`); }
            else if (err.request) { setError("Failed to load data. No response from API server."); }
            else { setError(`Failed to load data. Error: ${err.message}`); }
            setDietItems([]); setFormulas([]);
        } finally { setLoading(false); }
     }, []);
    useEffect(() => { fetchItems(currentDate); }, [fetchItems, currentDate]);

    // Event Handlers
    const handleEdit = (item) => { if (isEditMode) { setSelectedItem(item); setShowForm(true); } };
    const clearEditSelection = () => { setSelectedItem(null); };
    const refreshItems = () => { fetchItems(currentDate); };
    const handleDateChange = (event) => {
        if (event?.target?.value) {
             const [year, month, day] = event.target.value.split('-');
             const dateFromInput = new Date(year, month - 1, day);
             if (!isNaN(dateFromInput)) { setCurrentDate(dateFromInput); }
         }
    };
    const goToPreviousDay = () => {
        const prevDay = new Date(currentDate); prevDay.setDate(currentDate.getDate() - 1); setCurrentDate(prevDay);
    };
    const goToNextDay = () => {
        const nextDay = new Date(currentDate); nextDay.setDate(currentDate.getDate() + 1); setCurrentDate(nextDay);
    };
    const goToToday = () => {
        const todayDt = new Date(); if (formatDate(currentDate) !== formatDate(todayDt)) { setCurrentDate(todayDt); }
    };

    const disableInteractions = loading;

    // --- Calculate Date Limits ---
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minDate = new Date(today); minDate.setDate(today.getDate() - MAX_DAYS_PAST);
    const maxDate = new Date(today); maxDate.setDate(today.getDate() + MAX_DAYS_FUTURE);
    const canGoPrev = currentDate > minDate;
    const canGoNext = currentDate < maxDate;
    // --- End Date Limit Calculation ---

    return (
        <Container maxWidth="lg">
             {/* Date Navigation Controls with Limits */}
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                 <Button onClick={goToPreviousDay} startIcon={<NavigateBeforeIcon />} disabled={disableInteractions || !canGoPrev}>Prev Day</Button>
                 <TextField
                     type="date" value={formatDate(currentDate)} onChange={handleDateChange}
                     InputLabelProps={{ shrink: true }} sx={{maxWidth: '180px'}} size="small"
                     disabled={disableInteractions}
                     inputProps={{ min: formatDate(minDate), max: formatDate(maxDate) }}
                 />
                 <Button onClick={goToNextDay} endIcon={<NavigateNextIcon />} disabled={disableInteractions || !canGoNext}>Next Day</Button>
                 <Button onClick={goToToday} startIcon={<TodayIcon />} sx={{ ml: 1 }} disabled={disableInteractions}>Today</Button>
             </Box>

             <Typography variant="h5" component="h2" align="center" gutterBottom> Tracker for: {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} </Typography>
             {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
             {loading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box> ) : (
                 <Grid container spacing={3}>
                     {/* Left Column */}
                     <Grid container direction="column" item xs={12} md={4} spacing={2}>
                        <Grid item>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                {/* Use the imported component */}
                                <DailySummary items={dietItems} />
                            </Paper>
                        </Grid>
                        <Grid item>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                {/* Use the imported component */}
                                <NextFeed items={dietItems} currentDate={currentDate} />
                            </Paper>
                        </Grid>
                        {isEditMode && (
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={() => { setSelectedItem(null); setShowForm(!showForm); }}
                                    sx={{ width: '100%' }}
                                    disabled={disableInteractions}
                                >
                                    {showForm && selectedItem === null ? 'Hide Add Form' : 'Add Ad-hoc Item'}
                                </Button>
                            </Grid>
                        )}
                     </Grid>
                     {/* Right Column */}
                     <Grid item xs={12} md={8}>
                         {isEditMode && showForm && (
                             <Box sx={{ mb: 3 }}>
                                 {/* Use the imported component */}
                                 <DietForm
                                     refreshItems={refreshItems}
                                     selectedItem={selectedItem}
                                     clearSelection={clearEditSelection}
                                     currentViewDate={currentDate}
                                     availableFormulas={formulas}
                                     isDisabled={disableInteractions}
                                 />
                             </Box>
                         )}
                         <Typography variant="h6" component="h3" gutterBottom>Feeding Timeline</Typography>
                         <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 } }}>
                            {/* Use the imported component */}
                            <DietList
                                items={dietItems}
                                refreshItems={refreshItems}
                                isDisabled={disableInteractions}
                                isEditMode={isEditMode}
                                onEdit={handleEdit}
                            />
                         </Paper>
                     </Grid>
                 </Grid>
             )}
        </Container>
    );
}

export default DailyTrackerView;
