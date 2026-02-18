import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import React from 'react';
import { ProductService } from '../services/productService';

export const useSearch = () => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Sync search input với URL keyword param
    useEffect(() => {
        const urlKeyword = searchParams.get('keyword') || '';
        setSearch(urlKeyword);
    }, [searchParams, location]);

    // Fetch tất cả products lần đầu
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await ProductService.getAll({ limit: 1000 });
                setAllProducts(res.data || []);
            } catch (error) {
                console.error('Failed to fetch products', error);
            }
        };
        fetchProducts();
    }, []);

    // Lọc gợi ý từ khóa khi người dùng nhập
    useEffect(() => {
        if (isFocused && search.trim().length > 0) {
            const keyword = search.toLowerCase();
            const uniqueSuggestions = new Set<string>();

            allProducts.forEach((product: any) => {
                const productName = product.name?.toLowerCase() || '';
                if (productName.includes(keyword)) {
                    uniqueSuggestions.add(product.name);
                }
            });

            setSuggestions(Array.from(uniqueSuggestions).slice(0, 8));
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [search, allProducts, isFocused]);

    const handleSearch = (keyword?: string) => {
        const finalKeyword = keyword || search.trim();
        if (finalKeyword) {
            const isOnProductPage = location.pathname === '/products';
            
            if (isOnProductPage) {
                // (không reload page)
                setSearchParams({ keyword: finalKeyword });
            } else {
                // Nếu chưa ở ProductList, navigate tới ProductList
                navigate(`/products?keyword=${encodeURIComponent(finalKeyword)}`);
            }
            
            // Ẩn gợi ý sau khi tìm kiếm
            setShowSuggestions(false);
            setIsFocused(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setSearch(suggestion);
        const isOnProductPage = location.pathname === '/products';
        
        if (isOnProductPage) {
            setSearchParams({ keyword: suggestion });
        } else {
            navigate(`/products?keyword=${encodeURIComponent(suggestion)}`);
        }
        
        setShowSuggestions(false);
        setIsFocused(false);
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        // Delay để user kịp click vào suggestion
        setTimeout(() => {
            setIsFocused(false);
            setShowSuggestions(false);
        }, 200);
    };

    return { search, setSearch, suggestions, showSuggestions, handleSearch, handleKeyDown, handleSelectSuggestion, handleFocus, handleBlur };
};