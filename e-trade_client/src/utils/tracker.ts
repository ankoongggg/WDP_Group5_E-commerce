// src/utils/tracker.ts
import { UserService } from '../services/userService';

const cleanKeyword = (text: string) => {
  if (!text) return "";
  return text.trim().split(/\s+/).slice(0, 3).join(" ");
};
const getToken = () => localStorage.getItem('accessToken');
// Gọi khi search bằng Input
export const trackSearch = async (keyword: string) => {
  if (!keyword || !keyword.trim()) return;
  try {
    const normalizedKeyword = cleanKeyword(keyword);
    UserService.saveSearchKeyword(normalizedKeyword).catch(e => {
        // Chỉ log nếu không phải lỗi 401 Unauthorized
        if (e?.response?.status !== 401) {
            console.error("Lỗi lưu từ khóa tìm kiếm:", e);
        }
    });
  } catch (error) {
    console.error(error);
  }
};

// Gọi khi click vào thẻ ProductCard
export const trackInterest = async (productName: string) => {
  if (!productName) return;
  try {
    const shortKeyword = cleanKeyword(productName);
    UserService.saveSearchKeyword(shortKeyword).catch(e => {
        if (e?.response?.status !== 401) {
            console.error("Lỗi lưu từ khóa quan tâm:", e);
        }
    });
  } catch (error) {
    console.error(error);
  }
};

// Hàm rỗng để tránh lỗi với các Component cũ chưa kịp xóa
export const getInterestsParams = (): string => "";
export const getInterests = (): string => "";