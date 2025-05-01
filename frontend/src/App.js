import React, { useState, useEffect, useCallback } from 'react';
import { getDietItems } from './api/dietApi';
import DietList from './components/DietList';
import DietForm from './components/DietForm';
import DailySummary from './components/DailySummary';
import NextFeed from './components/NextFeed';
import './App.css'; // Main CSS file

// Helper to format date to YYYY-MM-DD
const formatDate = (date) => {
   const d = new Date(date);
   let month = '' + (d.getMonth() + 1);
   let day = '' + d.getDate();
   const year = d.getFullYear();

   if (month.length < 2) month = '0' + month;
   if (day.length < 2) day = '0' + day;

   return [year, month, day].join('-');
}

function App() {
    const [dietItems, setDietItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // For editing
    const [showForm, setShowForm] = useState(false); // Toggle form visibility
    const [currentDate, setCurrentDate] = useState(new Date()); // Track the currently viewed date

    // Function to fetch items, memoized with useCallback
    const fetchItems = useCallback(async (date) => {
        setLoading(true);
        setError(null);
        try {
            const dateString = formatDate(date); // Format date for API
            const response = await getDietItems(dateString);
            setDietItems(response.data);
        } catch (err) {
            console.error("Error fetching diet items:", err);
            setError("Failed to load diet items. Please check your connection or the API.");
            setDietItems([]); // Clear items on error
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    // Initial fetch on component mount and when currentDate changes
    useEffect(() => {
        fetchItems(currentDate);
    }, [fetchItems, currentDate]); // Depend on fetchItems and currentDate

    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowForm(true); // Show form when editing
    };

    const clearEditSelection = () => {
        setSelectedItem(null);
    };

    // Function to refresh items (re-fetch for the current date)
    const refreshItems = () => {
        fetchItems(currentDate); 
    };

    const handleDateChange = (event) => {
        setCurrentDate(new Date(event.target.value + 'T00:00:00')); // Set to start of the selected day in local time
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
        <div className="App">
            <header className="app-header">
                <h1>Papa Ka Diet chart</h1>
                 {/* Add buttons as requested if needed, or integrate form toggle */}
                <button onClick={() => setShowForm(!showForm)} className="toggle-form-btn">
                    {showForm ? 'Hide Form' : (selectedItem ? 'Edit Item' : 'Add New Item')}
                </button>
                 <button onClick={goToToday} className="nav-btn">Go to Today</button>
            </header>

            <main>
                <div className="date-navigation">
                     <button onClick={goToPreviousDay} className="nav-btn">&lt; Prev Day</button>
                     <input 
                        type="date" 
                        value={formatDate(currentDate)} 
                        onChange={handleDateChange} 
                        className="date-selector"
                      />
                     <button onClick={goToNextDay} className="nav-btn">Next Day &gt;</button>
                     <h2>Schedule for: {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                </div>


                {error && <p className="error-message">{error}</p>}

                {loading && <p>Loading...</p>}

                {!loading && !error && (
                    <>
                         <DailySummary items={dietItems} />
                         <NextFeed items={dietItems} currentDate={currentDate} />

                         {/* Conditionally render form */}
                         {showForm && (
                             <div className="form-container">
                                 <DietForm 
                                    refreshItems={refreshItems} 
                                    selectedItem={selectedItem}
                                    clearSelection={clearEditSelection}
                                    currentViewDate={currentDate} // Pass the current date to the form
                                 />
                             </div>
                         )}

                         <div className="list-container">
                            <h3>Feeding Timeline</h3>
                            <DietList 
                                items={dietItems} 
                                refreshItems={refreshItems} 
                                onEdit={handleEdit} 
                            />
                         </div>
                    </>
                )}
            </main>

            <footer className="app-footer">
                {/* Footer content if needed */}
            </footer>
        </div>
    );
}

export default App;