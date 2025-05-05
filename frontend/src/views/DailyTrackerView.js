import React, { useState, useEffect, useCallback } from 'react';
import DietList from '../components/DietList';
import DietForm from '../components/DietForm';
import DailySummary from '../components/DailySummary';
import NextFeed from '../components/NextFeed';
import { getDietItems, getFoodFormulas } from '../api/dietApi';
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

const MAX_DAYS_PAST = 30;
const MAX_DAYS_FUTURE = 30;

function DailyTrackerView({ isEditMode }) {
    const [dietItems, setDietItems] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- fetchItems with Enhanced Logging ---
    const fetchItems = useCallback(async (dateToFetch) => {
        console.log(`fetchItems called for date: ${dateToFetch}`); // Log start
        setLoading(true);
        setError(null);
        const dateString = formatDate(dateToFetch);
        console.log(`Formatted date string: ${dateString}`);

        if (!dateString) {
             console.error("fetchItems: Invalid date provided.");
             setError("Invalid date selected.");
             setLoading(false);
             setDietItems([]);
             setFormulas([]);
             return;
        }

        try {
            console.log(`fetchItems: Attempting to fetch data for ${dateString}...`);
            // Fetch both diet items for the date and all food formulas concurrently
            const [itemsResponse, formulasResponse] = await Promise.all([
                 getDietItems(dateString),
                 getFoodFormulas()
            ]);
            console.log("fetchItems: API calls successful.");
            console.log("fetchItems: itemsResponse.data count:", itemsResponse.data?.length);
            console.log("fetchItems: formulasResponse.data count:", formulasResponse.data?.length);

            setDietItems(itemsResponse.data);
            setFormulas(formulasResponse.data);
            console.log("fetchItems: State updated successfully.");

        } catch (err) {
            // --- Enhanced Error Logging ---
            console.error("fetchItems: Error during API calls:", err);
             if (err.response) {
                 console.error("fetchItems: API Error Response Data:", err.response.data);
                 console.error("fetchItems: API Error Response Status:", err.response.status);
                 setError(`Failed to load data (Status: ${err.response.status}). Check API connection.`);
             } else if (err.request) {
                 console.error("fetchItems: API No Response Received:", err.request);
                  setError("Failed to load data. No response from API server. Is it running?");
             } else {
                 console.error('fetchItems: API Request Setup Error:', err.message);
                 setError(`Failed to load data. Error setting up request: ${err.message}`);
             }
            setDietItems([]); // Clear items on error
            setFormulas([]);
            // --- End Enhanced Error Logging ---
        } finally {
            console.log("fetchItems: Setting loading to false.");
            setLoading(false); // Ensure loading is always set to false
        }
    }, []); // Empty dependency array - function definition doesn't change

    // Effect to fetch data when the component mounts or the currentDate changes
    useEffect(() => {
        console.log(`useEffect triggered: currentDate changed to ${currentDate}`);
        fetchItems(currentDate);
    }, [fetchItems, currentDate]); // Dependencies: fetchItems function and currentDate state

    // --- Event Handlers ---
    const handleEdit = (item) => {
        if (isEditMode) {
            console.log("DailyTrackerView: handleEdit called with item:", JSON.stringify(item));
            if (!item || typeof item.id === 'undefined') {
                console.error("DailyTrackerView: Attempting to edit item with missing ID!", item);
                alert("Error: Cannot edit item without a valid ID.");
                return;
            }
            setSelectedItem(item);
            setShowForm(true);
        }
     };
    const clearEditSelection = () => { setSelectedItem(null); /* Optionally hide form: setShowForm(false); */ };
    const refreshItems = () => {
        console.log("refreshItems called, fetching for:", currentDate);
        fetchItems(currentDate);
    };
    const handleDateChange = (event) => {
        if (event?.target?.value) {
             const [year, month, day] = event.target.value.split('-');
             const dateFromInput = new Date(year, month - 1, day);
             if (!isNaN(dateFromInput)) {
                 console.log("handleDateChange: Setting new date:", dateFromInput);
                 setCurrentDate(dateFromInput);
             } else {
                 console.warn("handleDateChange: Invalid date from input:", event.target.value);
             }
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

    // Date Limits Calculation
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minDate = new Date(today); minDate.setDate(today.getDate() - MAX_DAYS_PAST);
    const maxDate = new Date(today); maxDate.setDate(today.getDate() + MAX_DAYS_FUTURE);
    const canGoPrev = currentDate > minDate;
    const canGoNext = currentDate < maxDate;

    console.log(`DailyTrackerView rendering. Loading: ${loading}, Error: ${error}, Items: ${dietItems.length}`); // Log render state

    return (
        <Container maxWidth="lg">
             {/* Date Navigation Controls */}
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

             {/* Main Content Area */}
             {loading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
             ) : (
                 <Grid container spacing={3}>
                     {/* Left Column */}
                     <Grid container direction="column" item xs={12} md={4} spacing={2}>
                        <Grid item> <Paper elevation={3} sx={{ p: 2 }}> <DailySummary items={dietItems} /> </Paper> </Grid>
                        <Grid item> <Paper elevation={3} sx={{ p: 2 }}> <NextFeed items={dietItems} currentDate={currentDate} /> </Paper> </Grid>
                        {isEditMode && ( <Grid item> <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => { setSelectedItem(null); setShowForm(!showForm); }} sx={{ width: '100%' }} disabled={disableInteractions} > {showForm && selectedItem === null ? 'Hide Add Form' : 'Add Ad-hoc Item'} </Button> </Grid> )}
                     </Grid>
                     {/* Right Column */}
                     <Grid item xs={12} md={8}>
                         {isEditMode && showForm && ( <Box sx={{ mb: 3 }}> <DietForm refreshItems={refreshItems} selectedItem={selectedItem} clearSelection={clearEditSelection} currentViewDate={currentDate} availableFormulas={formulas} isDisabled={disableInteractions} /> </Box> )}
                         <Typography variant="h6" component="h3" gutterBottom>Feeding Timeline</Typography>
                         <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 } }}>
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
