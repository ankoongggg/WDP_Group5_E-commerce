// src/components/common/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductWithStats } from '../../../types/home';
import { trackInterest } from '../../../utils/tracker';
import { useCurrency} from '../../../context/CurrencyContext';


export const ProductCard: React.FC<{ product: ProductWithStats }> = ({ product }) => {
  const { formatPrice } = useCurrency();

  const discount = product.original_price && product.price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleClick = () => {
    trackInterest(product.category_id && Array.isArray(product.category_id) ? product.category_id[0]._id : product.category_id as string);
  };

  // Xác định người bán
  const sellerName = product.store_id?.shop_name || product.user_id?.name || "Người dùng";
  const isStore = !!product.store_id?.shop_name;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (halfStar ? 1 : 0));
    return (
      <div className="flex items-center text-amber-400" title={`${rating} sao`}>
        {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="material-symbols-outlined fill text-[14px]">star</span>)}
        {halfStar && <span key="half" className="material-symbols-outlined fill text-[14px]">star_half</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="material-symbols-outlined text-[14px]">star</span>)}
      </div>
    );
  };

  return (
    <Link 
      to={`/products/${product._id}`} 
      onClick={handleClick}
      className="group flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all overflow-hidden relative h-full"
    >
      {/* 1. Phần Hình ảnh (Top) */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img 
          src={product.main_image || 'https://via.placeholder.com/300'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Badge Giảm giá */}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
            -{discount}%
          </span>
        )}
      </div>

      {/* 2. Phần Nội dung (Bottom) */}
      <div className="flex flex-col flex-1 p-3">
        {/* Nguồn bán (Shop hoặc Cá nhân) */}
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1 line-clamp-1">
          <span className="material-symbols-outlined text-[12px]">{isStore ? 'storefront' : 'person'}</span>
          {sellerName}
        </p>

        {/* Tên sản phẩm (Giới hạn 2 dòng) */}
        <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors h-10" title={product.name}>
          {product.name}
        </h4>
        
        {/* Rating & Sold (Đẩy sát xuống đáy trước khi tới giá tiền) */}
        <div className="mt-auto flex items-center justify-between mb-2">
          {/* Cụm Đánh giá */}
          <div className="flex items-center gap-1">
            {renderStars(product.averageRating || 0)}
            <span className="text-[11px] text-slate-500 dark:text-slate-400">({(product as any).totalReviews || 0})</span>
          </div>
          
          {/* Cụm Đã bán */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Đã bán {product.totalOrders || 0}
          </div>
        </div>

        {/* Khối chứa Giá (Bảo vệ giá gốc không bị tràn) */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-primary font-bold text-[15px] sm:text-base whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
          {product.original_price && discount > 0 && (
            <span className="text-slate-400 text-[11px] line-through whitespace-nowrap truncate max-w-[80px]" title={formatPrice(product.original_price)}>
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};