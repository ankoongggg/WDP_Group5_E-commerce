import axios from 'axios';
import { ProductResponse } from '../types/home';
// ensure we always have a base URL (other services include fallback)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const UserService = {
    getNumberAndComparison: async () => {
        const res = await axios.get(`${API_BASE_URL}/users/admin/users/total`);
        // backend returns { success: true, data: { totalUsers, comparison } }
        // so we unwrap the inner data for convenience
        return res.data?.data;
    }

    
}