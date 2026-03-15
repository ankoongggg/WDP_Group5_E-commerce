import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  main_image: string;
  display_files: string[];
  price: number;
  original_price: number;
  category_id: {
    _id: string;
    name: string;
  }[];
  store_id: {
    _id: string;
    shop_name: string;
  };
  product_type?: {
    description: string;
    stock: number;
    price_difference: number;
  }[];
  stock?: number;
  condition: string;
}

interface ProductDetailsResponse {
  product: Product;
  totalReviews: number;
  averageRating: number;
}

interface Review {
  _id: string;
  user_id: {
    _id: string;
    account_name: string;
    avatar?: string;
  };
  rating: number;
  comment?: string;
  created_at: string;
  fileUploads?: string[];
}

interface ReviewsResponse {
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  totalReviews: number;
}

interface RelatedProduct {
  _id: string;
  name: string;
  main_image: string;
  price: number;
  original_price?: number;
  stock?: number;
  product_type?: { stock: number }[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated, setUser } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [details, setDetails] = useState<ProductDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedTypeIndex, setSelectedTypeIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [isFetchingMoreReviews, setIsFetchingMoreReviews] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<ProductDetailsResponse>(`http://localhost:9999/api/products/${id}`);
        setDetails(response.data);
        const product = response.data.product;
        setActiveImage(product.main_image || (product.display_files.length > 0 ? product.display_files[0] : ''));
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Không tìm thấy sản phẩm.');
        } else {
          setError('Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const { product, totalReviews, averageRating } = details || {};

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.store_id?._id || !product?._id) return;
      setLoadingRelated(true);
      try {
        const params = { limit: 5, exclude: product._id };
        const response = await axios.get<{ products: RelatedProduct[] }>(`http://localhost:9999/api/store/${product.store_id._id}/products`, { params });
        setRelatedProducts(response.data.products);
      } catch (err) {
        console.error("Failed to fetch related products:", err);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelatedProducts();
  }, [product]);

  useEffect(() => {
    if (isAuthenticated && user?.wishlist && product?._id) {
      setIsWishlisted(user.wishlist.includes(product._id));
    } else {
      setIsWishlisted(false);
    }
  }, [user, product, isAuthenticated]);

  const REVIEWS_PER_PAGE = 5;

  const fetchReviews = async (page: number) => {
    if (!id) return;
    const isLoadingFirstPage = page === 1;
    if (isLoadingFirstPage) {
      setReviewsLoading(true);
    } else {
      setIsFetchingMoreReviews(true);
    }
    setReviewsError(null);

    try {
      const response = await axios.get<ReviewsResponse>(`http://localhost:9999/api/products/${id}/reviews`, {
        params: { page, limit: REVIEWS_PER_PAGE }
      });
      const { reviews: newReviews, totalPages } = response.data;
      setReviews(prev => (isLoadingFirstPage ? newReviews : [...prev, ...newReviews]));
      setReviewsPage(page);
      setReviewsTotalPages(totalPages);
    } catch (err) {
      setReviewsError('Không thể tải danh sách đánh giá. Vui lòng thử lại.');
    } finally {
      if (isLoadingFirstPage) {
        setReviewsLoading(false);
      } else {
        setIsFetchingMoreReviews(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0 && totalReviews && totalReviews > 0) {
      fetchReviews(1);
    }
  }, [activeTab, id, totalReviews]);

  const handleLoadMoreReviews = () => {
    if (!isFetchingMoreReviews && reviewsPage < reviewsTotalPages) {
      fetchReviews(reviewsPage + 1);
    }
  };
  
  const hasVariants = product && product.product_type && product.product_type.length > 0;
  const selectedVariant = hasVariants && selectedTypeIndex !== null ? product.product_type![selectedTypeIndex] : null;

  const finalPrice = React.useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) {
      return product.price + (selectedVariant.price_difference || 0);
    }
    return product.price;
  }, [product, selectedVariant]);

  const stockForControls = React.useMemo(() => {
    if (!product) return 0;
    if (hasVariants) {
      if (selectedVariant) return selectedVariant.stock || 0;
      return 0;
    }
    return product.stock ?? 0;
  }, [product, hasVariants, selectedVariant]);

  const totalStock = React.useMemo(() => {
    if (!product) return 0;
    if (hasVariants) {
      return product.product_type!.reduce((acc, item) => acc + (item.stock || 0), 0);
    }
    return product.stock || 0;
  }, [product, hasVariants]);

  const isOutOfStock = totalStock <= 0;
  const isActionDisabled = isOutOfStock || (hasVariants && selectedTypeIndex === null);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để yêu thích sản phẩm.');
      navigate('/login');
      return;
    }
    if (!product?._id || isTogglingWishlist) return;

    setIsTogglingWishlist(true);
    try {
      const response = await authApi.toggleWishlist(product._id);
      toast.success(response.message);
      const newWishlist: string[] = response.data || [];
      setIsWishlisted(newWishlist.includes(product._id));
      if (setUser) {
        setUser(currentUser => currentUser ? { ...currentUser, wishlist: newWishlist } : null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (hasVariants && selectedTypeIndex === null) {
      toast.error('Vui lòng chọn loại sản phẩm!');
      return;
    }
    if (stockForControls <= 0) {
      toast.error('Sản phẩm này đã hết hàng!');
      return;
    }
    const itemForCart = {
      ...product,
      price: finalPrice,
      stock: stockForControls,
      name: selectedVariant ? `${product.name} (${selectedVariant.description})` : product.name,
      _id: selectedVariant ? `${product._id}-${selectedVariant.description}` : product._id,
      productId: product._id,
      type: selectedVariant ? selectedVariant.description : 'default' // ÉP TYPE VÀO ĐÂY
    };
    addToCart(itemForCart, quantity);
    toast.success('Đã thêm vào giỏ hàng!');
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (hasVariants && selectedTypeIndex === null) {
      toast.error('Vui lòng chọn loại sản phẩm!');
      return;
    }
    if (stockForControls <= 0) {
      toast.error('Sản phẩm này đã hết hàng!');
      return;
    }

    const buyNowItem = {
      productId: product._id,
      name: selectedVariant ? `${product.name} (${selectedVariant.description})` : product.name,
      price: finalPrice,
      main_image: product.main_image,
      stock: stockForControls,
      quantity: quantity,
      type: selectedVariant ? selectedVariant.description : 'default', // ÉP TYPE VÀO ĐÂY
      variant: selectedVariant ? { description: selectedVariant.description } : undefined,
    };

    toast.success('Đang chuyển tới thanh toán...');
    setTimeout(() => {
      navigate('/checkout', { state: { buyNowItems: [buyNowItem] } });
    }, 500);
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => {
      const newValue = prev + amount;
      if (newValue > stockForControls) return stockForControls;
      return Math.max(1, newValue);
    });
  };

  const renderStars = (rating: number, sizeClass: string = '') => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
        {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className={`material-symbols-outlined fill ${sizeClass}`}>star</span>)}
        {halfStar && <span key="half" className={`material-symbols-outlined fill ${sizeClass}`}>star_half</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className={`material-symbols-outlined ${sizeClass}`}>star</span>)}
      </>
    );
  };

  if (loading) return <Layout><div className="flex justify-center items-center h-screen">Đang tải...</div></Layout>;
  if (error) return <Layout><div className="text-center py-20 text-red-500">{error}</div></Layout>;
  if (!product) return <Layout><div className="text-center py-20">Không có chi tiết sản phẩm.</div></Layout>;

  const allImages = [product.main_image, ...product.display_files].filter(Boolean);
  const discount = (product.original_price && product.price && product.original_price > product.price) ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to="/products" className="hover:text-primary">Sản phẩm</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${activeImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="text-sm text-slate-500 mb-2 dark:text-slate-400">
                Bán bởi {product.store_id ? <Link to={`/store/${product.store_id._id}`} className="font-bold text-primary hover:underline">{product.store_id.shop_name}</Link> : <span className="font-bold text-slate-400">Unknown Store</span>}
              </div>
              {product.category_id?.[0] && (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider mb-2">{product.category_id[0].name}</span>
              )}
              <h1 className="text-4xl font-extrabold tracking-tight dark:text-white">{product.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex text-amber-400">
                  {averageRating && renderStars(averageRating)}
                </div>
                <span className="text-slate-400">{totalReviews || 0} Đánh giá</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {isOutOfStock ? 'Hết hàng' : `Còn hàng (${selectedVariant ? selectedVariant.stock || 0 : totalStock})`}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-primary">{formatPrice(finalPrice)}</span>
              {product.original_price > product.price && (
                <>
                  <span className="text-xl text-slate-400 line-through font-medium">{formatPrice(product.original_price)}</span>
                  {discount > 0 && (
                    <span className="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Tiết kiệm {discount}%</span>
                  )}
                </>
              )}
            </div>

            {hasVariants && (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Phân loại</span>
                <div className="flex flex-wrap gap-3">
                  {product.product_type!.map((type, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedTypeIndex(index);
                        setQuantity(1); 
                      }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors relative ${selectedTypeIndex === index
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/50'
                          : 'border-slate-300 dark:border-white/20 hover:border-primary/50'
                        } ${type.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={type.stock === 0}
                      title={type.stock === 0 ? 'Hết hàng' : ''}
                    >
                      {type.description}
                      {/* {type.price_difference !== 0 && (
                        <span className="ml-1.5 text-xs font-normal">
                          ({type.price_difference > 0 ? '+' : ''}{formatPrice(type.price_difference)})
                        </span>
                      )} */}
                      {type.stock === 0 && <div className="absolute -top-1.5 -right-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">Hết</div>}
                    </button>
                  ))}
                </div>
                {hasVariants && selectedTypeIndex === null && <p className="text-sm text-red-500 mt-1">Vui lòng chọn một phân loại.</p>}
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Số lượng</span>
                <div className={`flex items-center w-fit border border-slate-300 dark:border-white/20 rounded-lg overflow-hidden ${isActionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button onClick={() => handleQuantityChange(-1)} disabled={isActionDisabled} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><span className="material-symbols-outlined">remove</span></button>
                  <span className="px-6 py-2 font-bold text-lg min-w-[50px] text-center dark:text-white">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} disabled={isActionDisabled} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><span className="material-symbols-outlined">add</span></button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleAddToCart} disabled={isActionDisabled} className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 border-2 font-bold rounded-xl transition-all ${isActionDisabled ? 'border-slate-300 text-slate-400 cursor-not-allowed' : 'border-primary text-primary hover:bg-primary/5'}`}>
                  <span className="material-symbols-outlined">shopping_cart</span> Thêm vào giỏ hàng
                </button>
                <button onClick={handleBuyNow} disabled={isActionDisabled} className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl shadow-lg transition-all ${isActionDisabled ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'}`}>
                  <span className="material-symbols-outlined">bolt</span> Mua ngay
                </button>
                <button
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  className={`p-4 rounded-xl border-2 transition-colors flex items-center justify-center ${isTogglingWishlist ? 'cursor-wait' : ''
                    } ${isWishlisted
                      ? 'bg-red-100 border-red-200 text-red-500 hover:bg-red-200'
                      : 'border-slate-300 dark:border-white/20 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  title={isWishlisted ? 'Bỏ yêu thích' : 'Yêu thích'}
                >
                  <span className={`material-symbols-outlined ${isWishlisted ? 'fill' : ''}`}>
                    favorite
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="border-b border-slate-200 dark:border-white/10">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('description')}
                className={`shrink-0 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'description'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                Mô tả sản phẩm
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`shrink-0 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'reviews'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
              >
                Đánh giá ({totalReviews || 0})
              </button>
            </nav>
          </div>
          <div className="py-10">
            {activeTab === 'description' && (
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: product.description }} />
            )}
            {activeTab === 'reviews' && (
              <div>
                {reviewsLoading && <div className="text-center p-4">Đang tải đánh giá...</div>}
                {reviewsError && <div className="text-center p-4 text-red-500">{reviewsError}</div>}
                {!reviewsLoading && !reviewsError && (
                  <>
                    {reviews.length > 0 ? (
                      <div className="space-y-0">
                        {reviews.map((review) => (
                          <div key={review._id} className="flex gap-4 py-6 border-b border-slate-200 dark:border-white/10 last:border-b-0">
                            <img
                              src={review.user_id.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user_id.account_name)}&background=random&color=fff`}
                              alt={review.user_id.account_name}
                              className="w-10 h-10 rounded-full object-cover bg-slate-200"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold dark:text-white">{review.user_id.account_name}</h4>
                                <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="flex text-amber-400 my-1">
                                {renderStars(review.rating, 'text-sm')}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                              {review.fileUploads && review.fileUploads.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {review.fileUploads.map((file, index) => (
                                    <img
                                      key={index}
                                      src={file}
                                      alt={`Ảnh đánh giá ${index + 1}`}
                                      className="w-20 h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-600 dark:text-slate-400">Hiện tại chưa có đánh giá nào cho sản phẩm này.</div>
                    )}

                    {!reviewsLoading && reviews.length > 0 && reviewsPage < reviewsTotalPages && (
                      <div className="mt-8 text-center">
                        <button
                          onClick={handleLoadMoreReviews}
                          disabled={isFetchingMoreReviews}
                          className="px-6 py-3 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-wait transition-colors"
                        >
                          {isFetchingMoreReviews ? 'Đang tải thêm...' : 'Xem thêm đánh giá'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold mb-6 dark:text-white border-b-2 border-primary pb-2 inline-block">
              Sản phẩm khác từ {product.store_id.shop_name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;