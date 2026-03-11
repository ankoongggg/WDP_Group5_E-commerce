import { useEffect, useState } from 'react';
import { ProductService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';

export interface SellerProduct {
  _id: string;
  name: string;
  main_image?: string;
  price: number;
  original_price?: number;
  condition?: string;
  status: string[] | string;
  created_at?: string;
}

export const useSellerProducts = () => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res: any = await ProductService.getSellerProducts({ status, search, page, limit });
      setProducts(res.data || res.products || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search]);

  const refresh = () => {
    fetchProducts();
  };

  return {
    products,
    loading,
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    limit,
    refresh,
  };
};

