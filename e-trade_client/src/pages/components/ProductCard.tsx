// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

// Interface này nên được đưa ra một file type chung để tái sử dụng
interface Product {
  _id: string;
  name: string;
  main_image: string;
  price: number;
  original_price?: number;
  store_id?: {
    shop_name: string;
  };
  // Thêm user_id để lấy tên người pass đồ
  user_id?: {
    name: string;
  };
  product_type?: {
    stock: number;
  }[];
  stock?: number;
  condition?: string; // (Tùy chọn) Để hiện tag "Hàng Cũ"
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { formatPrice } = useCurrency();

  const discount = (product.original_price && product.price && product.original_price > product.price) 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-lg">
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.main_image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badge Giảm giá */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              -{discount}%
            </div>
          )}

          {/* (Tùy chọn) Badge hiển thị Hàng Cũ/Pass */}
          {product.condition === 'Used' && (
             <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-sm shadow-sm">
               Hàng đã sử dụng
             </div>
          )}
        </div>
      </Link>
      
      <div className="flex flex-1 flex-col p-4">
        {/* Logic Render Tên Shop hoặc Tên Người Pass Đồ */}
        {product.store_id?.shop_name ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            <span className="truncate">{product.store_id.shop_name}</span>
          </p>
        ) : product.user_id?.name ? (
          <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wide flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span className="truncate">{product.user_id.name}</span>
          </p>
        ) : (
          // Fallback nếu cả 2 đều không có
          <div className="h-4 mb-1"></div> 
        )}

        <h3 className="text-base font-bold text-slate-800 dark:text-white h-12 overflow-hidden mt-1">
          <Link to={`/products/${product._id}`} className="hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </Link>
        </h3>

        {/* //condition:
        {product.condition === 'Used' && (
          <div className="mt-2">
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Hàng Cũ
            </span>
          </div>
        )
       }{ product.condition === 'New' && (
          <div className="mt-2">
            <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              new
            </span>
          </div>
        )

        } */}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-primary">{formatPrice(product.price)}</span>
          {discount > 0 && product.original_price && (
            <span className="text-sm text-slate-400 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
        
        <div className="mt-auto pt-4">
          <Link to={`/products/${product._id}`} className="w-full text-center block rounded-lg py-2.5 px-4 text-sm font-bold transition-all bg-primary/10 text-primary hover:bg-primary hover:text-white">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;