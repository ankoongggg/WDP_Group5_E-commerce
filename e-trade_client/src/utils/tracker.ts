// Hàm làm sạch chuỗi
const overdriveKeyword = (text: string) => {
  if (!text) return "";
  return text.trim().split(/\s+/).slice(0, 3).join(" ");
};

// 1. Lưu từ khóa Search / click sản phẩm
export const trackInterest = (keyword: string) => {
  const shortKeyword = overdriveKeyword(keyword);
  if (!shortKeyword) return;

  try {
      const history = JSON.parse(localStorage.getItem('user_keyword_interest') || '[]');
      const newHistory = [shortKeyword, ...history.filter((k: string) => k !== shortKeyword)].slice(0, 5);
      localStorage.setItem('user_keyword_interest', JSON.stringify(newHistory));
  } catch (e) {
      console.error("Local storage error:", e);
      localStorage.setItem('user_keyword_interest', JSON.stringify([shortKeyword]));
  }
};

// 2. Lưu lại ID Danh Mục mà User đã click
export const trackCategoryInterest = (categoryId: string) => {
  if (!categoryId) return;
  try {
      const history = JSON.parse(localStorage.getItem('user_category_interest') || '[]');
      const newHistory = [categoryId, ...history.filter((id: string) => id !== categoryId)].slice(0, 3);
      localStorage.setItem('user_category_interest', JSON.stringify(newHistory));
  } catch (e) {
      localStorage.setItem('user_category_interest', JSON.stringify([categoryId]));
  }
};

// 3. Hàm gọi Query Params
export const getInterestsParams = (): { interests?: string, category_interests?: string } => {
  try {
      const keywords = JSON.parse(localStorage.getItem('user_keyword_interest') || '[]');
      const categories = JSON.parse(localStorage.getItem('user_category_interest') || '[]');
      
      const result: any = {};
      if (keywords.length > 0) result.interests = keywords.join(',');
      if (categories.length > 0) result.category_interests = categories.join(',');

      return result;
  } catch (e) {
      return {};
  }
};