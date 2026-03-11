import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { useToast } from '../../context/ToastContext';

interface Product {
  _id: string;
  name: string;
  main_image: string;
  store_id: {
    shop_name: string;
  };
}

interface Review {
  rating: number;
  comment: string;
  created_at: string;
  is_edited: boolean; // Thêm trường này
}

const StarRating = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            className={`transition-colors text-4xl ${ratingValue <= (hover || rating) ? 'text-amber-400' : 'text-slate-300'}`}
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            <span className="material-symbols-outlined fill">star</span>
          </button>
        );
      })}
    </div>
  );
};

const StarRatingDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-2">
    {[...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      return (
        <span key={ratingValue} className={`material-symbols-outlined fill text-4xl ${ratingValue <= rating ? 'text-amber-400' : 'text-slate-300'}`}>
          star
        </span>
      );
    })}
  </div>
);

const FeedbackProduct: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const productId = searchParams.get('productId');
  const orderId = searchParams.get('orderId');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  
  // State để bật tắt chế độ Sửa
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!productId || !orderId) {
      toast.error('URL không hợp lệ để đánh giá sản phẩm.');
      navigate('/account/orders');
      return;
    }

    const fetchProductAndReview = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };

        const [productResponse, reviewResponse] = await Promise.all([
          axios.get(`http://localhost:9999/api/products/${productId}`),
          axios.get(`http://localhost:9999/api/users/feedback/check`, {
            params: { product_id: productId, order_id: orderId },
            headers,
          }),
        ]);

        if (productResponse.data && productResponse.data.product) {
          setProduct(productResponse.data.product);
        } else if (productResponse.data.success && productResponse.data.data) {
          setProduct(productResponse.data.data);
        }

        if (reviewResponse.data.success && reviewResponse.data.data) {
          setExistingReview(reviewResponse.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch product for review', error);
        toast.error('Không tìm thấy sản phẩm để đánh giá.');
        navigate('/account/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReview();
  }, [productId, orderId, navigate, toast]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.warning('Vui lòng chọn số sao đánh giá.');
    if (!comment.trim()) return toast.warning('Vui lòng nhập nội dung đánh giá.');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const payload = { product_id: productId, order_id: orderId, rating, comment };
      
      // Nếu đang ở chế độ sửa thì gọi PUT, còn tạo mới thì gọi POST
      if (isEditMode) {
        await axios.put('http://localhost:9999/api/users/feedback', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật đánh giá thành công!');
      } else {
        await axios.post('http://localhost:9999/api/users/feedback', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      }
      navigate(`/account/orders/${orderId}`); 
    } catch (error: any) {
      console.error('Failed to submit review', error);
      toast.error(error.response?.data?.message || 'Gửi đánh giá thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const enableEditMode = () => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
      setIsEditMode(true);
    }
  };

  if (loading) return <Layout><div className="p-10 text-center">Đang tải trang đánh giá...</div></Layout>;
  if (!product) return <Layout><div className="p-10 text-center">Không tìm thấy sản phẩm.</div></Layout>;

  // Nếu ĐÃ REVIEW và KHÔNG bật Edit Mode -> Giao diện chỉ đọc
  if (existingReview && !isEditMode) {
    return (
      <Layout>
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="mb-6">
              <Link to={`/account/orders/${orderId}`} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">arrow_back</span> TRỞ LẠI ĐƠN HÀNG
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 border border-slate-100 dark:border-slate-700">
              <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">Đánh giá của bạn</h1>
              <p className="text-slate-500 text-center mb-8">Bạn đã đánh giá sản phẩm này vào ngày {new Date(existingReview.created_at).toLocaleDateString('vi-VN')}.</p>

              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                <img src={product.main_image} alt={product.name} className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500">{product.store_id?.shop_name || 'Cửa hàng'}</p>
                  <h3 className="font-bold text-lg dark:text-white line-clamp-2">{product.name}</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-center text-slate-600 dark:text-slate-300">Chất lượng sản phẩm</label>
                  <div className="flex justify-center"><StarRatingDisplay rating={existingReview.rating} /></div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Nội dung đánh giá</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 dark:text-white min-h-[120px] whitespace-pre-wrap">{existingReview.comment || <span className="text-slate-400">Không có bình luận.</span>}</div>
                </div>
                
                {/* NÚT CHỈNH SỬA (CHỈ HIỆN KHI is_edited LÀ FALSE) */}
                {!existingReview.is_edited && (
                  <button 
                    onClick={enableEditMode}
                    className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Sửa đánh giá (Còn 1 lần)
                  </button>
                )}
                {existingReview.is_edited && (
                  <p className="text-center text-sm text-amber-500 mt-4 italic">Đánh giá này đã được chỉnh sửa và không thể thay đổi thêm.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Giao diện Form (Tạo mới HOẶC Sửa)
  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6 flex justify-between">
            <Link to={`/account/orders/${orderId}`} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_back</span> {isEditMode ? 'HỦY SỬA' : 'TRỞ LẠI ĐƠN HÀNG'}
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 border border-slate-100 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">{isEditMode ? 'Chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}</h1>
            <p className="text-slate-500 text-center mb-8">{isEditMode ? 'Lưu ý: Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất.' : 'Chia sẻ cảm nhận của bạn về sản phẩm đã mua.'}</p>

            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
              <img src={product.main_image} alt={product.name} className="w-20 h-20 rounded-md object-cover" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">{product.store_id?.shop_name || 'Cửa hàng'}</p>
                <h3 className="font-bold text-lg dark:text-white line-clamp-2">{product.name}</h3>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-center text-slate-600 dark:text-slate-300">Chất lượng sản phẩm</label>
                <div className="flex justify-center"><StarRating rating={rating} setRating={setRating} /></div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Viết đánh giá của bạn</label>
                <textarea id="comment" rows={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Sản phẩm dùng rất tốt, đóng gói cẩn thận..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (<><span className="material-symbols-outlined animate-spin text-lg">sync</span> Đang gửi...</>) : (<><span className="material-symbols-outlined text-lg">{isEditMode ? 'save' : 'send'}</span> {isEditMode ? 'Lưu thay đổi' : 'Gửi đánh giá'}</>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FeedbackProduct;