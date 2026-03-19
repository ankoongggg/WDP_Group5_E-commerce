import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../services/api';
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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            fetchDbCart();
        } else {
            const localCart = localStorage.getItem('guest_cart');
            if (localCart) {
                setItems(JSON.parse(localCart));
            } else {
                setItems([]);
            }
        }
    }, [user]);

    const fetchDbCart = async () => {
        try {
            const res = await cartApi.getCart();
            let dbItems: CartItem[] = [];
            
            if (res.data && res.data.items) {
                dbItems = res.data.items.map((item: any) => ({
                    product: item.product_id, 
                    quantity: item.quantity,
                    type: item.variant || '' 
                }));
            }

            const localCartStr = localStorage.getItem('guest_cart');
            if (localCartStr) {
                const guestItems: CartItem[] = JSON.parse(localCartStr);
                let hasChanges = false;

                guestItems.forEach(gItem => {
                    const existing = dbItems.find(i => i.product._id === gItem.product._id && i.type === gItem.type);
                    if (existing) {
                        existing.quantity += gItem.quantity; 
                        hasChanges = true;
                    } else {
                        dbItems.push(gItem); 
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    localStorage.removeItem('guest_cart'); 
                    await cartApi.syncCart(dbItems); 
                }
            }

            setItems(dbItems);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng DB:", error);
        }
    };

    const syncCart = async (newItems: CartItem[]) => {
        if (user) {
            try {
                await cartApi.syncCart(newItems);
            } catch (error) {
                console.error("Lỗi đồng bộ DB:", error);
            }
        } else {
            localStorage.setItem('guest_cart', JSON.stringify(newItems));
        }
    };

    // 👉 CHẶN TỒN KHO LÚC BẤM NÚT THÊM VÀO GIỎ
    const addToCart = (product: any, quantity: number, type: string = '') => {
        const existing = items.find(i => i.product._id === product._id && i.type === type);
        const maxStock = product.stock ?? 9999; 
        
        let newItems;
        
        if (existing) {
            const newTotalQuantity = existing.quantity + quantity;
            if (newTotalQuantity > maxStock) {
                toast.error(`Trong giỏ đã có ${existing.quantity}. Chỉ có thể mua tối đa ${maxStock} sản phẩm!`);
                return;
            }
            newItems = items.map(i => i === existing ? { ...i, quantity: newTotalQuantity } : i);
        } else {
            if (quantity > maxStock) {
                toast.error(`Sản phẩm này chỉ còn ${maxStock} cái trong kho!`);
                return; 
            }
            newItems = [...items, { product, quantity, type }];
        }
        
        setItems(newItems); 
        syncCart(newItems); 
        
    };

    const removeFromCart = (productId: string, type: string = '') => {
        const newItems = items.filter(i => !(i.product._id === productId && i.type === type));
        setItems(newItems);
        syncCart(newItems); 
    };

    // 👉 CHẶN TỒN KHO LÚC BẤM DẤU CỘNG TRONG TRANG CART
    const updateQuantity = (productId: string, quantity: number, type: string = '') => {
        if (quantity < 1) return;

        const currentItem = items.find(i => i.product._id === productId && i.type === type);
        if (!currentItem) return;

        const maxStock = currentItem.product?.stock ?? 9999;
        if (quantity > maxStock) {
            toast.error(`Sản phẩm này chỉ còn tối đa ${maxStock} cái trong kho!`);
            return; 
        }

        const newItems = items.map(i => (i.product._id === productId && i.type === type) ? { ...i, quantity } : i);
        
        setItems(newItems);
        syncCart(newItems); 
    };

    const clearCart = () => {
        setItems([]);
        if (user) {
            cartApi.clearCart(); 
        } else {
            localStorage.removeItem('guest_cart');
        }
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
        const itemPrice = item.product?.price || 0;
        return sum + (itemPrice * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            cart: items, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            totalItems, 
            totalPrice,
            cartTotal: totalPrice 
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