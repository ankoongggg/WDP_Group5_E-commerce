import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../../../components/Layout';

// Define interfaces for the data structure from the API
interface ProductType {
  _id: string;
  description: string;
  stock: number;
  price_difference: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  main_image: string;
  display_files: string[];
  price: number;
  original_price: number;
  product_type: ProductType[];
  condition: string;
  category_id: {
    _id: string;
    name: string;
  }[];
  store_id: {
    _id: string;
    shop_name: string;
  }
}

interface ProductDetailsResponse {
  product: Product;
  totalReviews: number;
  averageRating: number;
  ratingCounts: { [key: number]: number };
}

interface ReviewsResponse {
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  totalReviews: number;
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

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<ProductDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductType | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null); // null = All
  const [reviewPage, setReviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<ProductDetailsResponse>(`http://localhost:9999/product/${id}`);
        setDetails(response.data);
        const product = response.data.product;
        setActiveImage(product.main_image || (product.display_files.length > 0 ? product.display_files[0] : ''));
        if (product.product_type && product.product_type.length > 0) {
          setSelectedVariation(product.product_type[0]);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Không tìm thấy sản phẩm.');
        } else {
          setError('Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau.');
        }
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const { product, totalReviews, averageRating, ratingCounts } = details || {};

  const handleRatingFilterChange = (rating: number | null) => {
    setRatingFilter(rating);
    setReviewPage(1); // Reset to the first page
    setReviews([]);   // Clear current reviews to show loading state and fetch new
  };

  useEffect(() => {
    // Only fetch when the reviews tab is active and we have a product ID
    if (activeTab !== 'reviews' || !id) {
      return;
    }

    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const params = new URLSearchParams({
          page: String(reviewPage),
          limit: '5', // Fetch 5 reviews per page
        });
        if (ratingFilter !== null) {
          params.append('rating', String(ratingFilter));
        }

        const response = await axios.get<ReviewsResponse>(
          `http://localhost:9999/product/${id}/reviews`,
          { params }
        );

        // Append reviews if loading more, otherwise replace
        setReviews(prev => reviewPage === 1 ? response.data.reviews : [...prev, ...response.data.reviews]);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviewsError('Không thể tải danh sách đánh giá. Vui lòng thử lại.');
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [activeTab, id, ratingFilter, reviewPage]);

  const handleQuantityChange = (amount: number) => {
    const maxStock = selectedVariation?.stock ?? 999; // Giới hạn số lượng nếu không có thông tin tồn kho
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (newQuantity > maxStock) return maxStock;
      return newQuantity;
    });
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxStock = selectedVariation?.stock ?? 999;
    const value = e.target.value;

    // Reset to 1 if input is cleared, to keep state as a number
    if (value === '') {
      setQuantity(1);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return; // Ignore non-numeric input
    }

    if (numValue > maxStock) {
      setQuantity(maxStock);
    } else {
      setQuantity(numValue < 1 ? 1 : numValue);
    }
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

  if (loading) {
    return <Layout><div className="flex justify-center items-center h-screen">Đang tải...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center py-20 text-red-500">{error}</div></Layout>;
  }

  if (!product) {
    return <Layout><div className="text-center py-20">Không có chi tiết sản phẩm.</div></Layout>;
  }

  const allImages = [product.main_image, ...product.display_files].filter(Boolean);
  const finalPrice = product.price + (selectedVariation?.price_difference || 0);
  const discount = (product.original_price && finalPrice && product.original_price > finalPrice)
    ? Math.round(((product.original_price - finalPrice) / product.original_price) * 100)
    : 0;

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
                Bán bởi <Link to={`/store/${product.store_id._id}`} className="font-bold text-primary hover:underline">
                  {product.store_id.shop_name}
                </Link>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {product.category_id?.[0] && (
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">{product.category_id[0].name}</span>
                )}
                {product.condition?.toLowerCase() === 'used' && (
                  <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Đã qua sử dụng
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight dark:text-white">{product.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex text-amber-400">
                  {averageRating && renderStars(averageRating)}
                </div>
                <span className="text-slate-400">{totalReviews || 0} Đánh giá</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}</span>
              {product.original_price > finalPrice && (
                <>
                  <span className="text-xl text-slate-400 line-through font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.original_price)}</span>
                  {discount > 0 && (
                    <span className="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Tiết kiệm {discount}%</span>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-6">
              {product.product_type && product.product_type.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Phân loại</span>
                  <div className="flex flex-wrap gap-3">
                    {product.product_type.map((variation) => (
                      <button
                        key={variation._id}
                        onClick={() => {
                          if (variation.stock > 0) {
                            setSelectedVariation(variation);
                            setQuantity(1); // Reset số lượng khi đổi phân loại
                          }
                        }}
                        disabled={variation.stock === 0}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${selectedVariation?._id === variation._id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-300 dark:border-white/20 hover:border-primary/50'
                          }`}
                      >
                        {variation.description} {variation.stock > 0 ? `` : '(Hết hàng)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Số lượng</span>
                  {selectedVariation && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">{selectedVariation.stock} sản phẩm có sẵn</span>
                  )}
                </div>
                <div className="flex items-center w-fit border border-slate-300 dark:border-white/20 rounded-lg overflow-hidden">
                  <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><span className="material-symbols-outlined">remove</span></button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityInputChange}
                    min="1"
                    max={selectedVariation?.stock ?? 999}
                    className="px-2 font-bold text-lg w-16 text-center bg-transparent border-none focus:ring-0 dark:text-white appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={() => handleQuantityChange(1)} disabled={quantity >= (selectedVariation?.stock ?? 999)} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><span className="material-symbols-outlined">add</span></button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all">
                  <span className="material-symbols-outlined">shopping_cart</span> Thêm vào giỏ hàng
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                  <span className="material-symbols-outlined">bolt</span> Mua ngay
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
                {/* Review Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-200 dark:border-white/10">
                  <div className="flex flex-col items-center justify-center text-center md:col-span-1 md:border-r md:border-slate-200 md:dark:border-white/10 md:pr-8">
                    <p className="text-5xl font-extrabold dark:text-white">
                      {averageRating ? averageRating.toFixed(1) : '0.0'}
                    </p>
                    <div className="flex text-amber-400 my-2">
                      {averageRating && renderStars(averageRating)}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Dựa trên {totalReviews || 0} đánh giá
                    </p>
                  </div>
                  <div className="md:col-span-2 flex flex-col-reverse gap-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = (ratingCounts && ratingCounts[star]) || 0;
                      const percentage = totalReviews && totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3 text-sm">
                          <span className="font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {star} sao
                          </span>
                          <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="font-bold w-10 text-right text-slate-600 dark:text-slate-300">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Lọc theo:</span>
                  <button
                    onClick={() => handleRatingFilterChange(null)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${ratingFilter === null
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'
                      }`}
                  >
                    Tất cả
                  </button>
                  {[5, 4, 3, 2, 1].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRatingFilterChange(star)}
                      className={`flex items-center gap-1 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${ratingFilter === star
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'
                        }`}
                    >
                      {star} <span className="material-symbols-outlined !text-sm fill text-amber-400">star</span>
                    </button>
                  ))}
                </div>

                {/* Reviews List */}
                {reviewsLoading && reviewPage === 1 && <div className="text-center p-4">Đang tải đánh giá...</div>}
                {reviewsError && <div className="text-center p-4 text-red-500">{reviewsError}</div>}

                {!reviewsError && (
                  <>
                    {reviews.length > 0 ? (
                      <>
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
                                <div className="flex text-amber-400 my-1">{renderStars(review.rating, 'text-sm')}</div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                                {/* Image uploads would go here */}
                              </div>
                            </div>
                          ))}
                        </div>

                        {reviewPage < totalPages && (
                          <div className="mt-8 text-center">
                            <button
                              onClick={() => setReviewPage(p => p + 1)}
                              disabled={reviewsLoading}
                              className="px-6 py-2 border border-primary text-primary font-bold rounded-lg hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {reviewsLoading ? 'Đang tải...' : 'Xem thêm đánh giá'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      !reviewsLoading && <div className="text-center py-8 text-slate-600 dark:text-slate-400">{totalReviews && totalReviews > 0 ? 'Không có đánh giá nào phù hợp với bộ lọc của bạn.' : 'Hiện tại chưa có đánh giá nào cho sản phẩm này.'}</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;