'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Core Interfaces
export interface RevenueChartItem {
  date: string;
  label: string;
  revenue_kes: number;
}

export interface OrderItem {
  id: number;
  product: { name: string };
  variant: { size: string; color: string };
  qty: number;
  price: number;
}

export interface Order {
  id: number;
  created_at: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  user_id?: number;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  };
  items?: OrderItem[];
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  orders_count: number;
  is_active: boolean;
  role: 'admin' | 'customer';
}

export interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock_qty: number;
  price_override: number | null;
}

export interface Product {
  id: number;
  collection_id: number;
  name: string;
  description: string;
  base_price: number;
  is_active: boolean;
  sort_color: 'black' | 'white' | 'pink';
  images: ProductImage[];
  variants: ProductVariant[];
  collectionName?: string;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  accent_color: string;
  hero_image_path: string;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_link: string;
  image_path: string;
  sort_order: number;
  is_active: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface DashboardStats {
  orders_today: number;
  total_revenue_kes: number;
  pending_orders: number;
  shipped_orders: number;
  recent_orders: Order[];
  revenue_chart: RevenueChartItem[];
}

interface AdminContextType {
  stats: DashboardStats | null;
  orders: Order[];
  products: Product[];
  collections: Collection[];
  slides: HeroSlide[];
  coupons: Coupon[];
  customers: Customer[];
  settings: Record<string, string>;
  loading: boolean;
  submitLoading: boolean;
  setSubmitLoading: (val: boolean) => void;
  refreshData: () => Promise<void>;
  lastSynced: Date;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Panel State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const refreshData = async () => {
    try {
      setLoading(true);
      const [
        statsData, ordersData, productsData, 
        collectionsData, slidesData, couponsData, 
        customersData, settingsData
      ] = await Promise.all([
        apiFetch<DashboardStats>('/admin/stats'),
        apiFetch<Order[]>('/admin/orders'),
        apiFetch<Product[]>('/admin/products'),
        apiFetch<Collection[]>('/admin/collections'),
        apiFetch<HeroSlide[]>('/admin/hero-slides'),
        apiFetch<Coupon[]>('/admin/coupons'),
        apiFetch<Customer[]>('/admin/customers'),
        apiFetch<Record<string, string>>('/admin/settings')
      ]);

      // Enrich product with collection names
      const enrichedProducts = productsData.map(prod => ({
        ...prod,
        collectionName: collectionsData.find(c => c.id === prod.collection_id)?.name || 'Unknown Collection'
      }));

      setStats(statsData);
      setOrders(ordersData);
      setProducts(enrichedProducts);
      setCollections(collectionsData);
      setSlides(slidesData);
      setCoupons(couponsData);
      setCustomers(customersData);
      setSettings(settingsData);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push('/account/login');
      } else {
        refreshData();
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  return (
    <AdminContext.Provider
      value={{
        stats, orders, products, collections, slides, coupons, customers, settings,
        loading, submitLoading, setSubmitLoading, refreshData, lastSynced
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
