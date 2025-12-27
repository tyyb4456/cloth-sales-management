import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cloth Varieties
export const getVarieties = () => api.get('/varieties/');
export const createVariety = (data) => api.post('/varieties/', data);
export const updateVariety = (id, data) => api.put(`/varieties/${id}`, data);
export const deleteVariety = (id) => api.delete(`/varieties/${id}`);

// Supplier Inventory
export const getSupplierInventory = () => api.get('/supplier/inventory');
export const getSupplierInventoryByDate = (date) => api.get(`/supplier/inventory/date/${date}`);
export const createSupplierInventory = (data) => api.post('/supplier/inventory', data);
export const deleteSupplierInventory = (id) => api.delete(`/supplier/inventory/${id}`);

// Supplier Returns
export const getSupplierReturns = () => api.get('/supplier/returns');
export const getSupplierReturnsByDate = (date) => api.get(`/supplier/returns/date/${date}`);
export const createSupplierReturn = (data) => api.post('/supplier/returns', data);
export const deleteSupplierReturn = (id) => api.delete(`/supplier/returns/${id}`);

// Supplier Summary
export const getSupplierDailySummary = (date) => api.get(`/supplier/daily-summary/${date}`);
export const getSupplierWiseSummary = (date) => api.get(`/supplier/supplier-summary/${date}`);

// Sales
export const getSales = () => api.get('/sales/');
export const getSalesByDate = (date) => api.get(`/sales/date/${date}`);
export const createSale = (data) => api.post('/sales/', data);
export const deleteSale = (id) => api.delete(`/sales/${id}`);

// Sales Summary
export const getDailySalesSummary = (date) => api.get(`/sales/daily-summary/${date}`);
export const getSalespersonSummary = (name, date) => api.get(`/sales/salesperson-summary/${name}/${date}`);

// Reports
export const getDailyReport = (date) => api.get(`/reports/daily/${date}`);
export const getProfitReport = (date) => api.get(`/reports/profit/${date}`);

export default api;