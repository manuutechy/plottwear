'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

interface ProductSliderProps {
  products: Product[];
  theme: 'new-wave' | 'gold-designs' | 'diamond-designs';
  handleQuickAdd: (product: Product, size: string, e: React.MouseEvent) => void;
  formatPrice: (cents: number) => string;
}

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

export const ProductSlider: React.FC<ProductSliderProps> = ({
  products,
  theme,
  handleQuickAdd,
  formatPrice,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Group products into 2-row columns
  const columns = useMemo(() => {
    const cols: Product[][] = [];
    for (let i = 0; i < products.length; i += 2) {
      const col: Product[] = [];
      col.push(products[i]);
      if (i + 1 < products.length) {
        col.push(products[i + 1]);
      }
      cols.push(col);
    }
    return cols;
  }, [products]);

  // Update dots calculation on scroll or resize
  const updateScrollProgress = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      
      if (maxScroll <= 0) {
        setCurrentPage(0);
        setTotalPages(1);
        return;
      }

      // Calculate total columns and visible columns
      const totalCols = columns.length;
      const visibleCols = Math.round(clientWidth / 290); // 290px is approx column width (including gap)
      const pages = Math.max(1, totalCols - visibleCols + 1);
      setTotalPages(pages);

      const ratio = scrollLeft / maxScroll;
      const activePage = Math.round(ratio * (pages - 1));
      setCurrentPage(activePage);
    }
  };

  useEffect(() => {
    updateScrollProgress();
    window.addEventListener('resize', updateScrollProgress);
    return () => window.removeEventListener('resize', updateScrollProgress);
  }, [columns]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth } = containerRef.current;
      // Scroll by approximately 2 columns at a time
      const scrollAmount = direction === 'left' ? -580 : 580;
      containerRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollToPage = (pageIndex: number) => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const scrollTarget = (pageIndex / (totalPages - 1)) * maxScroll;
      containerRef.current.scrollTo({
        left: scrollTarget,
        behavior: 'smooth',
      });
      setCurrentPage(pageIndex);
    }
  };

  // Theme configuration styles
  const config = {
    'new-wave': {
      cardBg: 'bg-white',
      border: 'border-brand-grayLight border-opacity-40 hover:border-brand-pink',
      textMain: 'text-brand-black',
      textAccent: 'text-brand-pinkAccent',
      priceText: 'text-brand-black',
      hoverOverlayBg: 'bg-brand-black bg-opacity-40',
      tagBg: 'bg-brand-pink text-brand-black',
      heartColor: 'text-brand-black hover:bg-brand-pink hover:text-white',
      hoverBtnBorder: 'hover:bg-brand-pink hover:text-brand-black hover:border-brand-pink',
      dotActive: 'bg-brand-pink w-8',
      dotInactive: 'bg-brand-grayLight opacity-65 w-2',
      arrowBg: 'bg-brand-black text-white hover:bg-brand-pink hover:text-brand-black',
    },
    'gold-designs': {
      cardBg: 'bg-[#EDE8DF]',
      border: 'border-[#D4C5AA] hover:border-brand-gold',
      textMain: 'text-[#3B2A1A]',
      textAccent: 'text-brand-gold',
      priceText: 'text-[#3B2A1A]',
      hoverOverlayBg: 'bg-[#3B2A1A] bg-opacity-50',
      tagBg: 'bg-brand-gold text-[#3B2A1A]',
      heartColor: 'text-[#3B2A1A] hover:bg-brand-gold hover:text-white',
      hoverBtnBorder: 'hover:bg-brand-gold hover:text-brand-black hover:border-brand-gold',
      dotActive: 'bg-brand-gold w-8',
      dotInactive: 'bg-[#D4C5AA] opacity-65 w-2',
      arrowBg: 'bg-[#3B2A1A] text-white hover:bg-brand-gold hover:text-[#3B2A1A]',
    },
    'diamond-designs': {
      cardBg: 'bg-white bg-opacity-[0.03]',
      border: 'border-white border-opacity-10 hover:border-brand-pinkAccent',
      textMain: 'text-white',
      textAccent: 'text-brand-pink',
      priceText: 'text-white',
      hoverOverlayBg: 'bg-brand-black bg-opacity-65',
      tagBg: 'bg-white text-brand-black',
      heartColor: 'text-white hover:bg-brand-pink hover:text-brand-black',
      hoverBtnBorder: 'hover:bg-brand-pink hover:text-brand-black hover:border-brand-pink',
      dotActive: 'bg-brand-pink w-8',
      dotInactive: 'bg-white bg-opacity-20 w-2',
      arrowBg: 'bg-white bg-opacity-10 text-white hover:bg-white hover:text-brand-black',
    },
  }[theme];

  return (
    <div className="relative group/slider w-full">
      {/* Control Buttons (Top Right of slider area / floating) */}
      <div className="absolute top-[-70px] right-2 flex items-center gap-3">
        <button
          onClick={() => scroll('left')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white border-opacity-10 shadow ${config.arrowBg}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white border-opacity-10 shadow ${config.arrowBg}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grid horizontal scroller */}
      <div
        ref={containerRef}
        onScroll={updateScrollProgress}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-6 no-scrollbar pb-8 pt-4 px-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-6 flex-shrink-0 w-[270px] md:w-[300px] snap-start"
          >
            {col.map((product, idx) => {
              const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
              const uniqueSizes = Array.from(new Set(product.variants.filter((v) => v.stock_qty > 0).map((v) => v.size)));
              const productImg = getProductImage(product, product.id);
              const originalPrice = product.base_price * 1.35;

              return (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                  className={`group cursor-pointer flex flex-col h-full rounded-2xl overflow-hidden border p-3.5 transition-all duration-500 hover:shadow-[0_15px_35px_rgba(0,0,0,0.12)] hover:-translate-y-1 ${config.cardBg} ${config.border}`}
                >
                  {/* Image Container */}
                  <div className="aspect-[4/5] bg-brand-grayLight overflow-hidden relative rounded-xl mb-4">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white bg-opacity-70 transition-colors z-10 ${config.heartColor}`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>

                    <img
                      src={productImg}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Quick Add Overlay on Hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10 ${config.hoverOverlayBg}`}>
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
                                className={`w-8 h-8 rounded-full border border-white border-opacity-40 bg-brand-black bg-opacity-70 text-white text-[10px] font-bold transition-all flex items-center justify-center ${config.hoverBtnBorder}`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest font-semibold px-4 py-2 text-center shadow-lg rounded">
                          View Details
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Rating details */}
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="flex text-amber-500">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </div>
                        <span className="text-[8px] text-brand-grayMed font-semibold font-dmsans">
                          (4.9)
                        </span>
                      </div>

                      <h4 className={`font-sora font-semibold text-xs md:text-sm leading-tight group-hover:text-brand-pink transition-colors truncate ${config.textMain}`}>
                        {product.name}
                      </h4>

                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className={`font-dmsans text-xs md:text-sm font-bold ${config.priceText}`}>
                          {formatPrice(product.base_price)}
                        </span>
                        <span className="font-dmsans text-[10px] text-brand-grayMed line-through opacity-65">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Color Dots */}
                    {uniqueColors.length > 0 && (
                      <div className="flex gap-1 mt-3 pt-3 border-t border-brand-grayLight border-opacity-20">
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
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Progress Dots Indicator (Bottom) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToPage(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentPage ? config.dotActive : config.dotInactive
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
