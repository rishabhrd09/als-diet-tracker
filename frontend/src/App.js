import React, { useState } from 'react'; // Import useState
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// MUI Components
import {
    AppBar, Toolbar, Typography, Container, Tabs, Tab, Box, CssBaseline,
    createTheme, ThemeProvider, Button, Tooltip // Import Button & Tooltip
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EditNoteIcon from '@mui/icons-material/EditNote'; // Icon for edit mode
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for read-only mode

// Views
import DailyTrackerView from './views/DailyTrackerView';
import ScheduleTemplateView from './views/ScheduleTemplateView';
import FormulaLibraryView from './views/FormulaLibraryView';

// MUI Date Picker Setup (Ensure these are installed: @mui/x-date-pickers date-fns)
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';


// Create a basic MUI theme (customize as needed)
const theme = createTheme({
    palette: {
        primary: {
            main: '#4a90e2', // Professional blue
        },
        secondary: {
            main: '#f5a623', // An accent color (e.g., orange)
        },
    },
    typography: {
        fontFamily: 'Roboto, Helvetica, Arial, sans-serif', // Standard MUI font
    },
    components: {
        MuiButton: {
            defaultProps: { },
            styleOverrides: { root: { textTransform: 'none', } }
        },
         MuiTextField: {
             defaultProps: { variant: 'outlined', margin: 'dense', size: 'small' }
         },
         MuiTooltip: {
            styleOverrides: { tooltip: { fontSize: '0.8rem', backgroundColor: 'rgba(0, 0, 0, 0.85)', } }
         }
    },
});


// Helper component to manage Tab state based on route
function NavigationTabs() {
    const location = useLocation();
    const routeMap = ['/', '/schedule', '/library'];
    let currentTab = routeMap.indexOf(location.pathname);
    if (currentTab === -1) { currentTab = 0; } // Fallback to the first tab

    return (
         <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Tabs value={currentTab} centered indicatorColor="primary" textColor="primary">
                <Tab label="Daily Tracker" component={Link} to="/" />
                <Tab label="Fixed Schedule" component={Link} to="/schedule" />
                <Tab label="Formula Library" component={Link} to="/library" />
            </Tabs>
        </Box>
    );
}

// Main Application Component
function App() {
    // --- Edit Mode State ---
    const [isEditMode, setIsEditMode] = useState(false); // Default to read-only mode

    // Function to toggle edit mode
    const toggleEditMode = () => {
        // --- Placeholder for Permissions ---
        if (!isEditMode) {
            // Simulate permission check
            if (window.confirm("Enable editing mode?\n(Permissions would be checked in a real application)")) {
                setIsEditMode(true);
            }
        } else {
            // Exiting edit mode
            setIsEditMode(false);
        }
        // --- End Placeholder ---
    };
    // --- End Edit Mode State ---

    return (
        // Apply the theme, CSS baseline, and Date Localization
        <ThemeProvider theme={theme}>
         <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline /> {/* Normalizes browser styles */}
            <BrowserRouter> {/* Sets up routing */}
                {/* Top Application Bar */}
                <AppBar position="static" elevation={1} color="primary">
                    <Container maxWidth="lg">
                         <Toolbar disableGutters> {/* disableGutters for less padding */}
                             <RestaurantMenuIcon sx={{ mr: 1 }} /> {/* App Icon */}
                            {/* App Title */}
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                                ALS Tube Feeding Tracker
                            </Typography>
                            {/* --- Edit Mode Toggle Button --- */}
                            <Tooltip title={isEditMode ? "Switch to Read-Only View" : "Enable Editing (Requires Permission)"}>
                                <Button
                                    variant="outlined" // Outlined style stands out less
                                    color="inherit" // Use AppBar's text color
                                    size="small"
                                    // Switch icon based on mode
                                    startIcon={isEditMode ? <VisibilityIcon /> : <EditNoteIcon />}
                                    onClick={toggleEditMode}
                                >
                                    {isEditMode ? 'View Mode' : 'Edit Mode'}
                                </Button>
                            </Tooltip>
                            {/* --- End Button --- */}
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* Navigation Tabs */}
                <NavigationTabs />

                {/* Main Content Area */}
                <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}> {/* Add margin top/bottom */}
                    <Routes>
                        {/* --- Pass isEditMode state down to each View --- */}
                        <Route path="/" element={<DailyTrackerView isEditMode={isEditMode} />} />
                        <Route path="/schedule" element={<ScheduleTemplateView isEditMode={isEditMode} />} />
                        <Route path="/library" element={<FormulaLibraryView isEditMode={isEditMode} />} />
                        {/* Add a fallback route for unknown paths (optional) */}
                        {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
                    </Routes>
                </Container>

                 {/* Footer (Optional) */}
                 <Box component="footer" sx={{ bgcolor: '#f5f5f5', p: 2, mt: 'auto', borderTop: '1px solid #ddd' }}>
                    <Container maxWidth="lg">
                        <Typography variant="body2" color="text.secondary" align="center">
                            © {new Date().getFullYear()} Diet Tracker App
                        </Typography>
                    </Container>
                </Box>
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
