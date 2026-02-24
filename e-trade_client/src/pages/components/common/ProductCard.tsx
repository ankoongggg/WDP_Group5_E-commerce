// src/components/common/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../../types/home';
import { trackInterest } from '../../../utils/tracker';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  // Tính % giảm giá
  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleClick = () => {
    // Logic: Khi click vào sản phẩm -> Lưu tên hoặc category vào lịch sử quan tâm
    trackInterest(product.name);
  };

  return (
    <Link 
      to={`/products/${product._id}`} 
      onClick={handleClick}
      className="group bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all relative block h-full flex flex-col"
    >
      {discount > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">
          -{discount}%
        </span>
      )}
      
      <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-900 mb-3 overflow-hidden">
        <img 
          src={product.main_image || 'https://via.placeholder.com/300'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
      </div>

      <div className="flex flex-col flex-1">
        <h4 className="font-medium text-sm truncate dark:text-white mb-1" title={product.name}>
          {product.name}
        </h4>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-primary font-bold">{product.price.toLocaleString()} VND</span>
          {product.original_price && (
            <span className="text-slate-400 text-xs line-through">{product.original_price.toLocaleString()} VND</span>
          )}
        </div>
      </div>
    </Link>
  );
};