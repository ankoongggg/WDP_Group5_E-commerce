import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../services/api';
import { useToast } from './ToastContext';

interface CartItem {
    product: any; // Chứa full data sản phẩm (name, price, image...)
    quantity: number;
    type?: string;
}

interface CartContextType {
    items: CartItem[];
    cart: CartItem[]; // Thêm tên này cho tương thích file cũ
    addToCart: (product: any, quantity: number, type?: string) => void;
    removeFromCart: (productId: string, type?: string) => void;
    updateQuantity: (productId: string, quantity: number, type?: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    cartTotal: number; // Thêm tên này cho tương thích file cũ
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    // 1. KHI NGƯỜI DÙNG ĐĂNG NHẬP HOẶC ĐĂNG XUẤT
    useEffect(() => {
        if (user) {
            // Có User -> Tải giỏ hàng từ Database
            fetchDbCart();
        } else {
            // Đăng xuất (Guest) -> Xóa giỏ hàng hiển thị hoặc tải từ LocalStorage
            const localCart = localStorage.getItem('guest_cart');
            if (localCart) {
                setItems(JSON.parse(localCart));
            } else {
                setItems([]);
            }
        }
    }, [user]);

    // Hàm gọi API lấy giỏ hàng
    // Hàm gọi API lấy giỏ hàng & GỘP GIỎ HÀNG KHÁCH
    const fetchDbCart = async () => {
        try {
            const res = await cartApi.getCart();
            let dbItems: CartItem[] = [];
            
            // Lấy đồ từ Database về
            if (res.data && res.data.items) {
                dbItems = res.data.items.map((item: any) => ({
                    product: item.product_id, 
                    quantity: item.quantity,
                    type: item.variant || '' // Nhận variant từ DB chuyển thành type cho Frontend
                }));
            }

            // 🚨 PHÉP THUẬT GỘP GIỎ HÀNG NẰM Ở ĐÂY 🚨
            const localCartStr = localStorage.getItem('guest_cart');
            if (localCartStr) {
                const guestItems: CartItem[] = JSON.parse(localCartStr);
                let hasChanges = false;

                guestItems.forEach(gItem => {
                    const existing = dbItems.find(i => i.product._id === gItem.product._id && i.type === gItem.type);
                    if (existing) {
                        existing.quantity += gItem.quantity; // Có rồi thì cộng dồn
                        hasChanges = true;
                    } else {
                        dbItems.push(gItem); // Chưa có thì nhét thêm vào
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    localStorage.removeItem('guest_cart'); // Xóa giỏ khách đi
                    await cartApi.syncCart(dbItems); // Đẩy toàn bộ cục mới tinh lên DB lưu lại
                }
            }

            setItems(dbItems);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng DB:", error);
        }
    };

    // 2. HÀM ĐỒNG BỘ: Cứ có thay đổi là gọi hàm này để lưu
    const syncCart = async (newItems: CartItem[]) => {
        if (user) {
            // Nếu có user -> Đẩy lên Database lưu vĩnh viễn
            try {
                await cartApi.syncCart(newItems);
            } catch (error) {
                console.error("Lỗi đồng bộ DB:", error);
            }
        } else {
            // Nếu khách vãng lai -> Lưu tạm vào LocalStorage
            localStorage.setItem('guest_cart', JSON.stringify(newItems));
        }
    };

   // 3. CÁC HÀNH ĐỘNG CỦA GIỎ HÀNG
    const addToCart = (product: any, quantity: number, type: string = '') => {
        // Tách việc tính toán ra ngoài
        const existing = items.find(i => i.product._id === product._id && i.type === type);
        let newItems;
        
        if (existing) {
            // Đã có thì cộng dồn
            newItems = items.map(i => 
                i === existing ? { ...i, quantity: i.quantity + quantity } : i
            );
        } else {
            // Chưa có thì thêm mới
            newItems = [...items, { product, quantity, type }];
        }
        
        // Cập nhật State, Gọi API và Hiện Toast độc lập với nhau
        setItems(newItems); 
        syncCart(newItems); 
    };

    const removeFromCart = (productId: string, type: string = '') => {
        const newItems = items.filter(i => !(i.product._id === productId && i.type === type));
        
        setItems(newItems);
        syncCart(newItems); 
    };

    const updateQuantity = (productId: string, quantity: number, type: string = '') => {
        if (quantity < 1) return;
        const newItems = items.map(i => 
            (i.product._id === productId && i.type === type) ? { ...i, quantity } : i
        );
        
        setItems(newItems);
        syncCart(newItems); 
    };

    const clearCart = () => {
        setItems([]);
        if (user) {
            cartApi.clearCart(); // ⚡ Gọi API xóa DB
        } else {
            localStorage.removeItem('guest_cart');
        }
    };

    // Tính toán
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
        const itemPrice = item.product?.price || 0;
        return sum + (itemPrice * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            cart: items, // Xuất tên cart cho tương thích
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            totalItems, 
            totalPrice,
            cartTotal: totalPrice // Xuất tên cartTotal cho tương thích
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) throw new Error('useCart must be used within a CartProvider');
    return context;
};