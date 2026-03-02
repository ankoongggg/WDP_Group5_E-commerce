export interface StoreReportData {
  _id: string;
  user_id: {
    _id: string;
  };
  description: string;
  identity_card: string;
  pickup_address: string;
  total_sales: number;
  shop_name: string;
  status: 'active' | 'inactive' | 'banned' | string; // Có thể mở rộng status
  created_at: string;
  updated_at: string;
  total_revenue: number;
  total_orders: number;
}