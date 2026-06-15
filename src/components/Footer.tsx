'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { apiFetch } from '@/lib/api';
import { Phone, MessageSquare, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// Custom inline SVG icons for brands because they are not exported by the current version of lucide-react
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

interface SiteSettings {
  whatsapp_number: string;
  phone_number: string;
  instagram_url: string;
  tiktok_url: string;
  facebook_url: string;
  twitter_url: string;
  terms_and_conditions: string;
}

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    apiFetch<SiteSettings>('/settings')
      .then((data) => setSettings(data))
      .catch((err) => console.error('Error fetching settings for footer:', err));
  }, []);

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-brand-black text-white pt-16 pb-8 border-t border-brand-grayDark">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Column 1: Logo & Tagline */}
        <div className="space-y-4">
          <Logo className="h-7" light={true} />
          <p className="font-dmsans text-xs text-brand-grayMed leading-relaxed max-w-xs">
            Nairobi&apos;s premium streetwear label. Merging high-fashion silhouettes with bold street energy. Born in Nairobi, built for the world.
          </p>
        </div>

        {/* Column 2: Shop Links */}
        <div>
          <h4 className="font-sora text-sm font-semibold tracking-wider uppercase mb-5 text-brand-white">
            Shop
          </h4>
          <ul className="space-y-3 font-dmsans text-xs text-brand-grayMed">
            <li>
              <button
                onClick={() => handleScrollToSection('new-wave')}
                className="hover:text-brand-pink transition-colors duration-300 flex items-center gap-1 group"
              >
                New Wave Drop
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-brand-pink">↓</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleScrollToSection('gold-designs')}
                className="hover:text-brand-gold transition-colors duration-300 flex items-center gap-1 group"
              >
                Gold Archive
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-brand-gold">↓</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleScrollToSection('diamond-designs')}
                className="hover:text-brand-grayMed hover:text-white transition-colors duration-300 flex items-center gap-1 group"
              >
                Diamond Origin
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">↓</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Information */}
        <div>
          <h4 className="font-sora text-sm font-semibold tracking-wider uppercase mb-5 text-brand-white">
            Information
          </h4>
          <ul className="space-y-3 font-dmsans text-xs text-brand-grayMed">
            <li>
              <Link href="/terms" className="hover:text-white transition-colors duration-300">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/terms#returns" className="hover:text-white transition-colors duration-300">
                Returns & Exchanges
              </Link>
            </li>
            <li>
              <Link href="/terms#shipping" className="hover:text-white transition-colors duration-300">
                Shipping Guide
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact & Socials */}
        <div className="space-y-6">
          <div>
            <h4 className="font-sora text-sm font-semibold tracking-wider uppercase mb-4 text-brand-white">
              Contact Us
            </h4>
            <ul className="space-y-3 font-dmsans text-xs text-brand-grayMed">
              {settings?.phone_number && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-pink" />
                  <a href={`tel:${settings.phone_number}`} className="hover:text-white transition-colors">
                    {settings.phone_number}
                  </a>
                </li>
              )}
              {settings?.whatsapp_number && (
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                  <a
                    href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    WhatsApp Chat <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-sora text-sm font-semibold tracking-wider uppercase mb-3 text-brand-white">
              Follow Us
            </h4>
            <div className="flex space-x-4">
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-brand-grayDark rounded hover:bg-brand-pinkAccent transition-all duration-300"
                  title="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-brand-grayDark rounded hover:bg-brand-pinkAccent transition-all duration-300"
                  title="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.twitter_url && (
                <a
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-brand-grayDark rounded hover:bg-brand-pinkAccent transition-all duration-300"
                  title="Twitter"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.tiktok_url && (
                <a
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-brand-grayDark rounded hover:bg-brand-pinkAccent transition-all duration-300 flex items-center justify-center font-bold text-[10px]"
                  title="TikTok"
                >
                  TT
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-brand-grayDark flex flex-col sm:flex-row items-center justify-between gap-4 font-dmsans text-[11px] text-brand-grayMed">
        <p>© {new Date().getFullYear()} Plottwear Co. All rights reserved.</p>
        <p className="tracking-widest uppercase">Nairobi Streetwear Division</p>
      </div>
    </footer>
  );
};
