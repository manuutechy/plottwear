'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, register, isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('Please fill in all fields.');
          return;
        }
        await login({ email, password });
      } else {
        if (!name || !email || !password || !passwordConfirmation) {
          setError('Please fill in all required fields.');
          return;
        }
        if (password !== passwordConfirmation) {
          setError('Passwords do not match.');
          return;
        }
        await register({
          name,
          email,
          phone: phone || null,
          password,
          password_confirmation: passwordConfirmation,
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col justify-between relative overflow-hidden">
      {/* Background abstract decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-brand-pink opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-brand-pinkAccent opacity-15 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-32 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-pink to-transparent opacity-80" />

          <div className="text-center mb-8">
            <span className="font-sora text-[9px] uppercase tracking-widest text-brand-pink font-bold bg-brand-pink bg-opacity-10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
              {isLogin ? 'Welcome Back' : 'Join the Wave'}
            </span>
            <h1 className="font-sora font-extrabold text-2xl md:text-3xl text-white tracking-tight">
              {isLogin ? 'PLOTTWEAR ACCOUNT' : 'CREATE ACCOUNT'}
            </h1>
            <p className="font-dmsans text-xs text-brand-grayLight opacity-60 mt-2">
              {isLogin
                ? 'Enter your credentials to access your profile & orders.'
                : 'Sign up to shop premium Nairobi streetwear.'}
            </p>
          </div>

          {isLogin && (
            <div className="mb-6 p-4 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10 space-y-3">
              <p className="font-sora text-[9px] uppercase tracking-widest text-brand-pink font-bold text-center">
                ⚡ Developer Profiles (Click to Auto-Fill)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@plottwear.com');
                    setPassword('password');
                  }}
                  className="p-2 rounded-lg bg-brand-pink bg-opacity-10 border border-brand-pink border-opacity-25 hover:bg-brand-pink hover:text-brand-black transition-all text-left group"
                >
                  <p className="font-sora text-[9px] font-bold text-white group-hover:text-brand-black">Admin Access</p>
                  <p className="font-dmsans text-[8px] text-brand-grayLight opacity-65 truncate group-hover:text-brand-black">admin@plottwear.com</p>
                  <p className="font-dmsans text-[8px] text-brand-grayLight opacity-50 group-hover:text-brand-black">PW: password</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@plottwear.com');
                    setPassword('password');
                  }}
                  className="p-2 rounded-lg bg-white bg-opacity-5 border border-white border-opacity-15 hover:bg-white hover:text-brand-black transition-all text-left group"
                >
                  <p className="font-sora text-[9px] font-bold text-white group-hover:text-brand-black">Customer Access</p>
                  <p className="font-dmsans text-[8px] text-brand-grayLight opacity-65 truncate group-hover:text-brand-black">customer@plottwear.com</p>
                  <p className="font-dmsans text-[8px] text-brand-grayLight opacity-50 group-hover:text-brand-black">PW: password</p>
                </button>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500 bg-opacity-15 border border-red-500 border-opacity-30 text-red-300 rounded-lg p-3 text-xs font-dmsans text-center mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grayLight opacity-40" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-3 pl-10 pr-4 text-sm text-white font-dmsans placeholder-brand-grayLight placeholder-opacity-35 focus:outline-none focus:border-brand-pink focus:bg-opacity-10 transition-all"
                      required={!isLogin}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grayLight opacity-40" />
                    <input
                      type="tel"
                      placeholder="e.g. 254700000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-3 pl-10 pr-4 text-sm text-white font-dmsans placeholder-brand-grayLight placeholder-opacity-35 focus:outline-none focus:border-brand-pink focus:bg-opacity-10 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grayLight opacity-40" />
                <input
                  type="email"
                  placeholder="e.g. name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-3 pl-10 pr-4 text-sm text-white font-dmsans placeholder-brand-grayLight placeholder-opacity-35 focus:outline-none focus:border-brand-pink focus:bg-opacity-10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                  Password *
                </label>
                {isLogin && (
                  <a href="#" className="font-dmsans text-[10px] text-brand-pink hover:underline">
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grayLight opacity-40" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-3 pl-10 pr-4 text-sm text-white font-dmsans placeholder-brand-grayLight placeholder-opacity-35 focus:outline-none focus:border-brand-pink focus:bg-opacity-10 transition-all"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              /* Password Confirmation */
              <div className="space-y-1.5">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-80 font-semibold">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grayLight opacity-40" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-3 pl-10 pr-4 text-sm text-white font-dmsans placeholder-brand-grayLight placeholder-opacity-35 focus:outline-none focus:border-brand-pink focus:bg-opacity-10 transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-brand-pink text-brand-black hover:bg-white hover:text-brand-black font-sora font-extrabold text-xs uppercase tracking-widest py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 group"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Log In' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 pt-6 border-t border-white border-opacity-10 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-dmsans text-xs text-white opacity-70 hover:opacity-100 hover:text-brand-pink transition-all"
            >
              {isLogin ? (
                <>
                  Don&apos;t have an account? <span className="font-bold underline">Register here</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-bold underline">Log in here</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
