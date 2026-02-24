// src/hooks/useHomeProducts.ts
import { useState, useEffect } from 'react';
import { Category, Product } from '../types/home';
import { ProductService } from '../services/productService';
import { getInterests } from '../utils/tracker';
import {CategoryService} from '../services/categoryService';
export const useHomeProducts = () => {
    const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [biggestDiscount, setBiggestDiscount] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        // 1. Lấy keyword từ lịch sử xem
        const interests = getInterests();
        
        

        const saleRes = await ProductService.getSaleProducts();
        saleRes.data.forEach((product: Product) => {
          if(product.original_price && product.original_price > product.price){
            const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
            if(discount > biggestDiscount){
              setBiggestDiscount(discount);
            }
          }
        });
        setSaleProducts(saleRes.data);
        const categoriesRes = await CategoryService.getAll({
          limit: 6
        });

        // Handle different response formats
        if (Array.isArray(categoriesRes)) {
          setCategories(categoriesRes);
        } else if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        } else {
          setCategories([]);
        }


        // 2. Gọi API: Gửi keyword lên để Backend ưu tiên tìm sản phẩm đó
        // Backend của bạn đã có logic: if (keyword) tìm theo keyword
        // Chúng ta lấy limit=8 cho đẹp layout
        const res = await ProductService.getAll({ 
          keyword: interests, 
          limit: 8, 
          page: 1 
        });
        
        setProducts(res.data);
      } catch (error) {
        console.error("Failed to fetch home products", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return { products, biggestDiscount, categories, loading, saleProducts };
} ;

