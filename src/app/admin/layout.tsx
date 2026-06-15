'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Shield, RefreshCw, BarChart2, ShoppingBag, Tag, FolderOpen, 
  ImageIcon, Key, Settings, Users, ArrowLeft, LogOut, Search, 
  Bell, ChevronDown, Menu, X, Megaphone, UserSquare2
} from 'lucide-react';
import Link from 'next/link';
import { AdminProvider, useAdmin } from './AdminContext';
import { Toaster, toast } from 'sonner';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { refreshData, loading, orders, products, customers } = useAdmin();

  // Sidebar responsive states
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: any[]; orders: any[]; customers: any[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Notifications state
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sync Bell with new orders
  useEffect(() => {
    if (orders.length > 0) {
      const lastViewedStr = localStorage.getItem('plottwear_admin_last_orders_view');
      const lastViewed = lastViewedStr ? new Date(lastViewedStr).getTime() : 0;
      
      const newOrders = orders.filter(o => new Date(o.created_at).getTime() > lastViewed);
      setUnreadCount(newOrders.length);
    }
  }, [orders]);

  // Handle Search Query
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setSearchLoading(true);
        try {
          const res = await apiFetch(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res);
          setShowSearchDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults(null);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleClearNotifications = () => {
    localStorage.setItem('plottwear_admin_last_orders_view', new Date().toISOString());
    setUnreadCount(0);
    toast.success('Notifications cleared');
  };

  const navSections = [
    {
      label: 'Overview',
      items: [
        { href: '/admin', label: 'Dashboard', icon: BarChart2 }
      ]
    },
    {
      label: 'Catalogue',
      items: [
        { href: '/admin/products', label: 'Products', icon: Tag },
        { href: '/admin/collections', label: 'Collections', icon: FolderOpen },
        { href: '/admin/hero-slides', label: 'Hero Slides', icon: ImageIcon }
      ]
    },
    {
      label: 'Commerce',
      items: [
        { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/admin/coupons', label: 'Coupons', icon: Key }
      ]
    },
    {
      label: 'People',
      items: [
        { href: '/admin/customers', label: 'Customers', icon: Users },
        { href: '/admin/admins', label: 'Admins', icon: UserSquare2 }
      ]
    },
    {
      label: 'Config',
      items: [
        { href: '/admin/settings', label: 'Settings', icon: Settings },
        { href: '/admin/announcements', label: 'Site Content', icon: Megaphone }
      ]
    }
  ];

  // Helper helper to fetch from layout
  const apiFetch = async (endpoint: string) => {
    const token = localStorage.getItem('plottwear_token');
    const res = await fetch(`http://localhost:8000/api/v1/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return res.json();
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-neutral-800 flex relative overflow-hidden font-dmsans text-[13px]">
      
      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (fixed left, 240px wide or 64px if collapsed) */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#0D0D0D] text-white flex flex-col justify-between z-50 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Sidebar Top: Logo */}
          <div className="h-16 border-b border-white border-opacity-5 flex items-center justify-between px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D63F6F] flex items-center justify-center font-sora font-extrabold text-black shrink-0">
                P
              </div>
              {!collapsed && (
                <span className="font-sora text-sm font-black tracking-widest text-white">
                  PLOTTWEAR
                </span>
              )}
            </Link>

            <button 
              onClick={() => setMobileOpen(false)} 
              className="lg:hidden text-white hover:text-pink-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <div className="p-4 space-y-6 flex-1">
            {navSections.map((sect, sectIdx) => (
              <div key={sectIdx} className="space-y-1">
                {!collapsed && (
                  <span className="text-[9px] uppercase tracking-wider text-neutral-600 font-bold block px-4 mb-2">
                    {sect.label}
                  </span>
                )}
                <div className="space-y-0.5">
                  {sect.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg font-medium transition-all ${
                          isActive
                            ? 'bg-[#D63F6F] bg-opacity-10 text-[#D63F6F] border-l-4 border-[#D63F6F]'
                            : 'text-neutral-400 hover:text-white hover:bg-white hover:bg-opacity-5'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Bottom: User Admin info */}
        <div className="p-4 border-t border-white border-opacity-5 bg-black bg-opacity-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D63F6F] bg-opacity-20 text-[#D63F6F] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D63F6F] border-opacity-20">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-neutral-500 truncate">{user?.email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => {
                  logout();
                  router.push('/account/login');
                }}
                className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Logout Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        
        {/* Top bar (fixed, minus sidebar) */}
        <header className="h-16 border-b border-neutral-200 px-8 flex justify-between items-center bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-800 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Collapse button for Desktop */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-1.5 rounded bg-neutral-100 hover:bg-neutral-200 transition-all text-neutral-600"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>

            <h2 className="font-sora text-base font-bold text-neutral-800 tracking-wide">
              {navSections.flatMap(s => s.items).find(i => i.href === pathname || (i.href !== '/admin' && pathname.startsWith(i.href)))?.label || 'Plottwear Console'}
            </h2>
          </div>

          {/* Global Search & Bells */}
          <div className="flex items-center gap-6 flex-1 max-w-lg justify-end ml-auto">
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search products, orders, customers..."
                className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-1.5 pl-9 pr-4 text-xs text-neutral-800 focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
              />
              {/* Global search dropdown */}
              {showSearchDropdown && (searchQuery.trim().length > 1) && (
                <div className="absolute right-0 top-11 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-4 space-y-4 max-h-[350px] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <span className="text-[10px] uppercase font-bold text-neutral-500">Global Search Query</span>
                    <button onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }} className="text-neutral-400 hover:text-neutral-600"><X className="w-3.5 h-3.5" /></button>
                  </div>

                  {searchLoading ? (
                    <div className="text-center py-4 text-xs text-neutral-500">Querying database index...</div>
                  ) : (
                    <div className="space-y-3 font-dmsans text-[11px]">
                      {/* Matching products */}
                      {searchResults?.products && searchResults.products.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] uppercase tracking-wider text-[#D63F6F] font-bold">Products</p>
                          {searchResults.products.map((p) => (
                            <Link 
                              key={p.id} 
                              href={`/admin/products`} 
                              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                              className="block p-1.5 rounded hover:bg-neutral-50 border border-neutral-100 font-semibold truncate text-neutral-700"
                            >
                              {p.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Matching orders */}
                      {searchResults?.orders && searchResults.orders.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] uppercase tracking-wider text-[#D63F6F] font-bold">Orders</p>
                          {searchResults.orders.map((o) => (
                            <Link 
                              key={o.id} 
                              href={`/admin/orders/${o.id}`} 
                              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                              className="block p-1.5 rounded hover:bg-neutral-50 border border-neutral-100 font-semibold flex justify-between text-neutral-700"
                            >
                              <span>Invoice #{o.id}</span>
                              <span className="text-[10px] text-neutral-500">{o.user?.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Matching customers */}
                      {searchResults?.customers && searchResults.customers.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] uppercase tracking-wider text-[#D63F6F] font-bold">Customers</p>
                          {searchResults.customers.map((c) => (
                            <Link 
                              key={c.id} 
                              href={`/admin/customers/${c.id}`} 
                              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                              className="block p-1.5 rounded hover:bg-neutral-50 border border-neutral-100 font-semibold text-neutral-700"
                            >
                              {c.name} ({c.email})
                            </Link>
                          ))}
                        </div>
                      )}

                      {(!searchResults?.products.length && !searchResults?.orders.length && !searchResults?.customers.length) && (
                        <div className="text-center py-4 text-neutral-400">No matching catalogs.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={handleClearNotifications}
                className="p-2 text-neutral-500 hover:text-neutral-800 transition-colors relative cursor-pointer"
                title={`${unreadCount} new orders since last visit. Click to clear.`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#D63F6F] text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Avatar Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#D63F6F] bg-opacity-20 text-[#D63F6F] flex items-center justify-center font-bold text-xs border border-[#D63F6F] border-opacity-20">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-10 w-44 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-bold truncate text-neutral-800">{user?.name}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{user?.role} scope</p>
                  </div>
                  <Link 
                    href="/admin/settings" 
                    onClick={() => setShowProfileMenu(false)}
                    className="block w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                  >
                    Console Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      router.push('/account/login');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-neutral-50 text-red-500 font-semibold cursor-pointer"
                  >
                    Logout Console
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col justify-start">
          {children}
        </main>
      </div>

      {/* Global Toast provider */}
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
