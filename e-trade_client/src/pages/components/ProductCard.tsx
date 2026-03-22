// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

export interface ProductWithStats {
  _id: string;
  name: string;
  main_image: string;
  price: number;
  original_price?: number;
  store_id?: {
    shop_name: string;
  };
  user_id?: {
    name: string;
  };
  condition?: string;
  averageRating?: number; // Thêm từ backend
  totalReviews?: number;  // Thêm từ backend
  totalOrders?: number;   // Thêm từ backend
}

interface ProductCardProps {
  product: ProductWithStats;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { formatPrice } = useCurrency();

  const discount = (product.original_price && product.price && product.original_price > product.price) 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
    : 0;

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
    <div className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-lg">
      <Link to={`/products/${product._id}`} className="block relative">
        {/* 1. KHỐI HÌNH ẢNH: Ép cứng tỷ lệ (aspect-square) để 100% hình ảnh cao bằng nhau */}
        <div className="relative w-full pt-[100%] overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={product.main_image || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badge Giảm giá */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
              -{discount}%
            </div>
          )}

          {/* Badge Hàng Cũ */}
          {product.condition === 'Used' && (
             <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-1 rounded-sm shadow-sm">
               Hàng Pass
             </div>
          )}
        </div>
      </Link>
      
      <div className="flex flex-1 flex-col p-4">
        {/* 2. TÊN NGƯỜI BÁN / SHOP */}
        {product.store_id?.shop_name ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-1 line-clamp-1">
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            <span className="truncate">{product.store_id.shop_name}</span>
          </p>
        ) : product.user_id?.name ? (
          <p className="text-xs text-blue-500 dark:text-blue-400 mb-1.5 uppercase tracking-wide flex items-center gap-1 line-clamp-1">
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span className="truncate">{product.user_id.name}</span>
          </p>
        ) : (
          <div className="h-5 mb-1.5"></div> // Khoảng trống dự phòng
        )}

        {/* 3. TÊN SẢN PHẨM: Ép cứng chiều cao 2 dòng */}
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 leading-snug line-clamp-2 h-10 group-hover:text-primary transition-colors">
          <Link to={`/products/${product._id}`} title={product.name}>
            {product.name}
          </Link>
        </h3>

        {/* 4. ĐÁNH GIÁ & ĐÃ BÁN (Xếp trên phần Giá) */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1">
            {renderStars(product.averageRating || 0)}
            <span className="text-[11px] text-slate-500 dark:text-slate-400">({product.totalReviews || 0})</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            Đã bán {product.totalOrders || 0}
          </div>
        </div>

        {/* 5. KHỐI GIÁ TIỀN (Xếp dọc: Giá gốc mờ bên trên, Giá bán đậm bên dưới) */}
        <div className="mt-auto flex flex-col justify-end min-h-[44px]">
          {discount > 0 && product.original_price ? (
            <>
              {/* Giá gốc nằm trên */}
              <span className="text-xs text-slate-400 line-through truncate leading-tight">
                {formatPrice(product.original_price)}
              </span>
              {/* Giá hiện tại nằm dưới */}
              <span className="text-base sm:text-lg font-extrabold text-primary truncate leading-tight">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <>
              {/* Nếu không có giảm giá, đẩy giá tiền xuống sát đáy để thẻ cân bằng */}
              <div className="h-[14px]"></div>
              <span className="text-base sm:text-lg font-extrabold text-primary truncate leading-tight">
                {formatPrice(product.price)}
              </span>
            </>
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