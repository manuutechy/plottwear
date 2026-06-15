'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  product_id: number;
  variant_id: number;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number; // in KES cents
  image_url: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty: number) => void;
  removeFromCart: (variantId: number) => void;
  updateCartQty: (variantId: number, qty: number) => void;
  clearCart: () => void;
  subtotal: number; // in KES cents
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Load cart from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    const savedCart = localStorage.getItem('plottwear_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart data:', e);
      }
    }
    setMounted(true);
  }, []);

  // Sync cart to localStorage on state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('plottwear_cart', JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty: number) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (i) => i.variant_id === item.variant_id
      );

      let newCart = [...prevCart];
      if (existingItemIndex > -1) {
        newCart[existingItemIndex].quantity += qty;
      } else {
        newCart.push({ ...item, quantity: qty });
      }
      return newCart;
    });

    // Auto open cart drawer when item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (variantId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.variant_id !== variantId));
  };

  const updateCartQty = (variantId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variant_id === variantId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        subtotal,
        totalItems,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
