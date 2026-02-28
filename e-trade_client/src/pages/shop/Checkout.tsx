import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { shopApi } from '../../services/api';
import { useCurrency } from '@/src/context/CurrencyContext';
interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  type?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // =====================================================
  // STATE
  // =====================================================
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { formatPrice } = useCurrency();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Form state
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });


  // Address state (Local state for this order only)
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    recipient_name: '',
    phone: '',
    street: '',
    district: '',
    city: ''
  });

  // Loading & submission
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // =====================================================
  // EFFECTS
  // =====================================================

  // Load cart from localStorage
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  }, []);

  // Load initial address from user profile
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find((a: any) => a.is_default) || user.addresses?.[0];
      
      setShippingAddress({
        recipient_name: defaultAddr?.recipient_name || user.full_name || '',
        phone: defaultAddr?.phone || user.phone || '',
        street: defaultAddr?.street || '',
        district: defaultAddr?.district || '',
        city: defaultAddr?.city || ''
      });

      // If no address exists, open edit mode automatically
      if (!user.addresses || user.addresses.length === 0) {
        setIsEditingAddress(true);
      }
    }
  }, [user]);

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        const res: any = await shopApi.getPaymentMethods();
        setPaymentMethods(res.data);
        // Default select first payment method
        if (res.data.length > 0) {
          setSelectedPayment(res.data[0].id);
        }
      } catch (error) {
        console.error('Failed to load payment methods', error);
        toast.error('Failed to load payment methods');
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    loadPaymentMethods();
  }, [toast]);

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = shippingMethod === 'express' ? 400000 : 260000;
  const total = subtotal + shippingFee;
  // =====================================================
  // HANDLERS
  // =====================================================

  // Validate card details
  const validateCardDetails = (): boolean => {
    if (selectedPayment === 'cod') return true;

    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Invalid card number');
      return false;
    }

    if (!cardDetails.cardHolder.trim()) {
      toast.error('Card holder name is required');
      return false;
    }

    if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      toast.error('Invalid expiry date (MM/YY)');
      return false;
    }

    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
      toast.error('Invalid CVV');
      return false;
    }

    return true;
  };

  // Place order (Step 1: Create order in DB)
  const handlePlaceOrder = async () => {
    try {
      // Validate
      if (!user) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      if (cartItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      if (!selectedPayment) {
        toast.error('Please select a payment method');
        return;
      }

      // Validate shipping address form
      if (!shippingAddress.recipient_name || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
        toast.error('Please fill in all shipping address details');
        setIsEditingAddress(true);
        return;
      }

      setCreatingOrder(true);

      // API call
      const response: any = await shopApi.createOrder({
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          type: item.type || 'default'
        })),
        shippingAddress: shippingAddress,
        shippingMethod: shippingMethod,
        paymentMethod: selectedPayment
      });

      toast.success('Order created! Proceeding to payment...');

      // Step 2: Process payment
      await handleSubmitPayment(response.data.orderId);

    } catch (error: any) {
      console.error('Place order error:', error);
      toast.error(error?.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Submit payment (Step 2: Process payment request)
  const handleSubmitPayment = async (orderId: string) => {
    try {
      // Validate card if not COD
      if (selectedPayment !== 'cod' && !validateCardDetails()) {
        return;
      }

      setProcessingPayment(true);

      // API call
      const response: any = await shopApi.submitPayment(orderId, {
        paymentMethod: selectedPayment,
        cardDetails: selectedPayment !== 'cod' ? {
          cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
          cvv: cardDetails.cvv,
          expiryDate: cardDetails.expiryDate
        } : null
      });

      // Success!
      toast.success('Payment successful! ✅');
      
      // Clear cart
      localStorage.removeItem('cart');
      
      // Redirect to order detail
      setTimeout(() => {
        navigate(`/account/orders/${orderId}`);
      }, 1500);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = value.match(/.{1,4}/g);
    const formatted = parts?.join(' ') || value;
    setCardDetails({ ...cardDetails, cardNumber: formatted });
  };

  // Format expiry date
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardDetails({ ...cardDetails, expiryDate: value });
  };

  // Format CVV
  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardDetails({ ...cardDetails, cvv: value });
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Your cart is empty</h2>
          <button 
            onClick={() => navigate('/products')}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold"
          >
            Continue Shopping
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Address */}
            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                  <span className="material-symbols-outlined text-primary">location_on</span> Shipping Address
                </h2>
                {!isEditingAddress && (
                  <button onClick={() => setIsEditingAddress(true)} className="text-primary text-sm font-semibold hover:underline">
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingAddress ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient Name</label>
                      <input 
                        type="text" 
                        value={shippingAddress.recipient_name}
                        onChange={(e) => setShippingAddress({...shippingAddress, recipient_name: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Street Address</label>
                    <input 
                      type="text" 
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">District</label>
                      <input 
                        type="text" 
                        value={shippingAddress.district}
                        onChange={(e) => setShippingAddress({...shippingAddress, district: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                      <input 
                        type="text" 
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setIsEditingAddress(false)}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
                    >
                      Save for this order
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    {shippingAddress.street ? (
                      <>
                        <p className="font-bold dark:text-white">
                          {shippingAddress.recipient_name} 
                          <span className="font-normal text-slate-500"> | {shippingAddress.phone}</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {shippingAddress.street}, {shippingAddress.district}, {shippingAddress.city}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">Please enter shipping address</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Shipping Method */}
            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white">
                <span className="material-symbols-outlined text-primary">local_shipping</span> Shipping Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-xl border p-4 ring-2 transition-all ${
                  shippingMethod === 'standard' ? 'ring-primary border-primary bg-primary/5' : 'ring-0 border-slate-200 dark:border-primary/20'
                }`}>
                  <input 
                    type="radio" 
                    name="shipping" 
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={(e) => setShippingMethod(e.target.value as 'standard' | 'express')}
                    className="sr-only" 
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Standard Delivery</span>
                    <span className="text-xs text-slate-500 mt-1">Arriving in 3-5 days</span>
                  </span>
                  <span className="text-sm font-bold text-primary">{formatPrice(260000)}</span>
                </label>
                <label className={`relative flex cursor-pointer rounded-xl border p-4 ring-2 transition-all ${
                  shippingMethod === 'express' ? 'ring-primary border-primary bg-primary/5' : 'ring-0 border-slate-200 dark:border-primary/20'
                }`}>
                  <input 
                    type="radio" 
                    name="shipping" 
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={(e) => setShippingMethod(e.target.value as 'standard' | 'express')}
                    className="sr-only" 
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Express Delivery</span>
                    <span className="text-xs text-slate-500 mt-1">Arriving in 1-2 days</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(400000)}</span>
                </label>
              </div>
            </section>

            {/* Payment Method Selection */}
            <section className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white">
                <span className="material-symbols-outlined text-primary">credit_card</span> Payment Method
              </h2>

              {loadingPaymentMethods ? (
                <p className="text-slate-500">Loading payment methods...</p>
              ) : (
                <>
                  {/* Payment Method Options */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                          selectedPayment === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-primary/20 hover:border-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{
                          color: selectedPayment === method.id ? 'var(--primary)' : 'inherit'
                        }}>
                          {method.icon}
                        </span>
                        <span className="text-xs font-bold mt-2 text-center dark:text-white line-clamp-2">
                          {method.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Card Details Form - Only show for card payments */}
                  {(selectedPayment === 'credit_card' || selectedPayment === 'debit_card') && (
                    <div className="bg-slate-50 dark:bg-background-dark rounded-lg p-6 border border-slate-100 dark:border-primary/10">
                      <h3 className="font-bold mb-4 dark:text-white">Card Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="cardNumber" className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                          <input 
                            id="cardNumber"
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            maxLength="19"
                            value={cardDetails.cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="cardHolder" className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Holder</label>
                          <input 
                            id="cardHolder"
                            type="text" 
                            placeholder="John Doe" 
                            value={cardDetails.cardHolder}
                            onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="expiryDate" className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                          <input 
                            id="expiryDate"
                            type="text" 
                            placeholder="MM/YY" 
                            maxLength="5"
                            value={cardDetails.expiryDate}
                            onChange={handleExpiryDateChange}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="cvv" className="block text-xs font-bold text-slate-500 uppercase mb-1">CVV</label>
                          <input 
                            id="cvv"
                            type="text" 
                            placeholder="123" 
                            maxLength="3"
                            value={cardDetails.cvv}
                            onChange={handleCVVChange}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COD Message */}
                  {selectedPayment === 'cod' && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-primary/20 text-center animate-fade-in">
                      <span className="material-symbols-outlined text-4xl text-primary mb-2">local_shipping</span>
                      <h3 className="font-bold dark:text-white mb-1">Cash On Delivery Selected</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">You will pay for this order in cash when it is delivered to your address.</p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-4">
            <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/20 p-6 shadow-lg sticky top-24">
              <h2 className="text-lg font-bold mb-6 dark:text-white">Order Summary</h2>


              {/* Items List */}
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm dark:text-slate-300">
                    <span>{item.productName} x {item.quantity}</span>
                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm border-b border-slate-100 dark:border-primary/10 pb-4 mb-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="font-bold">{formatPrice(shippingFee)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-bold dark:text-white">Total Amount</span>
                <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={creatingOrder || processingPayment}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all"
              >
                {creatingOrder || processingPayment ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    {creatingOrder ? 'Creating Order...' : 'Processing Payment...'}
                  </>
                ) : (
                  <>
                    Place Order <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;