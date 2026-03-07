export interface StoreReportData {
    _id: string;
    user_id: any;
    shop_name: string;
    description: string;
    identity_card: string;
    pickup_address: string;
    total_sales: number;
    status: string;
    created_at: string;
    updated_at: string;
    platform_fee: number; // Đổi từ total_revenue
    total_orders: number;
}