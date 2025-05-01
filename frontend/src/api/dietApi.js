import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // We might need credentials if using session auth later
    // withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
        // Add CSRF token header if needed (Django usually checks this)
        // 'X-CSRFToken': getCookie('csrftoken'), // You'd need a function to get the cookie
    },
});

// Helper function to get CSRF token from cookies (if needed)
// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }


// --- Diet Item (Daily Tracker) API Calls ---

// Fetch diet items for a specific date (YYYY-MM-DD)
// Backend now handles template generation if items don't exist for the date
export const getDietItems = (date) => {
    if (!date) {
        console.error("Date parameter is required for getDietItems");
        return Promise.reject(new Error("Date parameter is required")); // Or handle appropriately
    }
    const params = { date };
    return apiClient.get('/diet-items/', { params });
};

// Fetch a single diet item by ID
export const getDietItem = (id) => {
    return apiClient.get(`/diet-items/${id}/`);
};

// Create a new AD-HOC diet item (handles FormData for image upload)
export const addDietItem = (itemData) => {
    const isFormData = itemData instanceof FormData;
    return apiClient.post('/diet-items/', itemData, {
        headers: { ...(isFormData && { 'Content-Type': 'multipart/form-data' }) },
    });
};

// Update an existing diet item (handles FormData for image upload)
export const updateDietItem = (id, itemData) => {
    const isFormData = itemData instanceof FormData;
    return apiClient.put(`/diet-items/${id}/`, itemData, {
        headers: { ...(isFormData && { 'Content-Type': 'multipart/form-data' }) },
    });
};

// Partially update an existing diet item
export const patchDietItem = (id, itemData) => {
     const isFormData = itemData instanceof FormData;
     return apiClient.patch(`/diet-items/${id}/`, itemData, {
         headers: { ...(isFormData && { 'Content-Type': 'multipart/form-data' }) },
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


// --- Food Formula (Library) API Calls --- NEW ---

export const getFoodFormulas = () => {
    return apiClient.get('/food-formulas/');
};

export const addFoodFormula = (formulaData) => {
    return apiClient.post('/food-formulas/', formulaData);
};

export const updateFoodFormula = (id, formulaData) => {
    return apiClient.put(`/food-formulas/${id}/`, formulaData);
};

export const deleteFoodFormula = (id) => {
    return apiClient.delete(`/food-formulas/${id}/`);
};


// --- Schedule Template API Calls --- NEW ---

export const getScheduleTemplates = () => {
    return apiClient.get('/schedule-templates/');
};

export const addScheduleTemplate = (templateData) => {
    return apiClient.post('/schedule-templates/', templateData);
};

export const updateScheduleTemplate = (id, templateData) => {
    return apiClient.put(`/schedule-templates/${id}/`, templateData);
};

export const deleteScheduleTemplate = (id) => {
    return apiClient.delete(`/schedule-templates/${id}/`);
};


// --- Axios Interceptor Example (Optional: for handling errors globally) ---
// apiClient.interceptors.response.use(
//     response => response,
//     error => {
//         console.error("API Call Error:", error.response || error.message || error);
//         // Can add logic here to redirect on 401/403, show global notifications, etc.
//         return Promise.reject(error);
//     }
// );

export default apiClient; // Keep default export if needed elsewhere, otherwise named exports are fine

