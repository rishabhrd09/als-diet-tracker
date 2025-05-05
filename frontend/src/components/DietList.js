import React from 'react';
import DietListItem from './DietListItem';
// import { List, Typography } from '@mui/material'; // Optional MUI imports

// --- Accept isEditMode and onEdit props ---
function DietList({ items, refreshItems, isDisabled, isEditMode, onEdit }) {
    if (!items || items.length === 0) {
        // return <Typography align="center" color="text.secondary" sx={{mt: 3}}>No diet items scheduled for this date.</Typography>;
        return <p style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>No diet items scheduled for this date.</p>;
    }

    // No longer filtering skipped items here, DietListItem handles its own display/actions
    return (
        // Using ul, but could switch to MUI List
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map(item => (
                // Pass relevant props down, including isEditMode and onEdit
                <DietListItem
                    key={item.id} // Crucial for React updates
                    item={item}
                    refreshItems={refreshItems}
                    onEdit={onEdit} // <<< PASS onEdit PROP HERE
                    isDisabled={isDisabled}
                    isEditMode={isEditMode} // <<< PASS isEditMode PROP HERE
                />
            ))}
        </ul>
    );
}

export default DietList;
