'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { apiFetch } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, SlidersHorizontal, RotateCcw, ChevronDown, Sparkles, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock_qty: number;
  price_override: number | null;
}

interface Product {
  id: number;
  collection_id: number;
  name: string;
  description: string;
  base_price: number;
  is_active: boolean;
  sort_color: 'black' | 'white' | 'pink';
  created_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
  collectionName?: string;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
}

// Fallback images
const STREETWEAR_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
];

const getProductImage = (product: Product, index: number) => {
  const primary = product.images?.find((i) => i.is_primary) || product.images?.[0];
  if (primary && primary.image_path && !primary.image_path.includes('placeholder')) {
    return `http://localhost:8000${primary.image_path}`;
  }
  return STREETWEAR_FALLBACK_IMAGES[index % STREETWEAR_FALLBACK_IMAGES.length];
};

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

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-dmsans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-neutral-400">Loading Plottwear Catalogue...</p>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  // API states
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(12000); // Max cap (in KES)
  const [sortBy, setSortBy] = useState<string>('featured');

  // Load URL query params
  useEffect(() => {
    const colParam = searchParams.get('collection');
    if (colParam) {
      setSelectedCollections([colParam]);
    }
  }, [searchParams]);

  // Fetch collections & all products
  useEffect(() => {
    const loadShopData = async () => {
      try {
        setLoading(true);
        const cols = await apiFetch<Collection[]>('/collections');
        setCollections(cols);

        // Fetch products from each collection in parallel
        const fetchPromises = cols.map(async (col) => {
          try {
            const res = await apiFetch<{ products: Product[] }>(`/collections/${col.slug}/products`);
            return res.products.map(p => ({
              ...p,
              collectionName: col.name
            }));
          } catch (err) {
            console.error(`Error loading products for ${col.slug}:`, err);
            return [];
          }
        });

        const allProductsNested = await Promise.all(fetchPromises);
        setProducts(allProductsNested.flat());
      } catch (err) {
        console.error('Error loading shop page:', err);
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, []);

  // Unique lists from loaded products
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => p.variants?.forEach((v) => {
      if (v.stock_qty > 0) sizes.add(v.size);
    }));
    return Array.from(sizes).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => p.variants?.forEach((v) => colors.add(v.color)));
    return Array.from(colors).sort();
  }, [products]);

  // Handle Quick Add
  const handleQuickAdd = (product: Product, size: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const variant = product.variants.find((v) => v.size === size && v.stock_qty > 0);
    if (!variant) return;

    addToCart({
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      unit_price: variant.price_override || product.base_price,
      size: variant.size,
      color: variant.color,
      image_url: getProductImage(product, product.id),
    }, 1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCollections([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPrice(12000);
    setSortBy('featured');
  };

  // Toggle filter lists
  const toggleCollection = (slug: string) => {
    setSelectedCollections(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  // Filtered & Sorted products computation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    // Collections
    if (selectedCollections.length > 0) {
      result = result.filter((p) => {
        const col = collections.find((c) => c.id === p.collection_id);
        return col && selectedCollections.includes(col.slug);
      });
    }

    // Sizes
    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.variants?.some((v) => v.stock_qty > 0 && selectedSizes.includes(v.size))
      );
    }

    // Colors
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.variants?.some((v) => selectedColors.includes(v.color))
      );
    }

    // Price range (in cents)
    result = result.filter((p) => p.base_price / 100 <= maxPrice);

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.base_price - a.base_price);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, searchQuery, selectedCollections, selectedSizes, selectedColors, maxPrice, sortBy, collections]);

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col justify-between relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-brand-pink opacity-10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[60%] aspect-square rounded-full bg-brand-pinkAccent opacity-5 blur-[150px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-32 z-10">
        {/* Banner Title */}
        <div className="mb-12 text-center md:text-left">
          <span className="font-sora text-[9px] uppercase tracking-widest text-brand-pink font-bold bg-brand-pink bg-opacity-10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3 h-3 text-brand-pink fill-brand-pink" /> Plottwear Storefront
          </span>
          <h1 className="font-sora font-extrabold text-3xl md:text-6xl text-white tracking-tight">
            ALL STREETWEAR
          </h1>
          <p className="font-dmsans text-xs md:text-sm text-brand-grayLight opacity-70 mt-2 max-w-xl">
            Explore Nairobi&apos;s ultimate collection drops. Heavy cotton silhouettes, distressed cuts, and gold & diamond detail accents.
          </p>
        </div>

        {/* Dual-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Panel Filters */}
          <div className="bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-2xl p-6 shadow-xl space-y-8 lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-white border-opacity-10 pb-4">
              <span className="font-sora font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-pink" /> FILTERS
              </span>
              <button
                onClick={handleResetFilters}
                className="font-dmsans text-[10px] text-brand-pink hover:text-white flex items-center gap-1 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-85 font-semibold">
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-grayLight opacity-50" />
                <input
                  type="text"
                  placeholder="e.g. Hoodie, Cargo"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg py-2 pl-9 pr-3 text-xs text-white font-dmsans placeholder-brand-grayLight placeholder-opacity-40 focus:outline-none focus:border-brand-pink transition-all"
                />
              </div>
            </div>

            {/* Collections Checkboxes */}
            <div className="space-y-3">
              <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-85 font-semibold">
                Collections
              </label>
              <div className="space-y-2">
                {collections.map((col) => (
                  <label
                    key={col.slug}
                    className="flex items-center gap-3 cursor-pointer group text-xs text-white text-opacity-80 hover:text-white font-dmsans transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(col.slug)}
                      onChange={() => toggleCollection(col.slug)}
                      className="rounded border-white border-opacity-25 bg-transparent text-brand-pink focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                    />
                    <span>{col.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-85 font-semibold">
                  Max Price
                </label>
                <span className="font-dmsans text-xs text-brand-pink font-bold">
                  {formatPrice(maxPrice * 100)}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="12000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-brand-pink h-1 bg-white bg-opacity-10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-brand-grayLight opacity-40 font-dmsans">
                <span>KES 1,500</span>
                <span>KES 12,000</span>
              </div>
            </div>

            {/* Sizes Selection (Grid bubbles) */}
            {availableSizes.length > 0 && (
              <div className="space-y-3">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-85 font-semibold">
                  Filter by Size
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`w-9 h-9 rounded-full text-xs font-bold font-sora transition-all flex items-center justify-center border ${
                          isSelected
                            ? 'bg-brand-pink text-brand-black border-brand-pink shadow-md'
                            : 'bg-white bg-opacity-5 text-white border-white border-opacity-10 hover:border-brand-pink hover:bg-opacity-10'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors Selection */}
            {availableColors.length > 0 && (
              <div className="space-y-3">
                <label className="font-sora text-[10px] uppercase tracking-wider text-white opacity-85 font-semibold">
                  Filter by Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const isSelected = selectedColors.includes(color);
                    return (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-medium font-dmsans border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-pink text-brand-black border-brand-pink font-semibold shadow-md'
                            : 'bg-white bg-opacity-5 text-white border-white border-opacity-10 hover:border-brand-pink hover:bg-opacity-10'
                        }`}
                        title={color}
                      >
                        <span className={`w-2 h-2 rounded-full ${getColorBadge(color)}`} />
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Product Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header controls (Count & Sort) */}
            <div className="flex flex-wrap justify-between items-center bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-xl p-4 gap-4">
              <span className="font-dmsans text-xs text-white text-opacity-80">
                Showing{' '}
                <strong className="text-white font-bold">{filteredProducts.length}</strong>{' '}
                streetwear items
              </span>

              <div className="flex items-center gap-2">
                <span className="font-sora text-[9px] uppercase tracking-wider text-white opacity-60">
                  Sort By:
                </span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-brand-black border border-white border-opacity-15 rounded-lg py-2 pl-3 pr-8 text-xs text-white font-dmsans focus:outline-none focus:border-brand-pink cursor-pointer"
                  >
                    <option value="featured">Featured Drop</option>
                    <option value="newest">Newest Releases</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-asc">Alphabetical: A-Z</option>
                    <option value="name-desc">Alphabetical: Z-A</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-grayLight opacity-50 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product list rendering */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-brand-pink animate-spin" />
                <span className="font-sora text-xs text-brand-grayLight opacity-65">
                  Streaming Streetwear Catalog...
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl p-16 text-center space-y-4"
              >
                <div className="w-12 h-12 bg-white bg-opacity-5 rounded-full flex items-center justify-center mx-auto text-brand-grayLight">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h4 className="font-sora font-extrabold text-sm text-white uppercase tracking-wider">
                  No Products Match Filters
                </h4>
                <p className="font-dmsans text-xs text-brand-grayLight opacity-60 max-w-sm mx-auto">
                  Try adjusting your collection checkboxes, sizes, price slider, or keyword search to reveal active streetwear drops.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-brand-pink text-brand-black hover:bg-white hover:text-brand-black font-sora font-bold text-[10px] uppercase tracking-wider py-2.5 px-6 rounded-lg transition-all"
                >
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredProducts.map((product, idx) => {
                    const uniqueColors = Array.from(new Set(product.variants?.map((v) => v.color) || []));
                    const uniqueSizes = Array.from(
                      new Set(product.variants?.filter((v) => v.stock_qty > 0).map((v) => v.size) || [])
                    );
                    const productImg = getProductImage(product, product.id);
                    const originalPrice = product.base_price * 1.35;

                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="group cursor-pointer flex flex-col h-full bg-white bg-opacity-[0.03] border border-white border-opacity-10 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:bg-opacity-[0.06] hover:border-brand-pink hover:-translate-y-1.5 relative"
                      >
                        {/* Image wrapper */}
                        <div className="aspect-[4/5] bg-brand-black overflow-hidden relative">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-brand-black bg-opacity-60 text-white hover:bg-brand-pink hover:text-brand-black transition-colors z-10"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>

                          <img
                            src={productImg}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />

                          {/* Quick Add Overlay on Hover */}
                          <div className="absolute inset-0 bg-brand-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                            {uniqueSizes.length > 0 ? (
                              <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-[9px] uppercase tracking-widest font-bold text-white text-center">
                                  Quick Add Size
                                </p>
                                <div className="flex flex-wrap gap-1.5 justify-center">
                                  {uniqueSizes.map((size) => (
                                    <button
                                      key={size}
                                      onClick={(e) => handleQuickAdd(product, size, e)}
                                      className="w-8 h-8 rounded-full border border-white border-opacity-40 bg-brand-black bg-opacity-70 text-white text-[10px] font-bold hover:bg-white hover:text-brand-black hover:border-white transition-all flex items-center justify-center"
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] uppercase tracking-widest font-semibold bg-brand-pink text-brand-black px-4 py-2 text-center shadow-lg rounded">
                                View Details
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 flex flex-col justify-between p-4">
                          <div>
                            {/* Rating & Collection label */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-sora text-[8px] uppercase tracking-wider text-brand-pink font-semibold">
                                {product.collectionName || 'Collection'}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 text-amber-500 fill-current" />
                                <span className="text-[9px] text-brand-grayLight opacity-60 font-semibold font-dmsans">
                                  (4.9)
                                </span>
                              </div>
                            </div>

                            <h4 className="font-sora font-semibold text-xs md:text-sm text-white leading-tight group-hover:text-brand-pink transition-colors">
                              {product.name}
                            </h4>

                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="font-dmsans text-sm font-bold text-white">
                                {formatPrice(product.base_price)}
                              </span>
                              <span className="font-dmsans text-[10px] text-brand-grayLight opacity-50 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            </div>
                          </div>

                          {/* Color dots */}
                          {uniqueColors.length > 0 && (
                            <div className="flex gap-1.5 mt-3 pt-3 border-t border-white border-opacity-5">
                              {uniqueColors.map((color) => (
                                <span
                                  key={color}
                                  className={`w-2.5 h-2.5 rounded-full ${getColorBadge(color)}`}
                                  title={color}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
