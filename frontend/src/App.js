import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// MUI Components
import {
    AppBar, Toolbar, Typography, Container, Tabs, Tab, Box, CssBaseline, createTheme, ThemeProvider
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'; // Example Icon

// Views
import DailyTrackerView from './views/DailyTrackerView';
import ScheduleTemplateView from './views/ScheduleTemplateView';
import FormulaLibraryView from './views/FormulaLibraryView';

// Import base CSS if needed, but MUI handles most styling
// import './App.css';

// Create a basic MUI theme (optional, customize as needed)
const theme = createTheme({
    palette: {
        primary: {
            main: '#4a90e2', // Your professional blue
        },
        secondary: {
            main: '#f5a623', // An accent color (e.g., orange)
        },
    },
    typography: {
        fontFamily: 'sans-serif', // Keep it simple
    },
    components: {
        // Example: Default props for Button
        MuiButton: {
            defaultProps: {
                // variant: 'contained', // Make all buttons contained by default?
            },
        },
         MuiTextField: {
             defaultProps: {
                 variant: 'outlined', // Use outlined style for text fields
                 margin: 'dense', // Use dense margin
             }
         }
    },
});


// Helper component to manage Tab state based on route
function NavigationTabs() {
    const location = useLocation();
    const routeMap = ['/', '/schedule', '/library'];
    // Find the index corresponding to the current pathname
    let currentTab = routeMap.indexOf(location.pathname);
    // Default to 0 (Daily Tracker) if route not found
    if (currentTab === -1) {
        currentTab = 0;
    }

    return (
         <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Tabs value={currentTab} centered indicatorColor="primary" textColor="primary">
                {/* Use component={Link} to make Tabs act as router links */}
                <Tab label="Daily Tracker" component={Link} to="/" />
                <Tab label="Fixed Schedule" component={Link} to="/schedule" />
                <Tab label="Formula Library" component={Link} to="/library" />
            </Tabs>
        </Box>
    );
}

function App() {
    return (
        // Apply the theme and baseline CSS reset
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <AppBar position="static" elevation={1}>
                    <Container maxWidth="lg">
                         <Toolbar disableGutters> {/* disableGutters removes default padding */}
                             <RestaurantMenuIcon sx={{ mr: 1 }} /> {/* Add an icon */}
                            <Typography
                                variant="h6"
                                component="div"
                                sx={{ flexGrow: 1, fontWeight: 'bold' }} // Make title bold
                            >
                                ALS Tube Feeding Tracker
                            </Typography>
                            {/* Add any other header elements here if needed */}
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* Navigation Tabs */}
                <NavigationTabs />

                {/* Main Content Area */}
                <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}> {/* Add margin top/bottom */}
                    <Routes>
                        {/* Route mapping */}
                        <Route path="/" element={<DailyTrackerView />} />
                        <Route path="/schedule" element={<ScheduleTemplateView />} />
                        <Route path="/library" element={<FormulaLibraryView />} />
                        {/* Add a fallback route for unknown paths (optional) */}
                        {/* <Route path="*" element={<NotFoundView />} /> */}
                    </Routes>
                </Container>

                 {/* Footer (Optional) */}
                 <Box component="footer" sx={{ bgcolor: 'background.paper', p: 2, mt: 'auto', borderTop: '1px solid #eee' }}>
                    <Container maxWidth="lg">
                        <Typography variant="body2" color="text.secondary" align="center">
                            {/* Footer content here */}
                            © {new Date().getFullYear()} Diet Tracker
                        </Typography>
                    </Container>
                </Box>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;