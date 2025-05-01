import React from 'react';
import './NextFeed.css'; // Create CSS

// Helper function to parse HH:MM:SS time string into Date object for comparison
const parseTimeString = (timeStr, date) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const dateTime = new Date(date); // Use the provided date
    dateTime.setHours(hours, minutes, seconds, 0);
    return dateTime;
};


function NextFeed({ items, currentDate }) {
    const now = new Date(); // Current time

    // Filter for items on the current date that are pending (not administered or skipped)
    // And whose scheduled time is in the future
    const upcomingItems = items
        .filter(item => !item.is_administered && !item.is_skipped)
        .map(item => ({
            ...item,
            // Create a comparable Date object for the item's scheduled time today
            scheduledDateTime: parseTimeString(item.timing, currentDate) 
        }))
        .filter(item => item.scheduledDateTime > now) // Filter for future times
        .sort((a, b) => a.scheduledDateTime - b.scheduledDateTime); // Sort by time

    const nextFeed = upcomingItems.length > 0 ? upcomingItems[0] : null;

    if (!nextFeed) {
        return <div className="next-feed">No upcoming feeds scheduled for the rest of today.</div>;
    }

    return (
        <div className="next-feed upcoming">
            <h4>Coming up next ({nextFeed.timing_display}):</h4>
            <p>
                <strong>{nextFeed.food_name}</strong> ({nextFeed.quantity_ml} ml)
                {nextFeed.calories && ` - ${nextFeed.calories} kcal`}
            </p>
             {/* Optional: Add administer/skip buttons here too? */}
        </div>
    );
}

export default NextFeed;