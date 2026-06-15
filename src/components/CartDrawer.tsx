'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQty,
    removeFromCart,
    subtotal,
    totalItems,
  } = useCart();

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Cart Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-brand-grayLight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-black" />
                <h2 className="font-sora font-semibold text-lg text-brand-black">
                  Your Cart ({totalItems})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-brand-grayLight rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-brand-black" />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 text-brand-grayMed opacity-45" />
                  <p className="font-sora text-brand-grayMed font-medium">
                    Your cart is empty
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="font-dmsans text-xs tracking-wider uppercase bg-brand-black text-white px-5 py-3 hover:bg-brand-pinkAccent transition-colors duration-300"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex gap-4 items-start border-b border-brand-grayLight pb-6 last:border-0 last:pb-0"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-24 bg-brand-grayLight relative overflow-hidden flex-shrink-0">
                      <img
                        src={`http://localhost:8000${item.image_url}`}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x120?text=Plottwear';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sora font-semibold text-sm text-brand-black truncate">
                        {item.product_name}
                      </h4>
                      <p className="font-dmsans text-xs text-brand-grayMed mt-1">
                        Size: {item.size} / Color: {item.color}
                      </p>
                      
                      {/* Price */}
                      <p className="font-dmsans font-semibold text-sm text-brand-black mt-2">
                        {formatPrice(item.unit_price)}
                      </p>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-brand-grayMed border-opacity-30">
                          <button
                            onClick={() => updateCartQty(item.variant_id, item.quantity - 1)}
                            className="p-1.5 hover:bg-brand-grayLight transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.variant_id, item.quantity + 1)}
                            className="p-1.5 hover:bg-brand-grayLight transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.variant_id)}
                          className="text-brand-grayMed hover:text-brand-pinkAccent p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Footer Section */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-brand-grayLight bg-brand-grayLight bg-opacity-30">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-sora text-sm text-brand-grayMed">Subtotal</span>
                  <span className="font-sora font-bold text-lg text-brand-black">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full text-center bg-brand-black text-white font-dmsans py-4 tracking-wider uppercase text-xs font-semibold hover:bg-brand-pinkAccent transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
                >
                  Proceed to Checkout
                </Link>
                
                <p className="text-center font-dmsans text-[11px] text-brand-grayMed mt-3">
                  Delivery and discount coupons applied at checkout.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
