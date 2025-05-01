import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Create an Axios instance for making API requests
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true, // Uncomment if using session auth across different origins
});

// --- Diet Item (Daily Tracker) API Calls ---

/** Fetches diet items for a specific date (YYYY-MM-DD). */
export const getDietItems = (date) => {
    if (!date) {
        console.error("Date parameter is required for getDietItems");
        return Promise.reject(new Error("Date parameter is required"));
    }
    const params = { date };
    return apiClient.get('/diet-items/', { params });
};

/** Fetches a single diet item by its ID. */
export const getDietItem = (id) => {
    return apiClient.get(`/diet-items/${id}/`);
};

/** Creates a new ad-hoc diet item. Handles image uploads via FormData. */
export const addDietItem = (itemData) => {
    const isFormData = itemData instanceof FormData;
    return apiClient.post('/diet-items/', itemData, {
        headers: { ...(isFormData && { 'Content-Type': 'multipart/form-data' }) },
    });
};

/** Updates an existing diet item completely (PUT). Handles image uploads. */
export const updateDietItem = (id, itemData) => {
    const isFormData = itemData instanceof FormData;
    return apiClient.put(`/diet-items/${id}/`, itemData, {
        headers: { ...(isFormData && { 'Content-Type': 'multipart/form-data' }) },
    });
};

/** Partially updates an existing diet item (PATCH). Handles image uploads. */
export const patchDietItem = (id, itemData) => {
     const isFormData = itemData instanceof FormData;
     return apiClient.patch(`/diet-items/${id}/`, itemData, {
         headers: { ...(isFormData && { 'Content-Type': 'multipart/form-data' }) },
     });
};

/** Deletes a specific diet item. */
export const deleteDietItem = (id) => {
    return apiClient.delete(`/diet-items/${id}/`);
};

/** Marks a specific diet item as administered. */
export const markItemAdministered = (id) => {
    return apiClient.post(`/diet-items/${id}/mark-administered/`);
};

/** Marks a specific diet item as skipped. */
export const markItemSkipped = (id) => {
    return apiClient.post(`/diet-items/${id}/mark-skipped/`);
};

/** Resets the status of a specific diet item to pending. */
export const markItemPending = (id) => {
    return apiClient.post(`/diet-items/${id}/mark-pending/`);
};

// --- REMOVED resetDayToTemplate function ---


// --- Food Formula (Library) API Calls ---
export const getFoodFormulas = () => apiClient.get('/food-formulas/');
export const addFoodFormula = (formulaData) => apiClient.post('/food-formulas/', formulaData);
export const updateFoodFormula = (id, formulaData) => apiClient.put(`/food-formulas/${id}/`, formulaData);
export const deleteFoodFormula = (id) => apiClient.delete(`/food-formulas/${id}/`);

// --- Schedule Template API Calls ---
export const getScheduleTemplates = () => apiClient.get('/schedule-templates/');
export const addScheduleTemplate = (templateData) => apiClient.post('/schedule-templates/', templateData);
export const updateScheduleTemplate = (id, templateData) => apiClient.put(`/schedule-templates/${id}/`, templateData);
export const deleteScheduleTemplate = (id) => apiClient.delete(`/schedule-templates/${id}/`);

