import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';

// Define interfaces for the data structure from the API
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
  }
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

  const { product, totalReviews, averageRating } = details || {};

  useEffect(() => {
    const fetchReviews = async () => {
      // Tải đánh giá khi tab được chọn, chưa có dữ liệu và có đánh giá để tải
      if (activeTab === 'reviews' && id && reviews.length === 0 && totalReviews && totalReviews > 0) {
        setReviewsLoading(true);
        setReviewsError(null);
        try {
          // LƯU Ý: Giả định endpoint API để lấy đánh giá của sản phẩm là như sau.
          const response = await axios.get<{ reviews: Review[] }>(`http://localhost:9999/product/${id}/reviews`);
          setReviews(response.data.reviews);
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setReviewsError('Không thể tải danh sách đánh giá. Vui lòng thử lại.');
        } finally {
          setReviewsLoading(false);
        }
      }
    };

    fetchReviews();
  }, [activeTab, id, reviews.length, totalReviews]);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
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
                   Bán bởi <span className="font-bold text-primary">{product.store_id.shop_name}</span>
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
                 </div>
               </div>

               <div className="flex items-baseline gap-4">
                 <span className="text-4xl font-black text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                 {product.original_price > product.price && (
                   <>
                     <span className="text-xl text-slate-400 line-through font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.original_price)}</span>
                     {discount > 0 && (
                       <span className="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Tiết kiệm {discount}%</span>
                     )}
                   </>
                 )}
               </div>

               <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                     <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Số lượng</span>
                     <div className="flex items-center w-fit border border-slate-300 dark:border-white/20 rounded-lg overflow-hidden">
                       <button onClick={() => handleQuantityChange(-1)} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><span className="material-symbols-outlined">remove</span></button>
                       <span className="px-6 py-2 font-bold text-lg min-w-[50px] text-center dark:text-white">{quantity}</span>
                       <button onClick={() => handleQuantityChange(1)} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><span className="material-symbols-outlined">add</span></button>
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
                 className={`shrink-0 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                   activeTab === 'description'
                     ? 'border-primary text-primary'
                     : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                 }`}
               >
                 Mô tả sản phẩm
               </button>
               <button
                 onClick={() => setActiveTab('reviews')}
                 className={`shrink-0 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                   activeTab === 'reviews'
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