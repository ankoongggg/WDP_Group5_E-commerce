import axios from 'axios';
import { ProductResponse } from '../types/home';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const CategoryService = {
    //danh sách category
    getAll : async (params?: {limit?: number}) => {
        const res = await axios.get(`${API_BASE_URL}/categories`, { params });
        return res.data;
    }
}