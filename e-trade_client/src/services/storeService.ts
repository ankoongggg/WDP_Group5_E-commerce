// src/services/product.service.ts
import axios from 'axios';
import { ProductResponse } from '../types/home';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';
import { StoreReportData } from '../types/storeReport';
export const StoreService = {

    getAdminStores: async (): Promise<StoreReportData[]> => {
        const response = await axios.get(`${API_BASE_URL}/store/admin/stores`);
        console.log('API Response:', response.data); // Debug log
        return response.data;
    }

}