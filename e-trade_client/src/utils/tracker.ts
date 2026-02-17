


// Gọi hàm này khi User nhấn nút Search
export const trackSearch = (keyword: string) => {
  if (!keyword) return;
  
  const history = JSON.parse(localStorage.getItem('search_history') || '[]');
  
  // Đưa keyword mới lên đầu, xóa trùng lặp
  const newHistory = [keyword, ...history.filter((k: string) => k !== keyword)].slice(0, 5); // Chỉ lưu 5 cái gần nhất
  
  localStorage.setItem('search_history', JSON.stringify(newHistory));
};

// src/utils/tracker.ts
export const trackInterest = (keyword: string) => {
  if (!keyword) return;
  const history = JSON.parse(localStorage.getItem('user_interest') || '[]');
  // Đưa keyword mới lên đầu, xóa trùng, giữ tối đa 5
  const newHistory = [keyword, ...history.filter((k: string) => k !== keyword)].slice(0, 5);
  localStorage.setItem('user_interest', JSON.stringify(newHistory));
};

export const getInterests = (): string => {
  const history = JSON.parse(localStorage.getItem('user_interest') || '[]');
  return history.join(','); // Trả về chuỗi "iphone,samsung" để gửi lên API
};

// Gọi hàm này khi User click vào chi tiết sản phẩm
export const trackProductView = (productName: string) => {
  // Logic tương tự: coi tên sản phẩm là một từ khóa quan tâm
  trackSearch(productName);
};