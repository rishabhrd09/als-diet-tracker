import React from 'react';
import { markItemAdministered, markItemSkipped, markItemPending, deleteDietItem } from '../api/dietApi';
import './DietListItem.css'; // Create basic CSS for styling

function DietListItem({ item, refreshItems, onEdit }) {

    const handleAdminister = async () => {
        try {
            await markItemAdministered(item.id);
            refreshItems(); // Refresh the list after action
        } catch (error) {
            console.error("Error marking as administered:", error);
            alert("Failed to mark as administered.");
        }
    };

    const handleSkip = async () => {
         try {
            await markItemSkipped(item.id);
            refreshItems(); 
        } catch (error) {
            console.error("Error marking as skipped:", error);
            alert("Failed to mark as skipped.");
        }
    };

    const handlePending = async () => {
         try {
            await markItemPending(item.id);
            refreshItems(); 
        } catch (error) {
            console.error("Error resetting status:", error);
            alert("Failed to reset status.");
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${item.food_name}"?`)) {
            try {
                await deleteDietItem(item.id);
                refreshItems(); 
            } catch (error) {
                console.error("Error deleting item:", error);
                alert("Failed to delete item.");
            }
        }
    };

    const getStatus = () => {
        if (item.is_administered) return <span className="status administered">Administered ({item.administered_at ? new Date(item.administered_at).toLocaleTimeString() : ''})</span>;
        if (item.is_skipped) return <span className="status skipped">Skipped</span>;
        return <span className="status pending">Pending</span>;
    }

    const imageUrl = item.image ? item.image : null; // API gives full URL

    return (
        <li className={`diet-item ${item.is_administered ? 'administered-item' : ''} ${item.is_skipped ? 'skipped-item' : ''}`}>
            <div className="item-info">
                <span className="item-time">{item.timing_display}</span> {/* Use formatted time */}
                <strong className="item-name">{item.food_name}</strong>
                <span className="item-qty">({item.quantity_ml} ml)</span>
                {item.calories && <span className="item-detail"> | {item.calories} kcal</span>}
                {item.protein_g && <span className="item-detail"> | P: {item.protein_g}g</span>}
                {item.carbs_g && <span className="item-detail"> | C: {item.carbs_g}g</span>}
                {item.fat_g && <span className="item-detail"> | F: {item.fat_g}g</span>}
                {item.description && <p className="item-desc"><em>{item.description}</em></p>}
                {getStatus()}
                {imageUrl && <img src={imageUrl} alt={item.food_name} className="item-image" />}
            </div>
            <div className="item-actions">
                {!item.is_administered && !item.is_skipped && (
                    <>
                        <button onClick={handleAdminister} className="action-btn administer-btn">Administer</button>
                        <button onClick={handleSkip} className="action-btn skip-btn">Skip</button>
                    </>
                )}
                {(item.is_administered || item.is_skipped) && (
                     <button onClick={handlePending} className="action-btn pending-btn">Mark Pending</button>
                )}
                 <button onClick={() => onEdit(item)} className="action-btn edit-btn">Edit</button>
                 <button onClick={handleDelete} className="action-btn delete-btn">Delete</button>
            </div>
        </li>
    );
}

export default DietListItem;