import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './index.css'; // MUI's CssBaseline handles resets, you might not need this

// --- MUI Date Picker Setup (if using @mui/x-date-pickers) ---
// 1. Choose your date library adapter (e.g., date-fns)
// Using the standard AdapterDateFns path, ensure @mui/x-date-pickers and date-fns are installed
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// Or: import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// Or: import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
// Or: import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

// 2. Import the LocalizationProvider
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// --- End Date Picker Setup ---


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap App with LocalizationProvider if using MUI Date Pickers */}
     <LocalizationProvider dateAdapter={AdapterDateFns}>
        <App />
     </LocalizationProvider>
     {/* If not using MUI Date Pickers, just render <App /> */}
     {/* <App /> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(); // Optional
