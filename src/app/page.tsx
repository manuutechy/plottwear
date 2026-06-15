'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import { ProductSlider } from '@/components/ProductSlider';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Curated high-quality streetwear fallback images to make the storefront look stunning
const STREETWEAR_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80', // Olive Green hoodie
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80', // Black graphics hoodie
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80', // Brown utility cargo jacket
  'https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?auto=format&fit=crop&w=600&q=80', // Knit beanie cap
  'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80', // Beige fleece coat
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80', // Streetwear model pink background
  'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80', // Streetwear denim fit
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80', // Female model cargo outfit
];

// Custom brand SVGs to bypass lucide-react deprecations
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

// Premium mock essentials array for other product lineups (accessories & headwear)
const MOCK_ESSENTIALS = [
  {
    id: 101,
    name: "Signature Script Cap",
    price: 250000,
    originalPrice: 350000,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    sizes: ["OSFA"],
    colors: ["Black", "Cream"]
  },
  {
    id: 102,
    name: "Heavy Utility Cargo Bag",
    price: 480000,
    originalPrice: 650000,
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    sizes: ["OSFA"],
    colors: ["Olive", "Onyx"]
  },
  {
    id: 103,
    name: "Nairobi Essential Tee",
    price: 320000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black"]
  },
  {
    id: 104,
    name: "Plott Heavyweight Socks (3-Pack)",
    price: 150000,
    originalPrice: 220000,
    image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    sizes: ["M", "L"],
    colors: ["White", "Grey"]
  }
];

// Premium mock category listings for additional lineups
const MOCK_CATEGORIES_DATA = {
  outerwear: [
    {
      id: 201,
      name: "Nairobi Tech-Puffer",
      price: 850000,
      originalPrice: 1100000,
      image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
      rating: 4.9,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Onyx Black", "Olive Drab"]
    },
    {
      id: 202,
      name: "Distressed Canvas Jacket",
      price: 620000,
      originalPrice: 850000,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      rating: 4.8,
      sizes: ["M", "L", "XL"],
      colors: ["Tobacco", "Dust Gray"]
    },
    {
      id: 203,
      name: "Vintage Workwear Jacket",
      price: 580000,
      originalPrice: 750000,
      image: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=600&q=80",
      rating: 4.7,
      sizes: ["S", "M", "L"],
      colors: ["Navy", "Charcoal"]
    }
  ],
  bottoms: [
    {
      id: 301,
      name: "Multi-Pocket Tactical Cargos",
      price: 520000,
      originalPrice: 720000,
      image: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&w=600&q=80",
      rating: 4.9,
      sizes: ["30", "32", "34", "36"],
      colors: ["Sage Green", "Matte Black"]
    },
    {
      id: 302,
      name: "Wide-Leg Distressed Jeans",
      price: 480000,
      originalPrice: 650000,
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
      rating: 4.8,
      sizes: ["30", "32", "34"],
      colors: ["Vintage Indigo", "Acid Wash"]
    },
    {
      id: 303,
      name: "Heavy French Terry Sweatpants",
      price: 390000,
      originalPrice: 550000,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
      rating: 4.9,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Slate Gray", "Warm Sand"]
    }
  ],
  footwear: [
    {
      id: 401,
      name: "Plott Cloud Slides",
      price: 250000,
      originalPrice: 380000,
      image: "https://images.unsplash.com/photo-1603808033192-082d6f74b30d?auto=format&fit=crop&w=600&q=80",
      rating: 4.8,
      sizes: ["40", "41", "42", "43", "44"],
      colors: ["Bone", "Onyx"]
    },
    {
      id: 402,
      name: "Monogram Slide Sandals",
      price: 220000,
      originalPrice: 320000,
      image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=600&q=80",
      rating: 4.7,
      sizes: ["40", "41", "42", "43"],
      colors: ["Cream", "Black"]
    },
    {
      id: 403,
      name: "Heavy-Core Combat Boots",
      price: 1200000,
      originalPrice: 1650000,
      image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80",
      rating: 5.0,
      sizes: ["41", "42", "43", "44"],
      colors: ["Onyx Black"]
    }
  ]
};

const HERO_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1920&q=80', // Premium streetwear editorial
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1920&q=80', // Minimalist studio portrait
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80', // High-end luxury fashion silhouette
];

