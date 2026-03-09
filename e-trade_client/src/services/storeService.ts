// src/services/product.service.ts
import axios from 'axios';
import { ProductResponse } from '../types/home';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';
import { StoreReportData } from '../types/storeReport';

const getToken = () => {
    return localStorage.getItem('accessToken');
}

export const StoreService = {

    getAdminStores: async (): Promise<StoreReportData[]> => {
        const response = await axios.get(`${API_BASE_URL}/store/admin/stores`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        console.log('API Response:', response.data); // Debug log
        return response.data;
    },

    getPendingSellers: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE_URL}/store/admin/pending-sellers`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    },

    approveSeller: async (id: string): Promise<any> => {
        const response = await axios.put(`${API_BASE_URL}/store/admin/approve-seller/${id}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    },

    rejectSeller: async (id: string): Promise<any> => {
        const response = await axios.delete(`${API_BASE_URL}/store/admin/reject-seller/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    },

    // Thêm hàm update status
    updateStoreStatus: async (id: string, status: string): Promise<any> => {
        const response = await axios.put(`${API_BASE_URL}/store/admin/stores/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    }
}