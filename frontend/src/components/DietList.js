import React from 'react';
import DietListItem from './DietListItem';
// Assuming DietList.css exists for basic list styling if needed
// import './DietList.css';

// Accept isDisabled prop
function DietList({ items, refreshItems, onEdit, isDisabled }) {
    if (!items || items.length === 0) {
        // Use Typography for consistent styling if using MUI elsewhere
        // return <Typography align="center" color="text.secondary" sx={{mt: 3}}>No diet items scheduled for this date.</Typography>;
        return <p style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>No diet items scheduled for this date.</p>;
    }

    // Sorting is handled by backend now, but double-checking doesn't hurt
    // const sortedItems = [...items].sort((a, b) => { ... });
    // Using items directly as returned by backend

    return (
        // Use MUI List component for better integration? Optional.
        // <List disablePadding> ... </List>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map(item => (
                // Pass isDisabled down to each item
                <DietListItem
                    key={item.id} // Crucial for React updates
                    item={item}
                    refreshItems={refreshItems}
                    onEdit={onEdit}
                    isDisabled={isDisabled} // Pass the flag down
                />
            ))}
        </ul>
    );
}

export default DietList;
