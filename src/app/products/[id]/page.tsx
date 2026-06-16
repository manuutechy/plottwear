'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Check, ChevronRight, HelpCircle, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

const getColorBadge = (color: string) => {
  const col = color.toLowerCase();
  if (col.includes('black') || col.includes('onyx') || col.includes('charcoal')) return 'bg-neutral-900 border border-neutral-700';
  if (col.includes('white') || col.includes('cream') || col.includes('parchment')) return 'bg-neutral-50 border border-neutral-300';
  if (col.includes('pink')) return 'bg-pink-400 border border-pink-300';
  if (col.includes('gold') || col.includes('amber') || col.includes('tan')) return 'bg-amber-500 border border-amber-400';
  if (col.includes('silver') || col.includes('chrome') || col.includes('ash') || col.includes('gray') || col.includes('grey')) return 'bg-gray-400 border border-gray-300';
  if (col.includes('blue') || col.includes('indigo')) return 'bg-blue-600 border border-blue-500';
  if (col.includes('olive') || col.includes('green')) return 'bg-emerald-700 border border-emerald-600';
  return 'bg-brand-pink border border-white';
};

interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

interface ProductVariant {
  id: number;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: string;
  stock_qty: number;
  price_override: number | null;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  collection_id: number;
  name: string;
  description: string;
  base_price: number; // in cents
  is_active: boolean;
  sort_color: string;
  images: ProductImage[];
  variants: ProductVariant[];
  collection: Collection;
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { cart, addToCart, subtotal } = useCart();
  const { user } = useAuth();
  
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Selection states
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);

  // Delivery details form states
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'ena_coach' | 'wells_fargo'>('ena_coach');
  const [agreeTc, setAgreeTc] = useState<boolean>(false);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!productId) return;
    
    apiFetch<Product>(`/products/${productId}`)
      .then((data) => {
        setProduct(data);
        const primary = data.images.find((i) => i.is_primary) || data.images[0];
        if (primary) {
          setActiveImage(primary.image_path);
        }
        
        // Pre-fill user details if logged in
        if (user) {
          setFullName(user.name);
          setPhone(user.phone || '');
        }
      })
      .catch((err) => {
        console.error('Error fetching product details:', err);
        setErrorMsg('Failed to load product. It might not exist.');
      })
      .finally(() => setLoading(false));
  }, [productId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-pink border-t-brand-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <h2 className="font-sora text-2xl font-bold">Product Not Found</h2>
          <p className="font-dmsans text-brand-grayMed text-sm">{errorMsg}</p>
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

  // Extract unique colors and sizes from variants
  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
  
  // Filter sizes based on selected color (if any), to show what size is in stock
  const availableSizesForColor = product.variants
    .filter((v) => !selectedColor || v.color === selectedColor)
    .map((v) => ({ size: v.size, stock: v.stock_qty }));

  // Find active variant matching selected color & size
  const activeVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  // Determine active price (base_price or variant override)
  const activePriceCents = activeVariant?.price_override ?? product.base_price;
  const formattedPrice = `KES ${(activePriceCents / 100).toLocaleString()}`;

  // Check stock status of active selection
  const isOutOfStock = activeVariant ? activeVariant.stock_qty <= 0 : false;

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize || !activeVariant) return;

    setIsAdding(true);
    
    // Perform cart addition
    addToCart({
      product_id: product.id,
      variant_id: activeVariant.id,
      product_name: product.name,
      color: selectedColor,
      size: selectedSize,
      unit_price: activePriceCents,
      image_url: activeImage,
    }, quantity);

    // Revert add state after 1.5s
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  // Dynamic delivery calculations (OrderService client mirror)
  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Add current item quantity if it's not already in the cart to forecast fee
  const forecastedItemsCount = totalCartItemsCount > 0 ? totalCartItemsCount : quantity;
  
  const getDeliveryFee = (method: 'ena_coach' | 'wells_fargo', itemsQty: number) => {
    if (method === 'ena_coach') {
      return itemsQty < 10 ? 20000 : 50000;
    } else {
      return itemsQty < 10 ? 50000 : 75000;
    }
  };

  const deliveryFeeCents = getDeliveryFee(deliveryMethod, forecastedItemsCount);

  // Form validity check
  const isFormValid = () => {
    const isCartPopulated = cart.length > 0 || (selectedColor && selectedSize && activeVariant && !isOutOfStock);
    return (
      fullName.trim().length > 0 &&
      phone.trim().length > 0 &&
      deliveryLocation.trim().length > 0 &&
      agreeTc &&
      isCartPopulated
    );
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmittingOrder(true);
    setErrorMsg('');

    try {
      // 1. If cart is empty, auto-add selected product first
      let finalCartItems = cart.map((c) => ({
        variant_id: c.variant_id,
        quantity: c.quantity,
      }));

      if (finalCartItems.length === 0 && activeVariant) {
        finalCartItems = [{
          variant_id: activeVariant.id,
          quantity: quantity,
        }];
      }

      // 2. Post order to backend
      const payload: any = {
        items: finalCartItems,
        delivery_method: deliveryMethod,
        delivery_location: deliveryLocation,
        guest_name: fullName,
        guest_phone: phone,
      };

      const response = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response && response.success) {
        // Redirect to checkout payment screen
        router.push(`/checkout/${response.order.id}`);
      } else {
        setErrorMsg(response.message || 'Order creation failed.');
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMsg(err.message || 'An error occurred during order submission.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-black flex flex-col font-dmsans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 font-dmsans text-[10px] tracking-wider uppercase text-brand-grayMed mb-10">
          <span className="cursor-pointer hover:text-brand-black" onClick={() => router.push('/')}>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span className="cursor-pointer hover:text-brand-black" onClick={() => router.push(`/#${product.collection.slug}`)}>{product.collection.name}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-black font-semibold">{product.name}</span>
        </div>

        {/* Two-Column Detail Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-brand-grayLight overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={`http://localhost:8000${activeImage}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </AnimatePresence>
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.image_path)}
                    className={`w-20 h-24 bg-brand-grayLight flex-shrink-0 border-2 transition-all duration-350 ${
                      activeImage === img.image_path ? 'border-brand-pink' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={`http://localhost:8000${img.image_path}`}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x120';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Selectors */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="font-sora text-3xl md:text-4xl font-extrabold tracking-tight">
                {product.name}
              </h1>
              <p className="font-sora text-2xl font-bold text-brand-pinkAccent">
                {formattedPrice}
              </p>
            </div>

            <p className="text-sm font-dmsans text-brand-grayMed leading-relaxed">
              {product.description}
            </p>

            <hr className="border-brand-grayLight" />

            {/* Variant Color Selectors */}
            <div className="space-y-4">
              <span className="font-sora text-xs font-semibold uppercase tracking-widest text-brand-black">
                Select Color: {selectedColor}
              </span>
              <div className="flex gap-3">
                {uniqueColors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        // Reset size when color changes to prevent invalid variant selection
                        setSelectedSize('');
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        isSelected ? 'scale-[1.12]' : 'hover:scale-[1.05]'
                      }`}
                    >
                      {/* Color dot */}
                      <span className={`w-8 h-8 rounded-full ${getColorBadge(color)}`} />
                      
                      {/* Selected pink border ring */}
                      {isSelected && (
                        <span className="absolute inset-0 border border-brand-pink rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variant Size Selectors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sora text-xs font-semibold uppercase tracking-widest text-brand-black">
                  Select Size: {selectedSize}
                </span>
                
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="font-dmsans text-xs text-brand-grayMed hover:text-brand-pinkAccent flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const sizeInfo = availableSizesForColor.find((s) => s.size === size);
                  const isAvailable = sizeInfo ? sizeInfo.stock > 0 : false;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-3 text-xs font-semibold tracking-wider font-dmsans border transition-all duration-300 ${
                        !isAvailable
                          ? 'border-brand-grayLight text-brand-grayMed opacity-40 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-brand-black text-white border-brand-black'
                          : 'border-brand-grayMed border-opacity-30 text-brand-black hover:border-brand-black'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="space-y-4">
              <span className="font-sora text-xs font-semibold uppercase tracking-widest text-brand-black">
                Quantity
              </span>
              <div className="flex gap-4">
                <div className="flex items-center border border-brand-grayMed border-opacity-30">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-3 hover:bg-brand-grayLight transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xs font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-3 hover:bg-brand-grayLight transition-colors"
                  >
                    +
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedColor || !selectedSize || isOutOfStock}
                  onClick={handleAddToCart}
                  className={`flex-1 text-center font-dmsans py-3.5 tracking-wider uppercase text-xs font-semibold transition-all duration-300 relative ${
                    isOutOfStock
                      ? 'bg-brand-grayLight text-brand-grayMed border border-brand-grayLight cursor-not-allowed'
                      : isAdding
                      ? 'bg-green-600 text-white'
                      : 'bg-brand-black text-white hover:bg-brand-pinkAccent'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isOutOfStock ? (
                      'Out of Stock'
                    ) : isAdding ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Cart
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Delivery Info Notice */}
            <div className="p-5 bg-brand-grayLight bg-opacity-30 border border-brand-grayLight rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4.5 h-4.5 text-brand-pinkAccent" />
                <h4 className="font-sora text-xs font-semibold uppercase tracking-widest text-brand-black">
                  Delivery Tiers
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-dmsans">
                <div className="space-y-1">
                  <p className="font-semibold text-brand-black">ENA COACH (EPH)</p>
                  <p className="text-brand-grayMed">Common Office Pickup</p>
                  <p className="text-brand-pinkAccent font-semibold mt-1">
                    &lt;10 items: KES 200 | &ge;10: KES 500
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-brand-black">WELLS FARGO</p>
                  <p className="text-brand-grayMed">Doorstep Delivery</p>
                  <p className="text-brand-pinkAccent font-semibold mt-1">
                    &lt;10 items: KES 500 | &ge;10: KES 750
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DELIVERY DETAILS FORM (Full Width Below) */}
        <section className="mt-24 pt-16 border-t border-brand-grayLight">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h2 className="font-sora text-2xl font-bold tracking-tight text-brand-black">
                Where should we send it?
              </h2>
              <p className="font-dmsans text-xs text-brand-grayMed mt-1">
                Enter your delivery address details below to initiate checkout.
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
                  Phone Number (M-Pesa prompts sent here)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3 text-sm focus:outline-none focus:border-brand-black rounded"
                />
              </div>

              {/* Delivery Location */}
              <div className="space-y-2">
                <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                  Delivery Location (Address description or ENA Coach office location)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. ENA Coach River Road Office, or Apartment B2, Kilimani, Nairobi"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full bg-transparent border border-brand-grayMed border-opacity-35 px-4 py-3 text-sm focus:outline-none focus:border-brand-black rounded resize-none"
                />
              </div>

              {/* Delivery Method Selector (Radio Cards) */}
              <div className="space-y-3">
                <label className="font-sora text-[10px] font-semibold uppercase tracking-wider text-brand-grayMed">
                  Delivery Carrier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ena Coach */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('ena_coach')}
                    className={`p-4 text-left border flex items-center justify-between rounded ${
                      deliveryMethod === 'ena_coach'
                        ? 'border-brand-black bg-brand-grayLight bg-opacity-30'
                        : 'border-brand-grayMed border-opacity-25 hover:border-brand-black'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-pinkAccent" />
                        <span className="font-sora text-xs font-bold uppercase tracking-wider text-brand-black">
                          ENA Coach Office
                        </span>
                      </div>
                      <p className="font-dmsans text-[11px] text-brand-grayMed">
                        Office station collection
                      </p>
                    </div>
                    <span className="font-sora text-xs font-bold text-brand-black">
                      KES {(getDeliveryFee('ena_coach', forecastedItemsCount) / 100).toLocaleString()}
                    </span>
                  </button>

                  {/* Wells Fargo */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('wells_fargo')}
                    className={`p-4 text-left border flex items-center justify-between rounded ${
                      deliveryMethod === 'wells_fargo'
                        ? 'border-brand-black bg-brand-grayLight bg-opacity-30'
                        : 'border-brand-grayMed border-opacity-25 hover:border-brand-black'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                        <span className="font-sora text-xs font-bold uppercase tracking-wider text-brand-black">
                          Wells Fargo Doorstep
                        </span>
                      </div>
                      <p className="font-dmsans text-[11px] text-brand-grayMed">
                        Home or office delivery
                      </p>
                    </div>
                    <span className="font-sora text-xs font-bold text-brand-black">
                      KES {(getDeliveryFee('wells_fargo', forecastedItemsCount) / 100).toLocaleString()}
                    </span>
                  </button>
                </div>
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
                  I agree to the Plottwear{' '}
                  <Link href="/terms" target="_blank" className="underline hover:text-brand-pinkAccent">
                    Terms & Conditions
                  </Link>{' '}
                  and shipping guidelines.
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
                  'Proceed to Payment'
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* SIZE GUIDE MODAL */}
      <AnimatePresence>
        {showSizeGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="fixed inset-0 z-50 bg-black bg-opacity-50"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 bg-white p-6 md:p-8 rounded shadow-2xl border border-brand-grayLight space-y-6"
            >
              <div className="flex items-center justify-between border-b border-brand-grayLight pb-4">
                <h3 className="font-sora font-bold text-lg text-brand-black">Size Guide</h3>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="font-bold text-brand-grayMed hover:text-brand-black"
                >
                  Close
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-dmsans text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-grayLight text-brand-grayMed">
                      <th className="py-2.5 uppercase tracking-wider font-semibold">Size</th>
                      <th className="py-2.5 uppercase tracking-wider font-semibold">Chest (Inches)</th>
                      <th className="py-2.5 uppercase tracking-wider font-semibold">Length (Inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-brand-grayLight text-brand-black">
                      <td className="py-3 font-bold">XS</td>
                      <td className="py-3">36 - 38</td>
                      <td className="py-3">26.5</td>
                    </tr>
                    <tr className="border-b border-brand-grayLight text-brand-black">
                      <td className="py-3 font-bold">S</td>
                      <td className="py-3">38 - 40</td>
                      <td className="py-3">27.5</td>
                    </tr>
                    <tr className="border-b border-brand-grayLight text-brand-black">
                      <td className="py-3 font-bold">M</td>
                      <td className="py-3">40 - 42</td>
                      <td className="py-3">28.5</td>
                    </tr>
                    <tr className="border-b border-brand-grayLight text-brand-black">
                      <td className="py-3 font-bold">L</td>
                      <td className="py-3">42 - 44</td>
                      <td className="py-3">29.5</td>
                    </tr>
                    <tr className="border-b border-brand-grayLight text-brand-black">
                      <td className="py-3 font-bold">XL</td>
                      <td className="py-3">44 - 46</td>
                      <td className="py-3">30.5</td>
                    </tr>
                    <tr className="border-b border-brand-grayLight text-brand-black">
                      <td className="py-3 font-bold">XXL</td>
                      <td className="py-3">46 - 48</td>
                      <td className="py-3">31.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="font-dmsans text-[10px] text-brand-grayMed leading-relaxed">
                * Note: All garments are pre-shrunk. Streetwear fits are intentionally oversized. If you prefer a tighter fit, we recommend ordering one size down.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
      <CartDrawer />
    </div>
  );
}
