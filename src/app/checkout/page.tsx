'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { MapPin, Truck, ChevronLeft, ShoppingBag, Loader2 } from 'lucide-react';

export default function CheckoutLanding() {
  const router = useRouter();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  // Delivery details form states
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [agreeTc, setAgreeTc] = useState<boolean>(false);
  
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [ratesList, setRatesList] = useState<any[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch<any>('/settings');
        if (res.delivery_rates) {
          const parsed = JSON.parse(res.delivery_rates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRatesList(parsed);
            setSelectedRateId(parsed[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load delivery rates:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  // Redirect to homepage if cart is empty and page is loaded
  useEffect(() => {
    if (cart.length === 0 && !submittingOrder) {
      // Allow a small delay for local storage loading
      const timer = setTimeout(() => {
        if (cart.length === 0) {
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cart, router, submittingOrder]);

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const selectedRate = ratesList.find((r) => r.id === selectedRateId);
  const deliveryFee = selectedRate ? selectedRate.fee * 100 : 35000; // in cents
  const totalAmount = subtotal + deliveryFee;

  const isFormValid = () => {
    return (
      fullName.trim().length > 0 &&
      phone.trim().length > 0 &&
      deliveryLocation.trim().length > 0 &&
      selectedRateId !== null &&
      agreeTc &&
      cart.length > 0
    );
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmittingOrder(true);
    setErrorMsg('');

    try {
      const itemsPayload = cart.map((c) => ({
        variant_id: c.variant_id,
        quantity: c.quantity,
      }));

      const fullLocationAddress = `${selectedRate?.location || 'Standard Delivery'}: ${deliveryLocation}`;

      const payload = {
        items: itemsPayload,
        delivery_method: 'ena_coach', // fallback DB schema compatibility
        delivery_location: fullLocationAddress,
        guest_name: fullName,
        guest_phone: phone,
      };

      const response = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response && response.success) {
        // Clear the cart on successful order placement
        clearCart();
        // Redirect to payment screen
        router.push(`/checkout/${response.order.id}`);
      } else {
        setErrorMsg(response.message || 'Order creation failed.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'An error occurred during order submission.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-pink border-t-brand-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-black flex flex-col font-dmsans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        {/* Header link back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 font-dmsans text-[10px] tracking-wider uppercase text-brand-grayMed mb-10 hover:text-brand-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Store
        </button>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Side: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6 bg-brand-grayLight bg-opacity-30 p-6 border border-brand-grayLight rounded-lg h-fit">
            <div className="flex items-center gap-2 border-b border-brand-grayLight pb-4">
              <ShoppingBag className="w-5 h-5 text-brand-black" />
              <h2 className="font-sora text-sm font-semibold uppercase tracking-wider text-brand-black">
                Order Summary
              </h2>
            </div>

            {/* Item List */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.variant_id} className="flex gap-4 items-center">
                  <div className="w-12 h-14 bg-brand-grayLight overflow-hidden flex-shrink-0 relative">
                    <img
                      src={`http://localhost:8000${item.image_url}`}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x120';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-sora font-semibold text-xs text-brand-black truncate">
                      {item.product_name}
                    </h4>
                    <p className="font-dmsans text-[10px] text-brand-grayMed mt-0.5">
                      Qty: {item.quantity} · Size: {item.size} · Color: {item.color}
                    </p>
                  </div>
                  <span className="font-dmsans text-xs font-semibold text-brand-black">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-brand-grayLight" />

            {/* Calculations */}
            <div className="space-y-3 font-dmsans text-xs text-brand-grayMed">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee ({selectedRate?.location || 'Region Shipping'})</span>
                <span className="font-semibold text-brand-black">{formatPrice(deliveryFee)}</span>
              </div>
              
              <hr className="border-brand-grayLight my-2" />
              
              <div className="flex justify-between text-sm font-sora font-bold text-brand-black">
                <span>Total Due</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Delivery Details Form (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="font-sora text-2xl font-bold tracking-tight text-brand-black">
                Shipping Information
              </h2>
              <p className="font-dmsans text-xs text-brand-grayMed mt-1">
                Fill in your details below to place your order and proceed to M-Pesa payment validation.
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-dmsans rounded">
                  {errorMsg}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3 text-sm focus:outline-none focus:border-brand-black rounded"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                  Phone Number (M-Pesa STK push prompt will be sent here)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3 text-sm focus:outline-none focus:border-brand-black rounded"
                />
              </div>

              {/* Delivery Destination Region Select */}
              <div className="space-y-2">
                <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                  Select Delivery Destination / Region
                </label>
                <select
                  value={selectedRateId || ''}
                  onChange={(e) => setSelectedRateId(Number(e.target.value))}
                  className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3 text-sm focus:outline-none focus:border-brand-black rounded cursor-pointer"
                >
                  {ratesList.map((rate) => (
                    <option key={rate.id} value={rate.id} className="text-brand-black">
                      {rate.location} — KES {rate.fee}
                    </option>
                  ))}
                  {ratesList.length === 0 && (
                    <option value="" className="text-brand-black">Loading delivery destinations...</option>
                  )}
                </select>
              </div>

              {/* Delivery Location */}
              <div className="space-y-2">
                <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                  Specific Delivery Location / Apartment Address
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Apartment A12, Kilimani Road, Nairobi or ENA Coach Office River Road"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3 text-sm focus:outline-none focus:border-brand-black rounded resize-none"
                />
              </div>

              {/* T&C Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group mt-4">
                <input
                  type="checkbox"
                  required
                  checked={agreeTc}
                  onChange={(e) => setAgreeTc(e.target.checked)}
                  className="mt-1 rounded text-brand-pinkAccent focus:ring-brand-pinkAccent"
                />
                <span className="font-dmsans text-xs text-brand-grayMed group-hover:text-brand-black transition-colors">
                  I agree to the Plottwear Terms & Conditions and shipping guidelines.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid() || submittingOrder}
                className={`w-full py-4 tracking-wider uppercase text-xs font-bold flex items-center justify-center gap-2 rounded transition-all duration-300 ${
                  isFormValid() && !submittingOrder
                    ? 'bg-brand-black text-white hover:bg-brand-pinkAccent hover:shadow-lg'
                    : 'bg-brand-grayLight text-brand-grayMed border border-brand-grayLight cursor-not-allowed'
                }`}
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                  </>
                ) : (
                  'Place Order & Pay'
                )}
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
