'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, ShoppingBag, Settings, LogOut } from 'lucide-react';

interface OrderItem {
  id: number;
  product: {
    name: string;
  };
  variant: {
    size: string;
    color: string;
  };
  qty: number;
  price: number;
}

interface Order {
  id: number;
  created_at: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
}

export default function AccountPage() {
  const { user, logout, isAuthenticated, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Profile update form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Orders and view states
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/account/login');
    } else if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      loadUserOrders();
    }
  }, [isAuthenticated, authLoading, user, router]);

  const loadUserOrders = async () => {
    setOrdersLoading(true);
    try {
      const ordersData = await apiFetch<Order[]>('/user/orders');
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== passwordConfirmation) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      await updateProfile({
        name,
        phone: phone || null,
        ...(password ? { password, password_confirmation: passwordConfirmation } : {}),
      });
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    }
  };

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-green-500 bg-opacity-20 text-green-400 border-green-500 border-opacity-30';
      case 'pending':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500 border-opacity-30';
      case 'processing':
      case 'shipped':
        return 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500 border-opacity-30';
      case 'cancelled':
        return 'bg-red-500 bg-opacity-20 text-red-400 border-red-500 border-opacity-30';
      default:
        return 'bg-brand-grayLight bg-opacity-20 text-brand-grayLight border-opacity-30';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-white font-sora font-semibold text-sm">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col justify-between relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-brand-pink opacity-15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[60%] aspect-square rounded-full bg-brand-pinkAccent opacity-10 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-32 z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Customer Details */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-2xl p-6 shadow-2xl h-fit space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-pink bg-opacity-20 border border-brand-pink flex items-center justify-center text-brand-pink text-2xl font-sora font-black">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-sora font-extrabold text-lg text-white leading-tight">{user.name}</h2>
              <span className="font-dmsans text-[10px] tracking-widest uppercase text-brand-pink font-bold mt-1 inline-block">
                {user.role} Member
              </span>
            </div>
          </div>

          <hr className="border-white border-opacity-10" />

          <div className="space-y-4 font-dmsans text-xs text-white text-opacity-80">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-pink" />
              <div>
                <p className="text-[10px] text-brand-grayLight opacity-60">Email Address</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-pink" />
              <div>
                <p className="text-[10px] text-brand-grayLight opacity-60">Phone Number</p>
                <p className="font-semibold">{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-brand-pink" />
              <div>
                <p className="text-[10px] text-brand-grayLight opacity-60">Account Access</p>
                <p className="font-semibold">Active customer</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout().then(() => router.push('/'))}
            className="w-full bg-red-600 bg-opacity-20 border border-red-600 border-opacity-40 text-red-400 hover:bg-red-600 hover:text-white font-sora font-bold text-[10px] uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out Account
          </button>
        </motion.div>

        {/* Right Area: Order History & Profile Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Profile settings */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-white mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-pink" /> Edit Profile Info
            </h3>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs font-dmsans text-center mb-6 border ${
                  message.type === 'success'
                    ? 'bg-green-500 bg-opacity-15 border-green-500 border-opacity-30 text-green-300'
                    : 'bg-red-500 bg-opacity-15 border-red-500 border-opacity-30 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white font-dmsans focus:outline-none focus:border-brand-pink transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white font-dmsans focus:outline-none focus:border-brand-pink transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white font-dmsans focus:outline-none focus:border-brand-pink transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white font-dmsans focus:outline-none focus:border-brand-pink transition-all"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="bg-brand-pink text-brand-black hover:bg-white hover:text-brand-black font-sora font-extrabold text-[10px] uppercase tracking-wider py-3 px-6 rounded-lg transition-all shadow-md ml-auto block"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>

          {/* Section: Order History */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-white mb-6 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-pink" /> Order History
            </h3>

            {ordersLoading ? (
              <p className="text-xs text-brand-grayLight opacity-60 font-dmsans text-center py-6">
                Fetching orders...
              </p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-brand-grayLight opacity-60 font-dmsans text-center py-6">
                You haven&apos;t placed any orders yet.
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-white border-opacity-10 rounded-lg p-4 font-dmsans text-xs text-white space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-brand-pink">Order #{order.id}</span>
                        <span className="text-brand-grayLight opacity-60 ml-2">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <hr className="border-white border-opacity-5" />

                    <div className="space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-brand-grayLight">
                          <span>
                            {item.product?.name} ({item.variant?.color} / {item.variant?.size}){' '}
                            <span className="text-white font-semibold">x{item.qty}</span>
                          </span>
                          <span className="text-white">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between border-t border-white border-opacity-5 pt-3 font-semibold">
                      <span>Total Amount Paid</span>
                      <span className="text-brand-pink">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
