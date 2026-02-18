// src/hooks/useLayout.ts
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ProductService } from '../services/productService';
import { removeVietnameseTones } from '../utils/format'; // Import hàm mới
import React from 'react';
export const useSearch = () => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Đồng bộ URL -> Input
    useEffect(() => {
        const urlKeyword = searchParams.get('keyword') || '';
        setSearch(urlKeyword);
    }, [searchParams]);

    // Fetch data cho suggestion
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await ProductService.getAll({ limit: 1000 });
                setAllProducts(res.data || []);
            } catch (error) {
                console.error(error);
            }
        };
        fetchProducts();
    }, []);

    // Logic gợi ý (Dùng removeVietnameseTones)
    useEffect(() => {
        if (showSuggestions && search.trim().length > 0) {
            const keywordRaw = search.toLowerCase();
            const keywordNoTone = removeVietnameseTones(keywordRaw); // Xóa dấu keyword
            const uniqueSuggestions = new Set<string>();

            allProducts.forEach((product: any) => {
                const productName = product.name?.toLowerCase() || '';
                const productNameNoTone = removeVietnameseTones(productName); // Xóa dấu tên SP

                // So sánh không dấu
                if (productNameNoTone.includes(keywordNoTone)) {
                    uniqueSuggestions.add(product.name);
                }
            });

            setSuggestions(Array.from(uniqueSuggestions).slice(0, 5));
        } else {
            setSuggestions([]);
        }
    }, [search, showSuggestions, allProducts]);

    const handleSearch = (keywordOverride?: string) => {
        const finalKeyword = keywordOverride !== undefined ? keywordOverride : search.trim();
        setShowSuggestions(false);

        if (location.pathname === '/products') {
            // If on product page, update params accordingly
            setSearchParams(prev => {
                if (finalKeyword) {
                    prev.set('keyword', finalKeyword);
                } else {
                    prev.delete('keyword');
                }
                prev.delete('page');
                return prev;
            });
            if (!finalKeyword && location.pathname !== '/products') {
                navigate('/products');
            }
        } else {
            // not on product page
            if (finalKeyword) {
                navigate(`/products?keyword=${encodeURIComponent(finalKeyword)}`);
            } else {
                navigate('/products');
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setSearch(suggestion); // Cập nhật input ngay lập tức
        handleSearch(suggestion); // Gọi search
    };

    return { 
        search, setSearch, suggestions, showSuggestions, setShowSuggestions,
        handleSearch, handleKeyDown, handleSelectSuggestion, 
        handleFocus: () => setShowSuggestions(true), 
        handleBlur: () => setTimeout(() => setShowSuggestions(false), 200) 
    };
};