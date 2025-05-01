import React from 'react';
import DietListItem from './DietListItem';
import './DietList.css'; // Create CSS for list styling

function DietList({ items, refreshItems, onEdit }) {
    if (!items || items.length === 0) {
        return <p>No diet items scheduled for this date.</p>;
    }

    // Sort items by time before rendering (API already sorts, but good practice)
    const sortedItems = [...items].sort((a, b) => {
        // Convert HH:MM:SS to comparable values
        const timeA = a.timing.split(':').map(Number);
        const timeB = b.timing.split(':').map(Number);
        if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0]; // Compare hours
        if (timeA[1] !== timeB[1]) return timeA[1] - timeB[1]; // Compare minutes
        return timeA[2] - timeB[2]; // Compare seconds
    });


    return (
        <ul className="diet-list">
            {sortedItems.map(item => (
                <DietListItem 
                    key={item.id} 
                    item={item} 
                    refreshItems={refreshItems}
                    onEdit={onEdit} 
                />
            ))}
        </ul>
    );
}

export default DietList;