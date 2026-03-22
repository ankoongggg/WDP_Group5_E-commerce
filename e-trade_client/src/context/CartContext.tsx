import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios'; // 👉 Dùng Axios đâm thẳng xuống Backend
import { useToast } from './ToastContext';

interface CartItem {
    product: any;
    quantity: number;
    type?: string;
}

interface CartContextType {
    items: CartItem[];
    cart: CartItem[]; 
    addToCart: (product: any, quantity: number, type?: string) => void;
    removeFromCart: (productId: string, type?: string) => void;
    updateQuantity: (productId: string, quantity: number, type?: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    cartTotal: number; 
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Máy xay thịt: Ép mọi thứ về Text
const sanitizeType = (rawType: any): string => {
    if (!rawType) return '';
    if (typeof rawType === 'string') return rawType;
    if (typeof rawType === 'object') return String(rawType.description || rawType.name || '');
    return String(rawType);
};

// 👉 MÁY ÉP ID: Lọc bỏ những phần thừa thãi như '-Red', '-Blue' khỏi ID để so sánh chuẩn
const getBaseId = (p: any): string => {
    if (!p) return '';
    const idStr = String(p._id || p.productId || p);
    return idStr.split('-')[0];
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            fetchDbCart();
        } else {
            const localCartStr = localStorage.getItem('guest_cart');
            if (localCartStr) {
                try {
                    const parsedCart = JSON.parse(localCartStr);
                    setItems(parsedCart.map((item: any) => ({
                        ...item,
                        type: sanitizeType(item.type || item.variant)
                    })));
                } catch(e) {
                    setItems([]);
                }
            } else {
                setItems([]);
            }
        }
    }, [user]);

    const fetchDbCart = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            // 👉 HACK: GỌI THẲNG BẰNG AXIOS, BỎ QUA THẰNG PHẢN BỘI API.TS
            const res = await axios.get('http://localhost:9999/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            let dbItems: CartItem[] = [];
            const cartData = res.data?.data || res.data;
            
            if (cartData && cartData.items) {
                dbItems = cartData.items.map((item: any) => ({
                    product: item.product_id || item.product, 
                    quantity: item.quantity,
                    type: sanitizeType(item.type || item.variant)
                }));
            }

            const localCartStr = localStorage.getItem('guest_cart');
            if (localCartStr) {
                try {
                    const guestItems: CartItem[] = JSON.parse(localCartStr);
                    let hasChanges = false;

                    guestItems.forEach(gItem => {
                        const cleanType = sanitizeType(gItem.type || gItem.variant);
                        const existing = dbItems.find(i => getBaseId(i.product) === getBaseId(gItem.product) && i.type === cleanType);
                        
                        if (existing) {
                            existing.quantity += gItem.quantity; 
                            hasChanges = true;
                        } else {
                            dbItems.push({ ...gItem, type: cleanType }); 
                            hasChanges = true;
                        }
                    });

                    if (hasChanges) {
                        localStorage.removeItem('guest_cart'); 
                        await forceSyncCart(dbItems); 
                    }
                } catch(e) {}
            }

            setItems(dbItems);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng DB:", error);
        }
    };

    // 👉 HÀM ĐỒNG BỘ SIÊU CẤP: Ép gửi Type xuống Database
    const forceSyncCart = async (newItems: CartItem[]) => {
        if (user) {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const payloadItems = newItems.map(item => {
                    const pId = item.product?._id || item.product;
                    return {
                        product_id: typeof pId === 'string' ? pId.split('-')[0] : pId,
                        quantity: item.quantity,
                        type: sanitizeType(item.type),
                        variant: sanitizeType(item.type) // Bơm cả 2 cho DB khỏi cãi
                    };
                });

                await axios.put('http://localhost:9999/api/cart/sync', { items: payloadItems }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Lỗi đồng bộ DB:", error);
            }
        } else {
            localStorage.setItem('guest_cart', JSON.stringify(newItems));
        }
    };

    const addToCart = (product: any, quantity: number, type: string = '') => {
        const cleanType = sanitizeType(type || product.type || product.variant);
        const existing = items.find(i => getBaseId(i.product) === getBaseId(product) && i.type === cleanType);
        const maxStock = product.stock ?? 9999; 
        
        let newItems;
        if (existing) {
            const newTotalQuantity = existing.quantity + quantity;
            if (newTotalQuantity > maxStock) {
                toast.error(`Trong giỏ đã có ${existing.quantity}. Chỉ có tối đa ${maxStock}!`);
                return;
            }
            newItems = items.map(i => i === existing ? { ...i, quantity: newTotalQuantity } : i);
        } else {
            if (quantity > maxStock) {
                toast.error(`Chỉ còn ${maxStock} cái trong kho!`);
                return; 
            }
            newItems = [...items, { product, quantity, type: cleanType }];
        }
        
        setItems(newItems); 
        forceSyncCart(newItems); 
    };

    const removeFromCart = (productId: string, type: string = '') => {
        const cleanType = sanitizeType(type);
        const newItems = items.filter(i => !(getBaseId(i.product) === getBaseId(productId) && i.type === cleanType));
        setItems(newItems);
        forceSyncCart(newItems); 
    };

    const updateQuantity = (productId: string, quantity: number, type: string = '') => {
        if (quantity < 1) return;
        const cleanType = sanitizeType(type);

        const currentItem = items.find(i => getBaseId(i.product) === getBaseId(productId) && i.type === cleanType);
        if (!currentItem) return;

        const maxStock = currentItem.product?.stock ?? 9999;
        if (quantity > maxStock) {
            toast.error(`Tối đa ${maxStock} sản phẩm!`);
            return; 
        }

        const newItems = items.map(i => (getBaseId(i.product) === getBaseId(productId) && i.type === cleanType) ? { ...i, quantity } : i);
        setItems(newItems);
        forceSyncCart(newItems); 
    };

    const clearCart = async () => {
        setItems([]);
        if (user) {
            try {
                const token = localStorage.getItem('accessToken');
                await axios.delete('http://localhost:9999/api/cart', {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch(e) {}
        } else {
            localStorage.removeItem('guest_cart');
        }
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

    return (
        <CartContext.Provider value={{ 
            items, cart: items, addToCart, removeFromCart, updateQuantity, clearCart, 
            totalItems, totalPrice, cartTotal: totalPrice 
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