const getHeroImage = (slide: HeroSlide, index: number) => {
  if (slide && slide.image_path && !slide.image_path.includes('placeholder')) {
    return `http://localhost:8000${slide.image_path}`;
  }
  return HERO_FALLBACK_IMAGES[index % HERO_FALLBACK_IMAGES.length];
};

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_link: string;
  image_path: string;
  sort_order: number;
}

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
  base_price: number; // in cents
  is_active: boolean;
  sort_color: 'black' | 'white' | 'pink';
  created_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  hero_image_path: string;
  accent_color: string;
}

// Helper to get high-quality product images
const getProductImage = (product: Product, index: number) => {
  const primary = product.images?.find((i) => i.is_primary) || product.images?.[0];
  if (primary && primary.image_path && !primary.image_path.includes('placeholder')) {
    return `http://localhost:8000${primary.image_path}`;
  }
  return STREETWEAR_FALLBACK_IMAGES[index % STREETWEAR_FALLBACK_IMAGES.length];
};

export default function Home() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Products grouped by collection slug
  const [newWaveProducts, setNewWaveProducts] = useState<Product[]>([]);
  const [goldProducts, setGoldProducts] = useState<Product[]>([]);
  const [diamondProducts, setDiamondProducts] = useState<Product[]>([]);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'outerwear' | 'bottoms' | 'footwear'>('outerwear');

  // Fetch all initial data
  useEffect(() => {
    const loadStorefrontData = async () => {
      try {
        const [slidesData, collectionsData, settingsData] = await Promise.all([
          apiFetch<HeroSlide[]>('/hero-slides'),
          apiFetch<Collection[]>('/collections'),
          apiFetch<any>('/settings')
        ]);

        setSlides(slidesData);
        setCollections(collectionsData);

        if (settingsData?.announcements) {
          try {
            const parsed = JSON.parse(settingsData.announcements);
            if (Array.isArray(parsed)) {
              setAnnouncements(parsed.filter((a: any) => a.is_active));
            }
          } catch (e) {}
        }

        // Fetch products for each collection dynamically
        const newWaveRes = await apiFetch<{ products: Product[] }>('/collections/new-wave/products');
        setNewWaveProducts(newWaveRes.products);

        const goldRes = await apiFetch<{ products: Product[] }>('/collections/gold-designs/products');
        setGoldProducts(goldRes.products);

        const diamondRes = await apiFetch<{ products: Product[] }>('/collections/diamond-designs/products');
        setDiamondProducts(diamondRes.products);
      } catch (err) {
        console.error('Error loading storefront data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStorefrontData();
  }, []);

  // Hero slider autoplay
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const handleNextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }
  };

  const handlePrevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    }
  };

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  const handleQuickAdd = (product: Product, size: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop navigation to detail page
    const variant = product.variants.find((v) => v.size === size && v.stock_qty > 0);
    if (!variant) return;
    const primaryImg = product.images.find((i) => i.is_primary) || product.images[0];
    const imgPath = primaryImg ? primaryImg.image_path : '';
    
    addToCart({
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      color: variant.color,
      size: variant.size,
      unit_price: variant.price_override ?? product.base_price,
      image_url: imgPath
    }, 1);
  };

  const handleMockQuickAdd = (item: any, size: string, color: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop navigation
    addToCart({
      product_id: item.id,
      variant_id: item.id * 10, // Mock variant ID
      product_name: item.name,
      color: color,
      size: size,
      unit_price: item.price,
      image_url: item.image
    }, 1);
  };

  // Helper to check if product is "new" (less than 30 days old)
  const isNewProduct = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Maps color string to visual CSS classes
  const getColorBadge = (colorName: string) => {
    const color = colorName.toLowerCase();
    if (color.includes('black') || color.includes('onyx') || color.includes('charcoal')) {
      return 'bg-brand-black border border-brand-grayMed border-opacity-30';
    }
    if (color.includes('white') || color.includes('cream') || color.includes('parchment')) {
      return 'bg-brand-grayLight border border-brand-grayMed border-opacity-35';
    }
    if (color.includes('pink') || color.includes('rose')) {
      return 'bg-brand-pink border border-brand-pink border-opacity-40';
    }
    if (color.includes('brown') || color.includes('amber') || color.includes('gold')) {
      return 'bg-amber-800 border border-amber-900 border-opacity-40';
    }
    return 'bg-brand-grayMed border border-brand-grayDark';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-brand-pink border-t-brand-black rounded-full animate-spin"></div>
          <h2 className="font-sora tracking-widest text-xs uppercase font-semibold text-brand-black animate-pulse">
            PLOTTWEAR
          </h2>
        </div>
      </div>
    );
  }

  // Active slide info
  const activeSlide = slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-white text-brand-black flex flex-col font-dmsans overflow-hidden">
      {/* Announcement Bar */}
      <div className="bg-brand-black text-white h-9 flex items-center overflow-hidden border-b border-brand-grayDark relative z-50 mt-16 md:mt-18">
        <div className="animate-marquee whitespace-nowrap flex text-[10px] tracking-[0.25em] uppercase font-medium">
          {announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <React.Fragment key={idx}>
                <span className="mx-8">{ann.text}</span>
                <span className="mx-8 text-brand-pink">·</span>
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="mx-8">Free delivery on orders over KES 5,000</span>
              <span className="mx-8 text-brand-pink">·</span>
              <span className="mx-8">New Wave collection now live</span>
              <span className="mx-8 text-brand-pink">·</span>
              <span className="mx-8 text-brand-gold">Shop Gold Designs Archive</span>
              <span className="mx-8 text-brand-pink">·</span>
            </>
          )}
          
          {/* Repeat for seamless marquee loop */}
          {announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <React.Fragment key={`repeat-${idx}`}>
                <span className="mx-8">{ann.text}</span>
                <span className="mx-8 text-brand-pink">·</span>
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="mx-8">Free delivery on orders over KES 5,000</span>
              <span className="mx-8 text-brand-pink">·</span>
              <span className="mx-8">New Wave collection now live</span>
              <span className="mx-8 text-brand-pink">·</span>
              <span className="mx-8 text-brand-gold">Shop Gold Designs Archive</span>
              <span className="mx-8 text-brand-pink">·</span>
            </>
          )}
        </div>
      </div>

      <Navbar />

      {/* Hero Section */}
      {activeSlide && (
        <section className="relative h-[calc(100vh-100px)] w-full overflow-hidden bg-brand-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Full Bleed Image */}
              <img
                src={getHeroImage(activeSlide, currentSlideIndex)}
                alt={activeSlide.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = HERO_FALLBACK_IMAGES[currentSlideIndex % HERO_FALLBACK_IMAGES.length];
                }}
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black via-opacity-40 to-transparent bg-opacity-60" />

              {/* Text Content */}
              <div className="absolute inset-0 flex items-center justify-start px-6 md:px-24">
                <div className="max-w-xl text-left space-y-6">
                  <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="font-sora text-4xl sm:text-7xl font-extrabold text-white leading-tight tracking-tight"
                  >
                    {activeSlide.title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 0.8 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-white text-sm sm:text-lg font-light leading-relaxed"
                  >
                    {activeSlide.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    <button
                      onClick={() => {
                        // Handle local anchor scroll or redirect
                        if (activeSlide.cta_link.startsWith('#')) {
                          const el = document.getElementById(activeSlide.cta_link.replace('#', ''));
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          router.push(activeSlide.cta_link);
                        }
                      }}
                      className="font-dmsans text-xs font-semibold tracking-widest uppercase bg-brand-pink text-brand-black px-8 py-4 hover:bg-white hover:text-brand-black transition-colors duration-300 shadow-lg"
                    >
                      {activeSlide.cta_label}
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Controls (Arrows) */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white border-opacity-20 bg-brand-black bg-opacity-30 text-white hover:bg-white hover:text-brand-black transition-colors duration-300 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white border-opacity-20 bg-brand-black bg-opacity-30 text-white hover:bg-white hover:text-brand-black transition-colors duration-300 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-10 left-0 w-full flex justify-center space-x-3 z-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlideIndex ? 'w-8 bg-brand-pink' : 'w-2 bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION: NEW WAVE */}
      <section id="new-wave" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block"
            >
              <h2 className="font-sora text-3xl md:text-5xl font-extrabold tracking-tight text-brand-black">
                NEW WAVE
              </h2>
              <div className="h-1 bg-brand-pink w-20 mt-3" />
            </motion.div>
            <p className="font-dmsans text-sm text-brand-grayMed mt-4 max-w-lg leading-relaxed">
              Fresh drop energy. Nairobi&apos;s latest streetwear statements. Made with heavyweight fabrics and dynamic vector illustrations.
            </p>
          </div>

          {/* Product Grid (2-row Slider) */}
          <ProductSlider
            products={newWaveProducts}
            theme="new-wave"
            handleQuickAdd={handleQuickAdd}
            formatPrice={formatPrice}
          />

          {/* View Collection CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/shop?collection=new-wave"
              className="inline-flex items-center gap-3 bg-white border-2 border-brand-pink text-brand-black font-sora font-extrabold text-xs uppercase tracking-widest py-[18px] px-10 rounded-xl transition-all duration-300 hover:bg-brand-pink hover:text-brand-black hover:shadow-[0_12px_30px_rgba(232,160,180,0.35)] shadow-md group"
            >
              <span>View New Wave Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: TRENDING ESSENTIALS */}
      <section id="essentials" className="py-24 bg-brand-grayLight bg-opacity-30 border-t border-b border-brand-grayLight">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-sora text-3xl md:text-5xl font-extrabold tracking-tight text-brand-black flex items-center gap-2">
                  PLOTT ESSENTIALS <Sparkles className="w-6 h-6 text-brand-pink fill-brand-pink animate-pulse" />
                </h2>
                <div className="h-1 bg-brand-pink w-32 mt-3" />
              </motion.div>
              <p className="font-dmsans text-sm text-brand-grayMed mt-4 max-w-lg leading-relaxed">
                Complete your look. Premium utility bags, embroidered caps, and heavyweight socks built to elevate your daily rotation.
              </p>
            </div>
          </div>

          {/* Essentials Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {MOCK_ESSENTIALS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="group cursor-pointer flex flex-col h-full bg-white border border-brand-grayLight rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-brand-pink"
              >
                {/* Image wrapper */}
                <div className="aspect-square bg-brand-grayLight overflow-hidden relative">
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white bg-opacity-70 text-brand-black hover:bg-brand-pink hover:text-white transition-colors z-10"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>

                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Quick Add Overlay */}
                  <div className="absolute inset-0 bg-brand-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-white text-center mb-1">Quick Add</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={(e) => handleMockQuickAdd(item, size, item.colors[0], e)}
                          className="px-3 py-1.5 rounded bg-white text-brand-black text-[9px] font-bold hover:bg-brand-pink hover:text-brand-black transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                      <span className="text-[9px] text-brand-grayMed font-semibold font-dmsans">({item.rating})</span>
                    </div>

                    <h4 className="font-sora font-semibold text-xs text-brand-black leading-tight group-hover:text-brand-pinkAccent transition-colors truncate">
                      {item.name}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-dmsans text-xs font-bold text-brand-black">
                        {formatPrice(item.price)}
                      </span>
                      <span className="font-dmsans text-[10px] text-brand-grayMed line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL PROMOTIONAL STRIP */}
      <section className="bg-brand-black text-white py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <p className="font-dmsans text-xs tracking-[0.4em] uppercase text-brand-pink font-semibold">
            ESTABLISHED IN NAIROBI
          </p>
          <h3 className="font-sora text-3xl sm:text-6xl font-extrabold tracking-tight leading-none text-white">
            BORN IN NAIROBI.<br />BUILT FOR THE STREETS.
          </h3>
          <p className="font-dmsans text-xs text-brand-grayMed max-w-md mx-auto leading-relaxed">
            Plottwear merges local street culture with global luxury fashion design. Every garment is crafted, detailed, and released in limited cycles.
          </p>
          <div>
            <button
              onClick={() => {
                const el = document.getElementById('new-wave');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="font-dmsans text-[10px] tracking-widest uppercase font-bold text-brand-black bg-white hover:bg-brand-pink hover:text-brand-black px-6 py-3.5 transition-colors duration-300"
            >
              Shop Current Drops
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: GOLD DESIGNS */}
      <section id="gold-designs" className="py-24 bg-brand-goldBg border-t border-b border-brand-gold border-opacity-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-sora text-3xl md:text-5xl font-bold italic tracking-tight text-[#3B2A1A]">
                  Gold Designs
                </h2>
                <div className="h-0.5 bg-brand-gold w-32 mt-3" />
              </motion.div>
              <p className="font-dmsans text-sm text-[#5C4D3E] mt-4 max-w-lg leading-relaxed">
                Archival collection pieces. Textured heavy knits, vintage brown corduroys, and custom gold-engraved utility finishes.
              </p>
            </div>
            {/* Optional collection banner */}
            <div className="w-full md:w-80 h-32 overflow-hidden bg-brand-grayLight relative border border-[#D4C5AA] hidden sm:block">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
                alt="Gold theme"
                className="w-full h-full object-cover filter sepia opacity-70"
              />
              <div className="absolute inset-0 bg-[#3B2A1A] bg-opacity-10" />
            </div>
          </div>

          {/* Product Grid (2-row Slider) */}
          <ProductSlider
            products={goldProducts}
            theme="gold-designs"
            handleQuickAdd={handleQuickAdd}
            formatPrice={formatPrice}
          />

          {/* View Collection CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/shop?collection=gold-designs"
              className="inline-flex items-center gap-3 bg-[#EDE8DF] border-2 border-brand-gold text-[#3B2A1A] font-sora font-extrabold text-xs uppercase tracking-widest py-[18px] px-10 rounded-xl transition-all duration-300 hover:bg-brand-gold hover:text-brand-black hover:shadow-[0_12px_30px_rgba(201,168,76,0.35)] shadow-md group"
            >
              <span>View Gold Designs Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: DIAMOND DESIGNS */}
      <section id="diamond-designs" className="py-24 bg-brand-diamondBg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center space-y-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-sora text-3xl md:text-5xl font-extrabold tracking-widest uppercase text-brand-black">
                Diamond Designs
              </h2>
            </motion.div>
            <p className="font-dmsans text-xs text-brand-grayMed max-w-md mx-auto leading-relaxed">
              Gallery archives. Stripped-back streetwear garments, oversized outline fits, and silver-chrome industrial eyelets.
            </p>
          </div>

          {/* Product Grid (2-row Slider) */}
          <ProductSlider
            products={diamondProducts}
            theme="diamond-designs"
            handleQuickAdd={handleQuickAdd}
            formatPrice={formatPrice}
          />

          {/* View Collection CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/shop?collection=diamond-designs"
              className="inline-flex items-center gap-3 bg-brand-black border-2 border-white border-opacity-35 text-white font-sora font-extrabold text-xs uppercase tracking-widest py-[18px] px-10 rounded-xl transition-all duration-300 hover:bg-white hover:text-brand-black hover:shadow-[0_12px_30px_rgba(255,255,255,0.15)] shadow-md group"
            >
              <span>View Diamond Designs Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: PLOTT MASTERPIECE */}
      <section id="masterpiece" className="py-24 bg-brand-black text-white relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink opacity-5 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold opacity-5 rounded-full filter blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text content (5 columns) */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-brand-pink text-xs font-semibold tracking-[0.25em] uppercase">
                <Sparkles className="w-4 h-4 fill-brand-pink" /> Plott Masterpiece
              </div>
              <h2 className="font-sora text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                THE DISTRESSED HEAVY CARDIGAN
              </h2>
              <div className="h-1 bg-brand-pink w-24" />
            </motion.div>

            <p className="font-dmsans text-sm text-brand-grayMed leading-relaxed">
              Engineered over 12 months, this is the pinnacle of Plottwear design. Made with 500gsm custom cotton-wool blend yarn, featuring hand-distressed detailing on the cuffs and hem, and finished with signature gunmetal hardware buttons.
            </p>

            <div className="space-y-4 font-dmsans text-xs text-brand-grayMed">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                <span>Heavyweight 500gsm custom rib-knit</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                <span>Individually hand-distressed so no two garments are identical</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                <span>Gunmetal hardware engraved buttons</span>
              </div>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('signature');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="font-dmsans text-xs font-bold tracking-widest uppercase bg-white text-brand-black px-8 py-4 hover:bg-brand-pink hover:text-brand-black transition-colors duration-300 shadow-lg animate-bounce mt-4"
            >
              Explore Masterpiece
            </button>
          </div>

          {/* Large Showcase Image (7 columns) */}
          <div className="lg:col-span-7 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="aspect-[16/10] bg-brand-grayDark overflow-hidden border border-brand-grayDark rounded-xl relative shadow-2xl group"
            >
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80"
                alt="Plott Masterpiece Cardigan"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-brand-black bg-opacity-20" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION: SIGNATURE PIECE */}
      <section id="signature" className="py-24 bg-brand-grayLight bg-opacity-20 border-t border-b border-brand-grayLight">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="aspect-square bg-brand-grayLight overflow-hidden relative rounded-xl shadow-lg group"
            >
              <img
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
                alt="Plott Boxy Hoodie"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute top-4 left-4 bg-brand-black text-white font-sora font-bold text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded">
                Signature Core
              </span>
            </motion.div>

            {/* Right: Product Details & Purchase */}
            <div className="space-y-6">
              <span className="text-[10px] tracking-[0.3em] font-semibold text-brand-pink uppercase">Plott Staple</span>
              <h2 className="font-sora text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-black">
                HEAVY-CORE BOXY HOODIE
              </h2>
              <div className="h-1 bg-brand-pink w-20" />
              
              {/* Rating */}
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs text-brand-grayMed font-semibold font-dmsans">(5.0 / 248 reviews)</span>
              </div>

              <p className="font-dmsans text-sm text-brand-grayMed leading-relaxed">
                The ultimate boxy hoodie. Cut from 450gsm organic French Terry cotton, featuring a double-lined hood (no drawstrings for clean aesthetics), dropped shoulder seams, and a hidden kangaroo phone pocket. Built to last a lifetime.
              </p>

              <div className="flex items-baseline gap-3">
                <span className="font-dmsans text-2xl font-extrabold text-brand-black">KES 5,500</span>
                <span className="font-dmsans text-sm text-brand-grayMed line-through">KES 8,000</span>
              </div>

              {/* Purchase Options */}
              <div className="space-y-4 pt-4 border-t border-brand-grayLight">
                <p className="font-dmsans text-[10px] uppercase tracking-wider font-semibold text-brand-black">Select Size</p>
                <div className="flex gap-2">
                  {["XS", "S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({
                          product_id: 999,
                          variant_id: 9990,
                          product_name: "Heavy-Core Boxy Hoodie",
                          color: "Onyx Black",
                          size: size,
                          unit_price: 550000,
                          image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80"
                        }, 1);
                      }}
                      className="w-10 h-10 rounded border border-brand-grayLight text-brand-black font-bold text-xs hover:bg-brand-black hover:text-white hover:border-brand-black transition-all flex items-center justify-center"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: OTHER CATEGORIES */}
      <section id="categories" className="py-24 bg-white border-t border-brand-grayLight">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-[10px] tracking-[0.3em] font-semibold text-brand-pink uppercase">Catalogues Expansion</span>
              <h2 className="font-sora text-3xl md:text-5xl font-extrabold tracking-tight text-brand-black mt-2">
                EXPANDED DEPARTMENTS
              </h2>
            </motion.div>
            <p className="font-dmsans text-sm text-brand-grayMed max-w-md mx-auto">
              Explore specialized product departments designed to complement our main drop collections.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center border-b border-brand-grayLight mb-12 max-w-md mx-auto">
            {(["outerwear", "bottoms", "footwear"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategoryTab(tab)}
                className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase text-center border-b-2 transition-all ${
                  activeCategoryTab === tab
                    ? "border-brand-black text-brand-black"
                    : "border-transparent text-brand-grayMed hover:text-brand-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_CATEGORIES_DATA[activeCategoryTab].map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="group cursor-pointer flex flex-col h-full bg-white border border-brand-grayLight rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-brand-pink"
              >
                {/* Image wrapper */}
                <div className="aspect-[4/5] bg-brand-grayLight overflow-hidden relative">
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white bg-opacity-70 text-brand-black hover:bg-brand-pink hover:text-white transition-colors z-10"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>

                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Quick Add Overlay */}
                  <div className="absolute inset-0 bg-brand-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-white text-center mb-1">Quick Add</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {item.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={(e) => handleMockQuickAdd(item, size, item.colors[0], e)}
                          className="w-8 h-8 rounded-full border border-white border-opacity-40 bg-brand-black bg-opacity-70 text-white text-[10px] font-bold hover:bg-brand-pink hover:text-brand-black hover:border-white transition-all flex items-center justify-center"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                      <span className="text-[9px] text-brand-grayMed font-semibold font-dmsans">(({item.rating}))</span>
                    </div>

                    <h4 className="font-sora font-semibold text-xs text-brand-black leading-tight group-hover:text-brand-pinkAccent transition-colors truncate">
                      {item.name}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-dmsans text-xs font-bold text-brand-black">
                        {formatPrice(item.price)}
                      </span>
                      <span className="font-dmsans text-[10px] text-brand-grayMed line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View All Collections Button */}
          <div className="mt-16 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 bg-brand-black text-white hover:bg-brand-pink hover:text-brand-black font-sora font-extrabold text-xs uppercase tracking-widest py-5 px-10 rounded-xl transition-all duration-300 shadow-xl group"
            >
              <span>View All Collections</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: CUSTOMER REVIEWS */}
      <section id="reviews" className="py-24 bg-white border-t border-brand-grayLight">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-[10px] tracking-[0.3em] font-semibold text-brand-pink uppercase">Verified Statements</span>
              <h2 className="font-sora text-3xl md:text-5xl font-extrabold tracking-tight text-brand-black mt-2">
                WHAT THE STREETS ARE SAYING
              </h2>
            </motion.div>
            <p className="font-dmsans text-sm text-brand-grayMed max-w-md mx-auto">
              Real feedback from our global community. Exceptional cuts, heavy fabrics, and unmatched durability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 1,
                name: "Nelly K.",
                location: "Nairobi",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                review: "The 400gsm heavyweight hoodie is a work of art. The print quality is crazy durable. I've washed it 10 times and the graphics are still brand new.",
                product: "Heavyweight Monogram Hoodie"
              },
              {
                id: 2,
                name: "Jared O.",
                location: "Mombasa",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                review: "Copped the Gold Archive knit cap and cargo bag. Super fast delivery and the packaging was so premium. Love the metallic engraved details.",
                product: "Heavy Utility Cargo Bag"
              },
              {
                id: 3,
                name: "Amara W.",
                location: "Nairobi",
                avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
                review: "Perfect boxy fit, doesn't shrink. Easily the best streetwear brand out of Kenya right now. Going to buy the New Wave drop next.",
                product: "Signature Script Cap"
              }
            ].map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="bg-brand-grayLight bg-opacity-30 p-8 border border-brand-grayLight rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-amber-500 gap-0.5 mb-4">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="font-dmsans text-sm italic text-brand-black leading-relaxed">
                    &ldquo;{card.review}&rdquo;
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4 pt-6 border-t border-brand-grayLight">
                  <img
                    src={card.avatar}
                    alt={card.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-sora font-semibold text-xs text-brand-black flex items-center gap-1.5">
                      {card.name}
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Verified Purchaser" />
                    </h4>
                    <p className="font-dmsans text-[10px] text-brand-grayMed">
                      {card.location} · Bought <span className="underline">{card.product}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: INSTAGRAM FEED */}
      <section id="instagram" className="py-24 bg-brand-black text-white border-t border-brand-grayDark overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] font-semibold text-brand-pink uppercase">Community Fits</span>
            <h2 className="font-sora text-3xl md:text-5xl font-extrabold tracking-tight text-white mt-2">
              WEAR YOUR PLOTT
            </h2>
            <p className="font-dmsans text-xs text-brand-grayMed mt-2">
              Tag <span className="text-brand-pink">@plottwear</span> on Instagram to get featured.
            </p>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-dmsans text-[10px] tracking-widest uppercase font-bold text-brand-black bg-white hover:bg-brand-pink hover:text-brand-black px-6 py-3.5 transition-colors duration-300 w-fit"
          >
            Follow @plottwear
          </a>
        </div>

        {/* 6 Column Insta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 px-2">
          {[
            { id: 1, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80", likes: "1,240", comments: "38" },
            { id: 2, image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80", likes: "982", comments: "14" },
            { id: 3, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80", likes: "1,532", comments: "48" },
            { id: 4, image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=500&q=80", likes: "2,109", comments: "62" },
            { id: 5, image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80", likes: "812", comments: "9" },
            { id: 6, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=500&q=80", likes: "1,870", comments: "54" }
          ].map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.5 }}
              className="aspect-square bg-brand-grayDark overflow-hidden relative group cursor-pointer"
            >
              <img
                src={post.image}
                alt={`Instagram fit ${post.id}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
              />
              <div className="absolute inset-0 bg-brand-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-2">
                <InstagramIcon className="w-6 h-6 text-brand-pink fill-none" />
                <div className="flex gap-4 font-dmsans text-[10px] tracking-wider font-semibold text-white">
                  <span>♥ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  );
}
