import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api'; 

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Diet Item API Calls ---

// Fetch diet items, optionally filtered by date (YYYY-MM-DD)
export const getDietItems = (date = null) => {
    const params = date ? { date } : {};
    return apiClient.get('/diet-items/', { params });
};

// Fetch a single diet item by ID
export const getDietItem = (id) => {
    return apiClient.get(`/diet-items/${id}/`);
};

// Create a new diet item (handles FormData for image upload)
export const addDietItem = (itemData) => {
    // We need FormData if there's an image
    const isFormData = itemData instanceof FormData; 
    
    return apiClient.post('/diet-items/', itemData, {
        headers: {
            // Let Axios set Content-Type for FormData automatically
            ...(isFormData && { 'Content-Type': 'multipart/form-data' }), 
        },
    });
};

// Update an existing diet item (handles FormData for image upload)
export const updateDietItem = (id, itemData) => {
    const isFormData = itemData instanceof FormData;

    return apiClient.put(`/diet-items/${id}/`, itemData, {
         headers: {
            ...(isFormData && { 'Content-Type': 'multipart/form-data' }),
        },
    });
};

// Partially update an existing diet item (e.g., only changing description)
export const patchDietItem = (id, itemData) => {
     const isFormData = itemData instanceof FormData;

     return apiClient.patch(`/diet-items/${id}/`, itemData, {
         headers: {
            ...(isFormData && { 'Content-Type': 'multipart/form-data' }),
        },
     });
};

// Delete a diet item
export const deleteDietItem = (id) => {
    return apiClient.delete(`/diet-items/${id}/`);
};

// Mark item as administered
export const markItemAdministered = (id) => {
    return apiClient.post(`/diet-items/${id}/mark-administered/`);
};

// Mark item as skipped
export const markItemSkipped = (id) => {
    return apiClient.post(`/diet-items/${id}/mark-skipped/`);
};

// Mark item as pending (reset status)
export const markItemPending = (id) => {
    return apiClient.post(`/diet-items/${id}/mark-pending/`);
};