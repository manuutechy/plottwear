'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';
import { ShoppingBag, User, Menu, X, ShieldAlert, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const Navbar: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    // If we are on home page, smooth scroll
    if (pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    }
  };

  const isHome = pathname === '/';
  const textColor = (!isScrolled && isHome) ? 'text-white' : 'text-brand-black';
  const iconColor = (!isScrolled && isHome) ? 'text-white hover:text-brand-pink' : 'text-brand-black hover:text-brand-pinkAccent';
  const logoLight = (!isScrolled && isHome);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed z-50 transition-all duration-500 ease-in-out ${
          isScrolled
            ? 'top-4 left-0 right-0 mx-auto w-[92%] md:w-[85%] max-w-7xl rounded-full bg-white bg-opacity-75 backdrop-blur-xl border border-white border-opacity-20 shadow-[0_15px_40px_rgba(0,0,0,0.15)] py-2.5 px-8'
            : isHome
              ? 'top-0 left-0 w-full bg-neutral-900 bg-opacity-45 backdrop-blur-md border-b border-white border-opacity-10 py-5 px-6'
              : 'top-0 left-0 w-full bg-white border-b border-neutral-100 py-4 px-6 shadow-sm'
        }`}
      >
        <div className="mx-auto flex items-center justify-between">
          {/* Logo (Left) */}
          <Link href="/" className="flex-shrink-0 transition-transform active:scale-[0.98]">
            <Logo className="h-6 md:h-7" light={logoLight} />
          </Link>

          {/* Links (Center) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/shop"
              className={`font-dmsans text-xs tracking-widest uppercase font-bold ${textColor} hover:text-brand-pink transition-colors duration-300`}
            >
              Shop All
            </Link>
            <Link
              href={isHome ? '#new-wave' : '/#new-wave'}
              onClick={(e) => handleNavClick(e, 'new-wave')}
              className={`font-dmsans text-xs tracking-widest uppercase font-medium ${textColor} hover:text-brand-pink transition-colors duration-300`}
            >
              New Wave
            </Link>
            <Link
              href={isHome ? '#gold-designs' : '/#gold-designs'}
              onClick={(e) => handleNavClick(e, 'gold-designs')}
              className={`font-dmsans text-xs tracking-widest uppercase font-medium ${textColor} hover:text-brand-pink transition-colors duration-300`}
            >
              Gold Designs
            </Link>
            <Link
              href={isHome ? '#diamond-designs' : '/#diamond-designs'}
              onClick={(e) => handleNavClick(e, 'diamond-designs')}
              className={`font-dmsans text-xs tracking-widest uppercase font-medium ${textColor} hover:text-brand-pink transition-colors duration-300`}
            >
              Diamond Designs
            </Link>
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center space-x-5">
            {/* Admin Dashboard shortcut */}
            {isAuthenticated && isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-brand-pinkAccent font-bold bg-brand-pink bg-opacity-20 px-3 py-1.5 rounded-full border border-brand-pink border-opacity-35 hover:bg-brand-pinkAccent hover:text-white transition-all duration-300"
              >
                <ShieldAlert className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Profile / Login */}
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  onClick={() => router.push('/account')}
                  className={`p-1 ${iconColor} transition-colors duration-300`}
                >
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-brand-grayLight shadow-xl py-2 hidden group-hover:block transition-all duration-300 rounded-lg">
                  <div className="px-4 py-2 border-b border-brand-grayLight font-sora text-[10px] uppercase tracking-wider font-semibold text-brand-black truncate">
                    Hi, {user?.name.split(' ')[0]}
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-2 font-dmsans text-xs text-brand-black hover:bg-brand-grayLight transition-colors"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 font-dmsans text-xs text-red-600 hover:bg-brand-grayLight flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/account/login"
                className={`p-1 ${iconColor} transition-colors duration-300`}
                title="Account Login"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`p-1 ${iconColor} transition-colors duration-300 relative`}
            >
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -top-1.5 -right-1.5 bg-brand-pinkAccent text-white font-sora font-semibold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden p-1 ${iconColor} transition-colors duration-300`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed inset-0 z-50 bg-white flex flex-col p-6"
          >
            <div className="flex items-center justify-between border-b border-brand-grayLight pb-6">
              <Logo className="h-6" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-brand-grayLight rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-brand-black" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-8 pl-4">
              <Link
                href={isHome ? '#new-wave' : '/#new-wave'}
                onClick={(e) => handleNavClick(e, 'new-wave')}
                className="font-sora text-3xl font-bold text-brand-black hover:text-brand-pinkAccent transition-colors"
              >
                New Wave
              </Link>
              <Link
                href={isHome ? '#gold-designs' : '/#gold-designs'}
                onClick={(e) => handleNavClick(e, 'gold-designs')}
                className="font-sora text-3xl font-bold text-brand-black hover:text-brand-pinkAccent transition-colors"
              >
                Gold Designs
              </Link>
              <Link
                href={isHome ? '#diamond-designs' : '/#diamond-designs'}
                onClick={(e) => handleNavClick(e, 'diamond-designs')}
                className="font-sora text-3xl font-bold text-brand-black hover:text-brand-pinkAccent transition-colors"
              >
                Diamond Designs
              </Link>
              <hr className="border-brand-grayLight" />
              {isAuthenticated ? (
                <div className="space-y-4">
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-dmsans text-lg font-medium text-brand-black"
                  >
                    My Account Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block font-dmsans text-lg font-medium text-brand-pinkAccent"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="font-dmsans text-lg font-medium text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/account/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-sora text-xl font-semibold text-brand-black hover:text-brand-pinkAccent transition-colors"
                >
                  Log In / Create Account
                </Link>
              )}
            </div>

            <div className="border-t border-brand-grayLight pt-6 text-center">
              <p className="font-dmsans text-xs text-brand-grayMed">
                Plottwear Streetwear · Nairobi
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
