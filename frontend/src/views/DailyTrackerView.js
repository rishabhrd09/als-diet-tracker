import React, { useState, useEffect, useCallback } from 'react';
// Import API functions (resetDayToTemplate is removed)
import { getDietItems, getFoodFormulas } from '../api/dietApi';
// Import components used in this view
import DietList from '../components/DietList';
import DietForm from '../components/DietForm';
import DailySummary from '../components/DailySummary';
import NextFeed from '../components/NextFeed';

// MUI Components for UI elements
import {
    Container, Box, Typography, CircularProgress, Alert, Button, Grid,
    TextField, Paper, Tooltip // Removed Tooltip as reset button is gone
} from '@mui/material';
// MUI Icons for buttons
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// Removed RestartAltIcon


/** Helper function to format date */
const formatDate = (date) => {
   if (!date || !(date instanceof Date) || isNaN(date)) return '';
   const d = new Date(date);
   let month = '' + (d.getMonth() + 1);
   let day = '' + d.getDate();
   const year = d.getFullYear();
   if (month.length < 2) month = '0' + month;
   if (day.length < 2) day = '0' + day;
   return [year, month, day].join('-');
};

/** Main component for the Daily Tracker view. */
function DailyTrackerView() {
    // --- State Variables ---
    const [dietItems, setDietItems] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true); // Only need general loading state now
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- Data Fetching ---
    // fetchItems now simply fetches data, backend handles sync
    const fetchItems = useCallback(async (dateToFetch) => {
        setLoading(true);
        setError(null);
        const dateString = formatDate(dateToFetch);

        if (!dateString) {
             setError("Invalid date selected.");
             setLoading(false);
             setDietItems([]);
             setFormulas([]);
             return;
        }

        try {
            // Fetch both diet items for the date and all food formulas concurrently
            // Backend automatically syncs template items for today/future dates
            const [itemsResponse, formulasResponse] = await Promise.all([
                 getDietItems(dateString),
                 getFoodFormulas()
            ]);
            setDietItems(itemsResponse.data);
            setFormulas(formulasResponse.data);
        } catch (err) {
            console.error("Error fetching daily tracker data:", err);
             if (err.response) {
                 console.error("API Response Data:", err.response.data);
                 console.error("API Response Status:", err.response.status);
                 setError(`Failed to load data (Status: ${err.response.status}). Check API connection.`);
             } else if (err.request) {
                 console.error("API No Response:", err.request);
                  setError("Failed to load data. No response from API server. Is it running?");
             } else {
                 console.error('API Request Setup Error:', err.message);
                 setError(`Failed to load data. Error: ${err.message}`);
             }
            setDietItems([]);
            setFormulas([]);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array

    // Effect to fetch data when the component mounts or the currentDate changes
    useEffect(() => {
        fetchItems(currentDate);
    }, [fetchItems, currentDate]);

    // --- Event Handlers ---
    const handleEdit = (item) => { setSelectedItem(item); setShowForm(true); };
    const clearEditSelection = () => { setSelectedItem(null); };
    const refreshItems = () => { fetchItems(currentDate); }; // Refresh fetches current date again
    const handleDateChange = (event) => {
         if (event?.target?.value) {
             const [year, month, day] = event.target.value.split('-');
             const dateFromInput = new Date(year, month - 1, day);
             if (!isNaN(dateFromInput)) { setCurrentDate(dateFromInput); }
         }
    };
    const goToPreviousDay = () => {
        const prevDay = new Date(currentDate);
        prevDay.setDate(currentDate.getDate() - 1);
        setCurrentDate(prevDay);
     };
    const goToNextDay = () => {
        const nextDay = new Date(currentDate);
        nextDay.setDate(currentDate.getDate() + 1);
        setCurrentDate(nextDay);
     };
    const goToToday = () => {
         const today = new Date();
         if (formatDate(currentDate) !== formatDate(today)) {
            setCurrentDate(today);
         }
     };
    // --- REMOVED handleResetDay function ---

    // --- Render Logic ---
    // Simplified disable logic - only based on general loading
    const disableInteractions = loading;

    return (
        <Container maxWidth="lg">
             {/* Date Navigation Controls */}
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                 <Button onClick={goToPreviousDay} startIcon={<NavigateBeforeIcon />} disabled={disableInteractions}>Prev Day</Button>
                 <TextField
                     type="date" value={formatDate(currentDate)} onChange={handleDateChange}
                     InputLabelProps={{ shrink: true }} sx={{maxWidth: '180px'}} size="small"
                     disabled={disableInteractions}
                 />
                 <Button onClick={goToNextDay} endIcon={<NavigateNextIcon />} disabled={disableInteractions}>Next Day</Button>
                 <Button onClick={goToToday} startIcon={<TodayIcon />} sx={{ ml: 1 }} disabled={disableInteractions}>Today</Button>
                 {/* --- REMOVED Reset Button --- */}
             </Box>

             {/* Display the current date */}
             <Typography variant="h5" component="h2" align="center" gutterBottom>
                 Tracker for: {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </Typography>

             {/* Display Error Messages */}
             {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

             {/* Main Content Area */}
             {loading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
             ) : (
                 <Grid container spacing={3}>
                     {/* Left Column */}
                     <Grid container direction="column" item xs={12} md={4} spacing={2}>
                        <Grid item>
                             <Paper elevation={2} sx={{ p: 2 }}> <DailySummary items={dietItems} /> </Paper>
                        </Grid>
                        <Grid item>
                             <Paper elevation={2} sx={{ p: 2 }}> <NextFeed items={dietItems} currentDate={currentDate} /> </Paper>
                        </Grid>
                        <Grid item>
                             <Button
                                 variant="outlined" startIcon={<AddCircleOutlineIcon />}
                                 onClick={() => { setSelectedItem(null); setShowForm(!showForm); }}
                                 sx={{ width: '100%' }} disabled={disableInteractions}
                             >
                                {showForm ? 'Hide Ad-hoc Form' : 'Add Ad-hoc Item'}
                             </Button>
                        </Grid>
                     </Grid>

                     {/* Right Column */}
                     <Grid item xs={12} md={8}>
                         {/* Ad-hoc/Edit Form */}
                         {showForm && (
                             <Box sx={{ mb: 3 }}>
                                 <DietForm
                                    refreshItems={refreshItems} selectedItem={selectedItem}
                                    clearSelection={clearEditSelection} currentViewDate={currentDate}
                                    availableFormulas={formulas}
                                    isDisabled={disableInteractions} // Pass general loading state
                                 />
                             </Box>
                         )}

                         {/* Feeding Timeline */}
                         <Typography variant="h6" component="h3" gutterBottom>Feeding Timeline</Typography>
                         <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 } }}>
                            <DietList
                                items={dietItems} refreshItems={refreshItems}
                                onEdit={handleEdit}
                                isDisabled={disableInteractions} // Pass general loading state
                            />
                         </Paper>
                     </Grid>
                 </Grid>
             )}
        </Container>
    );
}

export default DailyTrackerView;
