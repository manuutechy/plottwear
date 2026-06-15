'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ShoppingBag, ChevronRight, CheckCircle2, Ticket, Smartphone, RefreshCw, AlertCircle, Loader2, Key, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
  };
  variant: {
    size: string;
    color: string;
    image_path?: string;
  };
}

interface Order {
  id: number;
  user_id: number | null;
  guest_name: string | null;
  guest_phone: string | null;
  delivery_location: string;
  delivery_method: 'ena_coach' | 'wells_fargo';
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  mpesa_transaction_id: string | null;
  items: OrderItem[];
}

interface SiteSettings {
  mpesa_till_number: string;
  mpesa_paybill_number: string;
  mpesa_paybill_account: string;
  disbursement_mode: 'till' | 'paybill' | 'bank_account';
}

export default function OrderCheckout() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Payment methods visibility state
  const [paymentMethodsState, setPaymentMethodsState] = useState<Record<string, boolean>>({
    cod: true,
    mpesa_till: true,
    stk_push: true
  });
  const [selectedMethod, setSelectedMethod] = useState<'stk_push' | 'mpesa_till' | 'cod'>('stk_push');

  // M-Pesa Express states
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [paymentInitiated, setPaymentInitiated] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'waiting' | 'success' | 'failed' | 'timeout'>('idle');

  // M-Pesa Till Manual states
  const [manualTxId, setManualTxId] = useState<string>('');
  const [manualLoading, setManualLoading] = useState<boolean>(false);

  // COD states
  const [codLoading, setCodLoading] = useState<boolean>(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string>('');
  const [couponSuccess, setCouponSuccess] = useState<boolean>(false);

  // Polling ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef<number>(0);

  const fetchOrderDetails = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await apiFetch<Order>(`/orders/${orderId}/status`);
      setOrder(data);
      if (data.guest_phone && !phoneNumber) {
        setPhoneNumber(data.guest_phone);
      }
      
      // If the order has already been paid, redirect to confirmation page
      if (data.status === 'paid' || data.status === 'processing' || data.status === 'shipped' || data.status === 'delivered') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setErrorMsg('Failed to load order information.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    fetchOrderDetails(true);

    // Fetch site settings for M-Pesa till number and payment methods toggles
    apiFetch<any>('/settings')
      .then((data) => {
        setSettings(data);
        if (data.payment_methods) {
          try {
            const parsed = JSON.parse(data.payment_methods);
            if (parsed && typeof parsed === 'object') {
              setPaymentMethodsState(parsed);
              
              // Set default selected method to the first enabled one
              if (parsed.stk_push) setSelectedMethod('stk_push');
              else if (parsed.mpesa_till) setSelectedMethod('mpesa_till');
              else if (parsed.cod) setSelectedMethod('cod');
            }
          } catch (e) {}
        }
      })
      .catch((err) => console.error('Error fetching settings for till:', err));

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId]);

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess(false);

    try {
      const response = await apiFetch<{ success: boolean; order: Order; message: string }>(
        `/orders/${orderId}/apply-coupon`,
        {
          method: 'POST',
          body: JSON.stringify({ code: couponCode }),
        }
      );

      if (response.success) {
        setOrder(response.order);
        setCouponSuccess(true);
        setCouponCode('');
      } else {
        setCouponError(response.message || 'Failed to apply coupon.');
      }
    } catch (err: any) {
      console.error('Coupon apply error:', err);
      setCouponError(err.message || 'Coupon validation failed.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Start polling backend order status
  const startPaymentPolling = () => {
    setPollingStatus('waiting');
    pollCountRef.current = 0;

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      try {
        const orderData = await apiFetch<Order>(`/orders/${orderId}/status`);
        
        if (orderData.status === 'paid' || orderData.status === 'processing') {
          // Success! Clear polling and redirect
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPollingStatus('success');
          setTimeout(() => {
            router.push(`/order-confirmation/${orderId}`);
          }, 1500);
        } else if (orderData.status === 'cancelled') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPollingStatus('failed');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      // Check timeout (2 minutes = 24 intervals of 5 seconds)
      if (pollCountRef.current >= 24) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setPollingStatus('timeout');
      }
    }, 5000);
  };

  const handleMpesaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setPaymentLoading(true);
    setErrorMsg('');

    try {
      const response = await apiFetch<{ success: boolean; message: string }>(
        '/payments/mpesa/initiate',
        {
          method: 'POST',
          body: JSON.stringify({
            order_id: orderId,
            phone_number: phoneNumber,
          }),
        }
      );

      if (response.success) {
        setPaymentInitiated(true);
        startPaymentPolling();
      } else {
        setErrorMsg(response.message || 'Failed to initiate M-Pesa prompt.');
      }
    } catch (err: any) {
      console.error('Mpesa initiate error:', err);
      setErrorMsg(err.message || 'M-Pesa payment initiation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRetryPayment = () => {
    setPaymentInitiated(false);
    setPollingStatus('idle');
  };

  const handleCodComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodLoading(true);
    setErrorMsg('');
    try {
      const response = await apiFetch<{ success: boolean; message: string }>(
        '/payments/cod/complete',
        {
          method: 'POST',
          body: JSON.stringify({ order_id: orderId }),
        }
      );
      if (response.success) {
        router.push(`/order-confirmation/${orderId}`);
      } else {
        setErrorMsg(response.message || 'Failed to complete COD order.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete COD order.');
    } finally {
      setCodLoading(false);
    }
  };

  const handleManualComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTxId.trim()) return;
    setManualLoading(true);
    setErrorMsg('');
    try {
      const response = await apiFetch<{ success: boolean; message: string }>(
        '/payments/manual/complete',
        {
          method: 'POST',
          body: JSON.stringify({
            order_id: orderId,
            transaction_id: manualTxId,
          }),
        }
      );
      if (response.success) {
        router.push(`/order-confirmation/${orderId}`);
      } else {
        setErrorMsg(response.message || 'Manual payment verification failed.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Manual payment verification failed.');
    } finally {
      setManualLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-pink border-t-brand-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h2 className="font-sora text-2xl font-bold">Order Not Found</h2>
          <p className="font-dmsans text-brand-grayMed text-sm">{errorMsg || 'This order does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="font-dmsans text-xs tracking-widest uppercase bg-brand-black text-white px-6 py-3"
          >
            Back to Shop
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-black flex flex-col font-dmsans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 font-dmsans text-[10px] tracking-wider uppercase text-brand-grayMed mb-10">
          <span>Checkout</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-black font-semibold">Payment</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* LEFT COLUMN: ORDER SUMMARY (5 cols) */}
          <div className="lg:col-span-5 space-y-6 bg-brand-grayLight bg-opacity-30 p-6 border border-brand-grayLight rounded-lg h-fit">
            <h2 className="font-sora text-sm font-semibold uppercase tracking-wider text-brand-black border-b border-brand-grayLight pb-4">
              Your Order #{order.id}
            </h2>

            {/* Line Items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-12 h-14 bg-brand-grayLight overflow-hidden flex-shrink-0 relative">
                    {/* Eager image loader or fallback mock */}
                    <img
                      src={
                        item.variant.image_path
                          ? `http://localhost:8000${item.variant.image_path}`
                          : 'https://placehold.co/100x120?text=Fit'
                      }
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x120?text=Plottwear';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-sora font-semibold text-xs text-brand-black truncate">
                      {item.product.name}
                    </h4>
                    <p className="font-dmsans text-[10px] text-brand-grayMed mt-0.5">
                      Qty: {item.quantity} · Size: {item.variant.size} · Color: {item.variant.color}
                    </p>
                  </div>
                  <span className="font-dmsans text-xs font-semibold text-brand-black">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-brand-grayLight" />

            {/* Price Calculations */}
            <div className="space-y-3 font-dmsans text-xs text-brand-grayMed">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-black">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({order.delivery_method === 'ena_coach' ? 'ENA Coach' : 'Wells Fargo'})</span>
                <span className="font-semibold text-brand-black">{formatPrice(order.delivery_fee)}</span>
              </div>

              {/* Animating Discount Line if applied */}
              <AnimatePresence>
                {order.discount_amount > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex justify-between text-green-600 font-semibold"
                  >
                    <span>Discount Coupon ({order.coupon_code})</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <hr className="border-brand-grayLight my-2" />

              <div className="flex justify-between text-sm font-sora font-bold text-brand-black">
                <span>Total Amount</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Inline Coupon Field */}
            {order.status === 'pending' && (
              <form onSubmit={handleApplyCoupon} className="pt-4 border-t border-brand-grayLight space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-transparent border border-brand-grayMed border-opacity-35 pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand-black uppercase rounded"
                    />
                    <Ticket className="w-3.5 h-3.5 text-brand-grayMed absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-brand-black text-white text-[10px] tracking-wider font-semibold uppercase px-4 py-2 hover:bg-brand-pinkAccent transition-colors rounded disabled:opacity-45"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                
                {couponError && (
                  <p className="text-red-500 text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-green-600 text-[10px] flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Coupon applied successfully!
                  </p>
                )}
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: PAYMENT PANEL (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* FULL PANEL LOADING STATE IF INITIATED */}
            <AnimatePresence mode="wait">
              {paymentInitiated ? (
                <motion.div
                  key="stk-prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-brand-grayLight bg-opacity-20 border border-brand-grayLight p-8 rounded-lg text-center space-y-6 flex flex-col items-center py-16"
                >
                  {/* M-Pesa Spinner */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 border-b-red-500 rounded-full animate-spin"></div>
                    <Smartphone className="w-6 h-6 text-brand-black absolute" />
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h3 className="font-sora font-bold text-lg text-brand-black">
                      Confirming M-Pesa Payment
                    </h3>
                    <p className="font-dmsans text-xs text-brand-grayMed leading-relaxed">
                      A Lipa Na M-Pesa STK push prompt has been sent to your phone <strong className="text-brand-black">+{phoneNumber}</strong>.
                      Please unlock your phone and enter your <strong className="text-brand-black">M-Pesa PIN</strong> to complete payment.
                    </p>
                  </div>

                  {pollingStatus === 'waiting' && (
                    <div className="flex items-center gap-1.5 text-xs text-brand-grayMed animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                      Waiting for payment response...
                    </div>
                  )}

                  {pollingStatus === 'timeout' && (
                    <div className="space-y-4 max-w-sm">
                      <p className="text-xs text-red-600 flex items-center justify-center gap-1 font-medium">
                        <AlertCircle className="w-4 h-4" /> Didn&apos;t receive the prompt or it expired?
                      </p>
                      <button
                        onClick={handleRetryPayment}
                        className="font-dmsans text-[10px] tracking-wider uppercase font-semibold text-brand-black bg-brand-pink px-5 py-3 hover:bg-brand-black hover:text-white transition-colors duration-300 flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Request New Push Prompt
                      </button>
                    </div>
                  )}

                  {pollingStatus === 'failed' && (
                    <div className="space-y-4 max-w-sm">
                      <p className="text-xs text-red-600 font-semibold">
                        Payment was cancelled or failed. Please try again.
                      </p>
                      <button
                        onClick={handleRetryPayment}
                        className="font-dmsans text-[10px] tracking-wider uppercase font-semibold text-white bg-brand-black px-5 py-3 hover:bg-brand-pinkAccent transition-colors duration-300"
                      >
                        Retry Payment
                      </button>
                    </div>
                  )}

                  {pollingStatus === 'success' && (
                    <p className="text-green-600 text-xs font-bold flex items-center gap-1 animate-bounce">
                      <CheckCircle2 className="w-4 h-4" /> Payment Confirmed! Routing to success page...
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="payment-details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="font-sora text-2xl font-bold tracking-tight text-brand-black">
                      Select Payment Method
                    </h2>
                    <p className="font-dmsans text-xs text-brand-grayMed">
                      Choose your preferred payment method to complete checkout.
                    </p>
                  </div>

                  {/* Payment method selector tabs */}
                  <div className="grid grid-cols-3 gap-2 border-b border-brand-grayLight pb-4">
                    {paymentMethodsState.stk_push && (
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('stk_push')}
                        className={`py-3 px-1 text-center font-sora text-[10px] font-bold uppercase tracking-wider border rounded transition-all ${
                          selectedMethod === 'stk_push'
                            ? 'border-brand-black bg-brand-grayLight bg-opacity-35 text-brand-black'
                            : 'border-transparent text-brand-grayMed hover:text-brand-black'
                        }`}
                      >
                        M-Pesa STK Push
                      </button>
                    )}
                    {paymentMethodsState.mpesa_till && (
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('mpesa_till')}
                        className={`py-3 px-1 text-center font-sora text-[10px] font-bold uppercase tracking-wider border rounded transition-all ${
                          selectedMethod === 'mpesa_till'
                            ? 'border-brand-black bg-brand-grayLight bg-opacity-35 text-brand-black'
                            : 'border-transparent text-brand-grayMed hover:text-brand-black'
                        }`}
                      >
                        M-Pesa Manual Till
                      </button>
                    )}
                    {paymentMethodsState.cod && (
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('cod')}
                        className={`py-3 px-1 text-center font-sora text-[10px] font-bold uppercase tracking-wider border rounded transition-all ${
                          selectedMethod === 'cod'
                            ? 'border-brand-black bg-brand-grayLight bg-opacity-35 text-brand-black'
                            : 'border-transparent text-brand-grayMed hover:text-brand-black'
                        }`}
                      >
                        Cash On Delivery
                      </button>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-dmsans rounded">
                      {errorMsg}
                    </div>
                  )}

                  {/* CONDITIONAL SUB-FORMS */}
                  
                  {/* Option A: STK Push Express prompt */}
                  {selectedMethod === 'stk_push' && paymentMethodsState.stk_push && (
                    <form onSubmit={handleMpesaPay} className="space-y-6">
                      {/* Disbursement destination card */}
                      {(() => {
                        const mode = settings?.disbursement_mode || 'till';
                        return (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                            <p className="font-sora font-extrabold text-[10px] text-green-800 uppercase tracking-wider">
                              Funds Disbursement — {mode === 'till' ? 'M-Pesa Till' : mode === 'paybill' ? 'Paybill' : 'Bank Account'}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {mode === 'till' ? (
                                <>
                                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                                    <span className="font-dmsans text-[9px] text-green-700 uppercase tracking-wider font-semibold block">Paying To</span>
                                    <span className="font-sora text-xs font-black text-brand-black block mt-0.5">Plottwear Express</span>
                                  </div>
                                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                                    <span className="font-dmsans text-[9px] text-green-700 uppercase tracking-wider font-semibold block">Till Number</span>
                                    <span className="font-sora text-sm font-black text-brand-black block mt-0.5">{settings?.mpesa_till_number || '174379'}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                                    <span className="font-dmsans text-[9px] text-green-700 uppercase tracking-wider font-semibold block">
                                      {mode === 'bank_account' ? 'Bank Paybill No.' : 'Business No.'}
                                    </span>
                                    <span className="font-sora text-sm font-black text-brand-black block mt-0.5">{settings?.mpesa_paybill_number}</span>
                                  </div>
                                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                                    <span className="font-dmsans text-[9px] text-green-700 uppercase tracking-wider font-semibold block">
                                      {mode === 'bank_account' ? 'Account No.' : 'Account Ref.'}
                                    </span>
                                    <span className="font-sora text-sm font-black text-brand-black block mt-0.5">{settings?.mpesa_paybill_account}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="space-y-2">
                        <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 254712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3.5 text-sm focus:outline-none focus:border-brand-black rounded"
                        />
                      </div>

                      <div className="text-center bg-brand-grayLight bg-opacity-30 border border-brand-grayLight p-6 py-8 rounded space-y-1">
                        <span className="font-dmsans text-[10px] text-brand-grayMed uppercase tracking-widest font-semibold">
                          Total Payable
                        </span>
                        <p className="font-sora text-3xl font-extrabold text-brand-black">
                          {formatPrice(order.total)}
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={paymentLoading || !phoneNumber}
                        className={`w-full py-4 tracking-wider uppercase text-xs font-bold flex items-center justify-center gap-2 rounded transition-all duration-300 text-white ${
                          phoneNumber && !paymentLoading
                            ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                            : 'bg-brand-grayLight text-brand-grayMed border border-brand-grayLight cursor-not-allowed'
                        }`}
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" /> Sending STK Push...
                          </>
                        ) : (
                          `Initiate STK Push - ${formatPrice(order.total)}`
                        )}
                      </button>
                    </form>
                  )}

                  {/* Option B: M-Pesa Manual Till */}
                  {selectedMethod === 'mpesa_till' && paymentMethodsState.mpesa_till && (
                    <form onSubmit={handleManualComplete} className="space-y-6">
                      {/* Disbursement info - mode-aware payment instructions */}
                      {(() => {
                        const mode = settings?.disbursement_mode || 'till';
                        const isTill = mode === 'till';
                        return (
                          <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-lg text-xs space-y-3 font-dmsans text-neutral-700">
                            <h4 className="font-sora font-extrabold text-[10px] text-neutral-800 uppercase tracking-wider">Payment Instructions</h4>
                            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                              <li>Go to M-Pesa menu on your phone</li>
                              {isTill ? (
                                <>
                                  <li>Select <strong className="text-brand-black">Lipa Na M-Pesa &gt; Buy Goods and Services</strong></li>
                                  <li>Enter Till Number: <strong className="text-brand-pinkAccent text-sm font-black">{settings?.mpesa_till_number}</strong></li>
                                </>
                              ) : (
                                <>
                                  <li>Select <strong className="text-brand-black">Lipa Na M-Pesa &gt; Pay Bill</strong></li>
                                  <li>
                                    {mode === 'bank_account' ? 'Bank Paybill' : 'Business'} No.:{' '}
                                    <strong className="text-brand-pinkAccent text-sm font-black">{settings?.mpesa_paybill_number}</strong>
                                  </li>
                                  <li>
                                    {mode === 'bank_account' ? 'Account' : 'Ref.'} No.:{' '}
                                    <strong className="text-brand-pinkAccent text-sm font-black">{settings?.mpesa_paybill_account}</strong>
                                  </li>
                                </>
                              )}
                              <li>Enter Amount: <strong className="text-brand-black">{formatPrice(order.total)}</strong></li>
                              <li>Enter your M-Pesa PIN and complete payment</li>
                            </ol>
                            <p className="text-[10px] text-brand-grayMed pt-1">Once you receive the confirmation SMS from Safaricom, enter the transaction code below.</p>
                          </div>
                        );
                      })()}

                      <div className="space-y-2">
                        <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                          M-Pesa Transaction Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. RG84JK27LM"
                          value={manualTxId}
                          onChange={(e) => setManualTxId(e.target.value.toUpperCase())}
                          className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3.5 text-sm focus:outline-none focus:border-brand-black rounded uppercase"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={manualLoading || !manualTxId.trim()}
                        className={`w-full py-4 tracking-wider uppercase text-xs font-bold flex items-center justify-center gap-2 rounded transition-all duration-300 text-white ${
                          manualTxId.trim() && !manualLoading
                            ? 'bg-neutral-900 hover:bg-[#D63F6F] hover:shadow-lg'
                            : 'bg-brand-grayLight text-brand-grayMed border border-brand-grayLight cursor-not-allowed'
                        }`}
                      >
                        {manualLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" /> Verifying Code...
                          </>
                        ) : (
                          'Submit Transaction Code'
                        )}
                      </button>
                    </form>
                  )}

                  {/* Option C: Cash on Delivery */}
                  {selectedMethod === 'cod' && paymentMethodsState.cod && (
                    <form onSubmit={handleCodComplete} className="space-y-6">
                      <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-lg text-xs space-y-3 font-dmsans text-neutral-700">
                        <h4 className="font-sora font-extrabold text-[10px] text-neutral-800 uppercase tracking-wider">Pay on Delivery Terms</h4>
                        <p className="leading-relaxed">
                          You will pay the full amount of <strong className="text-brand-black">{formatPrice(order.total)}</strong> (including delivery fee) in Cash or M-Pesa directly to our delivery courier when receiving your package.
                        </p>
                        <p className="text-[10px] text-brand-grayMed">Please ensure you are reachable on your contact number to coordinate delivery dispatch.</p>
                      </div>

                      <button
                        type="submit"
                        disabled={codLoading}
                        className={`w-full py-4 tracking-wider uppercase text-xs font-bold flex items-center justify-center gap-2 rounded transition-all duration-300 text-white ${
                          !codLoading
                            ? 'bg-neutral-900 hover:bg-[#D63F6F] hover:shadow-lg'
                            : 'bg-brand-grayLight text-brand-grayMed border border-brand-grayLight cursor-not-allowed'
                        }`}
                      >
                        {codLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" /> Confirming Order...
                          </>
                        ) : (
                          'Confirm Order & Pay on Delivery'
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
