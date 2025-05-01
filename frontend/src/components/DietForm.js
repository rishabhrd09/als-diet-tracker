import React, { useState, useEffect, useRef } from 'react';
import { addDietItem, updateDietItem } from '../api/dietApi';
import './DietForm.css'; // Create CSS for form styling

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

function DietForm({ refreshItems, selectedItem, clearSelection, currentViewDate }) {
    const [foodName, setFoodName] = useState('');
    const [timing, setTiming] = useState(''); // Store as HH:MM
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scheduledDate, setScheduledDate] = useState(formatDate(currentViewDate)); // Initialize with current view date
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null); // Ref for file input

    useEffect(() => {
        // Pre-fill form if an item is selected for editing
        if (selectedItem) {
            setIsEditing(true);
            setFoodName(selectedItem.food_name);
            // Django TimeField format is HH:MM:SS or HH:MM, input type="time" expects HH:MM
            setTiming(selectedItem.timing.substring(0, 5)); 
            setQuantity(selectedItem.quantity_ml);
            setCalories(selectedItem.calories || '');
            setProtein(selectedItem.protein_g || '');
            setCarbs(selectedItem.carbs_g || '');
            setFat(selectedItem.fat_g || '');
            setDescription(selectedItem.description || '');
            setScheduledDate(selectedItem.scheduled_date); // Use the item's date
            setImage(null); // Clear previous file selection
            setImagePreview(selectedItem.image || null); // Show existing image
        } else {
            // Reset form if no item is selected (or after submission/cancel)
            resetForm();
        }
    }, [selectedItem]);

     useEffect(() => {
        // Update form's date when the main view date changes, ONLY if not editing
        if (!isEditing) {
             setScheduledDate(formatDate(currentViewDate));
        }
     }, [currentViewDate, isEditing]);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImage(null);
            // If editing, revert to original image preview if file is deselected
            setImagePreview(selectedItem?.image || null); 
        }
    };

    const resetForm = () => {
         setIsEditing(false);
         setFoodName('');
         setTiming('');
         setQuantity('');
         setCalories('');
         setProtein('');
         setCarbs('');
         setFat('');
         setDescription('');
         setImage(null);
         setImagePreview(null);
         setScheduledDate(formatDate(currentViewDate)); // Reset date to current view date
         if(fileInputRef.current) fileInputRef.current.value = null; // Clear the file input visually
         clearSelection(); // Notify parent that selection is cleared
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Use FormData to handle file uploads correctly
        const formData = new FormData();
        formData.append('food_name', foodName);
        formData.append('scheduled_date', scheduledDate);
        formData.append('timing', timing); // Send as HH:MM, Django handles it
        formData.append('quantity_ml', quantity);
        if (calories) formData.append('calories', calories);
        if (protein) formData.append('protein_g', protein);
        if (carbs) formData.append('carbs_g', carbs);
        if (fat) formData.append('fat_g', fat);
        if (description) formData.append('description', description);
        // Only append image if a *new* file is selected or if editing and want to keep it (tricky, easier to always re-upload if changed)
        if (image) { 
            formData.append('image', image);
        } else if (isEditing && !imagePreview) {
            // If editing and imagePreview is null (meaning user cleared it), send empty
             formData.append('image', ''); // Signal to backend to clear the image
        }
        // Note: If editing and image wasn't changed, don't append 'image' to formData
        // if you want to keep the existing one without re-uploading.
        // However, using PUT replaces the whole object, so sending null/empty might clear it.
        // PATCH is better for partial updates. Let's adjust the API call based on image presence.
        // Simpler approach: Always PUT/POST. If image field is missing in FormData, backend might keep it (depends on serializer). 
        // If image field has empty string '', backend should clear it. If image field has file data, backend updates it.

        try {
            if (isEditing) {
                // Decide whether to use PUT or PATCH. 
                // PATCH might be safer if you only want to update provided fields.
                // Let's stick with PUT for now as ModelViewSet provides it easily.
                // A refinement could be to use PATCH if no new image is uploaded.
                await updateDietItem(selectedItem.id, formData); 
                alert('Item updated successfully!');
            } else {
                await addDietItem(formData);
                alert('Item added successfully!');
            }
            resetForm();
            refreshItems(); // Refresh list in parent component
        } catch (error) {
            console.error("Error submitting form:", error.response?.data || error.message);
            alert(`Failed to ${isEditing ? 'update' : 'add'} item. Check console for details.`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="diet-form">
            <h3>{isEditing ? 'Edit Diet Item' : 'Add New Diet Item'}</h3>

            <label>
                Date:
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
            </label>

            <label>
                Food Name:
                <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} required />
            </label>

            <label>
                Timing (HH:MM AM/PM):
                <input type="time" value={timing} onChange={(e) => setTiming(e.target.value)} required />
            </label>

            <label>
                Quantity (ml):
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0" />
            </label>

            <label>
                Calories (kcal):
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} min="0" />
            </label>

             <label>
                Protein (g):
                <input type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} min="0" />
            </label>
             <label>
                Carbs (g):
                <input type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} min="0" />
            </label>
             <label>
                Fat (g):
                <input type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} min="0" />
            </label>

            <label>
                Description:
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <label>
                Image:
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
            </label>
            {imagePreview && (
                <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    {/* Add a button to clear preview/remove image only if editing? */}
                    {isEditing && <button type="button" onClick={() => { setImage(null); setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = null;}}>Remove Image</button>}
                </div>
             )}


            <div className="form-actions">
                <button type="submit">{isEditing ? 'Update Item' : 'Add Item'}</button>
                {isEditing && <button type="button" onClick={resetForm}>Cancel Edit</button>}
            </div>
        </form>
    );
}

export default DietForm;