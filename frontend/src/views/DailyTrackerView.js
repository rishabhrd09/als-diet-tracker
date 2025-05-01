import React, { useState, useEffect, useCallback } from 'react';
import { getDietItems, getFoodFormulas } from '../api/dietApi'; // Need formulas for ad-hoc form
import DietList from '../components/DietList';
import DietForm from '../components/DietForm'; // Keep for ad-hoc additions/edits
import DailySummary from '../components/DailySummary';
import NextFeed from '../components/NextFeed';

// MUI Date Picker (if installed)
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// MUI Components
import {
    Container, Box, Typography, CircularProgress, Alert, Button, Grid,
    TextField, // If using standard HTML date input
    Paper // <<< Added Paper import here
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';


// Helper to format date to YYYY-MM-DD
const formatDate = (date) => {
   if (!date) return '';
   const d = new Date(date);
   let month = '' + (d.getMonth() + 1);
   let day = '' + d.getDate();
   const year = d.getFullYear();

   if (month.length < 2) month = '0' + month;
   if (day.length < 2) day = '0' + day;

   return [year, month, day].join('-');
}

function DailyTrackerView() {
    const [dietItems, setDietItems] = useState([]);
    const [formulas, setFormulas] = useState([]); // For ad-hoc form
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // For editing daily item
    const [showForm, setShowForm] = useState(false); // Toggle ad-hoc form visibility
    const [currentDate, setCurrentDate] = useState(new Date()); // Track the currently viewed date

    // Function to fetch items for the current date
    const fetchItems = useCallback(async (dateToFetch) => {
        setLoading(true);
        setError(null);
        const dateString = formatDate(dateToFetch);
        if (!dateString) {
             setError("Invalid date selected.");
             setLoading(false);
             setDietItems([]);
             return;
        }
        try {
            // Fetch items for the date (backend handles template generation)
            // Also fetch formulas if the form might be shown
            const [itemsResponse, formulasResponse] = await Promise.all([
                 getDietItems(dateString),
                 getFoodFormulas() // Fetch formulas for the ad-hoc form dropdown
            ]);
            setDietItems(itemsResponse.data);
            setFormulas(formulasResponse.data);
        } catch (err) {
            console.error("Error fetching daily diet items:", err);
            setError("Failed to load diet items. Please check the API connection or selected date.");
            setDietItems([]); // Clear items on error
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed here as date is passed in

    // Initial fetch and fetch on date change
    useEffect(() => {
        fetchItems(currentDate);
    }, [fetchItems, currentDate]);

    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowForm(true); // Show form when editing
    };

    const clearEditSelection = () => {
        setSelectedItem(null);
        // Keep form open or close it? Let's keep it open for now.
        // setShowForm(false); // Optionally close form when cancelling edit
    };

    // Function to refresh items (re-fetch for the current date)
    const refreshItems = () => {
        fetchItems(currentDate);
        // Optionally close form after successful ad-hoc add/edit
        // setShowForm(false);
        // setSelectedItem(null);
    };

    const handleDateChange = (newValue) => {
         // Handle date change from MUI DatePicker or standard input
         if (newValue instanceof Date && !isNaN(newValue)) {
             setCurrentDate(newValue);
         } else if (newValue?.target?.value) {
             // Handle standard HTML date input change
             const dateFromInput = new Date(newValue.target.value + 'T00:00:00'); // Ensure local time
             if (!isNaN(dateFromInput)) {
                 setCurrentDate(dateFromInput);
             }
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
         setCurrentDate(new Date());
     };

    return (
        <Container maxWidth="lg">
             {/* Date Navigation */}
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                 <Button onClick={goToPreviousDay} startIcon={<NavigateBeforeIcon />}>Prev Day</Button>
                 {/* Example using standard HTML date input */}
                 <TextField
                     type="date"
                     value={formatDate(currentDate)}
                     onChange={handleDateChange}
                     InputLabelProps={{ shrink: true }}
                     sx={{maxWidth: '180px'}}
                     size="small" // Make date input smaller
                 />
                 {/* Example using MUI DatePicker (requires LocalizationProvider setup in App.js or index.js) */}
                 {/* <DatePicker
                     label="Select Date"
                     value={currentDate}
                     onChange={handleDateChange}
                     renderInput={(params) => <TextField {...params} sx={{ mx: 1 }} />}
                 /> */}
                 <Button onClick={goToNextDay} endIcon={<NavigateNextIcon />}>Next Day</Button>
                 <Button onClick={goToToday} startIcon={<TodayIcon />} sx={{ ml: 1 }}>Today</Button>
             </Box>
             <Typography variant="h5" component="h2" align="center" gutterBottom>
                 Tracker for: {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </Typography>

             {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

             {loading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
             ) : (
                 <Grid container spacing={3}>
                     {/* Summary and Next Feed */}
                     <Grid item xs={12} md={4}>
                         <Paper elevation={2} sx={{ p: 2, mb: 2 }}> {/* Wrap summary in Paper */}
                            <DailySummary items={dietItems} />
                         </Paper>
                         <Paper elevation={2} sx={{ p: 2 }}> {/* Wrap next feed in Paper */}
                            <NextFeed items={dietItems} currentDate={currentDate} />
                         </Paper>
                         <Button
                             variant="outlined"
                             startIcon={<AddCircleOutlineIcon />}
                             onClick={() => { setSelectedItem(null); setShowForm(!showForm); }} // Clear selection when toggling form
                             sx={{ mt: 2, width: '100%' }}
                         >
                            {showForm ? 'Hide Ad-hoc Form' : 'Add Ad-hoc Item'}
                         </Button>
                     </Grid>

                     {/* Main Timeline / Ad-hoc Form */}
                     <Grid item xs={12} md={8}>
                         {showForm && (
                             // Using Box with component=Paper was the likely source of the error if Paper wasn't imported
                             <Box component={Paper} elevation={2} sx={{ p: 2, mb: 3 }}>
                                 {/* Pass formulas to DietForm for selection */}
                                 <DietForm
                                    refreshItems={refreshItems}
                                    selectedItem={selectedItem} // For editing existing daily items
                                    clearSelection={clearEditSelection}
                                    currentViewDate={currentDate}
                                    availableFormulas={formulas} // Pass formulas
                                 />
                             </Box>
                         )}

                         <Typography variant="h6" component="h3" gutterBottom>Feeding Timeline</Typography>
                         {/* Wrap DietList in Paper for consistent styling */}
                         <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 } }}> {/* Add some padding */}
                            <DietList
                                items={dietItems}
                                refreshItems={refreshItems}
                                onEdit={handleEdit} // Enable editing daily items
                            />
                         </Paper>
                     </Grid>
                 </Grid>
             )}
        </Container>
    );
}

export default DailyTrackerView;
