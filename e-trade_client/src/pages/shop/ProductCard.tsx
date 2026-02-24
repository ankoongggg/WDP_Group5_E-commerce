import React from 'react';
import { Link } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  main_image: string;
  price: number;
  original_price?: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discount = (product.original_price && product.price && product.original_price > product.price) 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
    : 0;

  return (
    <Link to={`/product/${product._id}`} className="group block overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-white/5">
        <img
          src={product.main_image || 'https://via.placeholder.com/400x300'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-4 bg-white dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-lg font-extrabold text-primary">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </p>
          {product.original_price && product.original_price > product.price && (
            <p className="text-sm text-slate-400 line-through">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.original_price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
