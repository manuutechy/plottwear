'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { 
  Settings, ShieldCheck, CreditCard, Truck, 
  Smartphone, Globe, MessageCircle, FileText, Trash2
} from 'lucide-react';

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
import { toast } from 'sonner';

type ActiveSettingsTab = 'payments' | 'delivery' | 'socials' | 'content';

export default function AdminSettings() {
  const { settings, refreshData } = useAdmin();
  const [activeTab, setActiveTab] = useState<ActiveSettingsTab>('payments');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Sync settings context to local state
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleValueChange = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const deliveryRates = useMemo<any[]>(() => {
    try {
      if (localSettings.delivery_rates) {
        const parsed = JSON.parse(localSettings.delivery_rates);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }, [localSettings.delivery_rates]);

  const updateDeliveryRates = (newRates: any[]) => {
    handleValueChange('delivery_rates', JSON.stringify(newRates));
  };

  const paymentMethods = useMemo<Record<string, boolean>>(() => {
    try {
      if (localSettings.payment_methods) {
        const parsed = JSON.parse(localSettings.payment_methods);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {
      cod: true,
      mpesa_till: true,
      stk_push: true
    };
  }, [localSettings.payment_methods]);

  const togglePaymentMethod = (method: string) => {
    const updated = {
      ...paymentMethods,
      [method]: !paymentMethods[method]
    };
    handleValueChange('payment_methods', JSON.stringify(updated));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(localSettings)
      });
      toast.success('Site configurations saved successfully.');
      refreshData();
    } catch (err) {
      toast.error('Failed to save configurations.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const tabs = [
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'socials', label: 'Socials', icon: MessageCircle },
    { id: 'content', label: 'Content', icon: FileText }
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-neutral-700 font-dmsans">
      
      {/* Upper header */}
      <div>
        <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Store settings</h3>
        <p className="text-[10px] text-neutral-400 mt-1">Configure payment gateway environment, delivery fees, and socials.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-neutral-200 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveSettingsTab)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-all text-[11px] uppercase tracking-wider cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-[#D63F6F] text-[#D63F6F]' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-750'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Config Form Panels */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* 1. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-4 animate-fadeIn">

              {/* Disbursement Mode Selector */}
              <div className="space-y-5">
                <div>
                  <h5 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Funds Disbursement Mode</h5>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Where will customer payments land? This is shown on the checkout page so customers know where to send money.</p>
                </div>

                {/* Mode cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'till', label: 'M-Pesa Till', desc: 'Buy Goods & Services till number' },
                    { value: 'paybill', label: 'Paybill', desc: 'Send Money → Pay Bill (business)' },
                    { value: 'bank_account', label: 'Bank Account', desc: 'Bank-linked Paybill + account no.' },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => handleValueChange('disbursement_mode', mode.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        (localSettings.disbursement_mode || 'till') === mode.value
                          ? 'border-[#D63F6F] bg-[#D63F6F]/5'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <span className={`font-bold text-[11px] block ${
                        (localSettings.disbursement_mode || 'till') === mode.value ? 'text-[#D63F6F]' : 'text-neutral-700'
                      }`}>{mode.label}</span>
                      <span className="text-[9px] text-neutral-400 leading-tight block mt-0.5">{mode.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Conditional fields */}
                {(localSettings.disbursement_mode || 'till') === 'till' && (
                  <div className="space-y-1 max-w-xs">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Till Number</label>
                    <input
                      type="text"
                      value={localSettings.mpesa_till_number || ''}
                      onChange={(e) => handleValueChange('mpesa_till_number', e.target.value)}
                      placeholder="e.g. 543210"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                    />
                    <p className="text-[9px] text-neutral-400">M-Pesa Buy Goods & Services till number</p>
                  </div>
                )}

                {(localSettings.disbursement_mode === 'paybill' || localSettings.disbursement_mode === 'bank_account') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">
                        {localSettings.disbursement_mode === 'bank_account' ? 'Bank Paybill Number' : 'Paybill Business Number'}
                      </label>
                      <input
                        type="text"
                        value={localSettings.mpesa_paybill_number || ''}
                        onChange={(e) => handleValueChange('mpesa_paybill_number', e.target.value)}
                        placeholder={localSettings.disbursement_mode === 'bank_account' ? 'e.g. 400200 (Equity), 522522 (KCB)' : 'e.g. 247247'}
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                      />
                      <p className="text-[9px] text-neutral-400">
                        {localSettings.disbursement_mode === 'bank_account'
                          ? "Your bank's M-Pesa Paybill number"
                          : 'The business Paybill number customers pay to'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">
                        {localSettings.disbursement_mode === 'bank_account' ? 'Bank Account Number' : 'Account Reference'}
                      </label>
                      <input
                        type="text"
                        value={localSettings.mpesa_paybill_account || ''}
                        onChange={(e) => handleValueChange('mpesa_paybill_account', e.target.value)}
                        placeholder={localSettings.disbursement_mode === 'bank_account' ? 'e.g. 0012345678' : 'e.g. PlottwearOrders'}
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                      />
                      <p className="text-[9px] text-neutral-400">
                        {localSettings.disbursement_mode === 'bank_account'
                          ? 'Your bank account number (the account reference)'
                          : 'Account reference customers enter when paying'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Payment Method Active Toggles */}
              <div className="space-y-4 border-t border-neutral-200 pt-6 mt-6 col-span-2">
                <h5 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Active Payment Channels</h5>
                <p className="text-[10px] text-neutral-400 mt-0.5">Toggle customer checkout payment options on/off storefront-wide.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Cash on Delivery */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <div>
                      <span className="font-bold text-neutral-700 text-xs block">Cash On Delivery</span>
                      <span className="text-[9px] text-neutral-400">Pay on receipt (COD)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod('cod')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        paymentMethods.cod ? 'bg-[#D63F6F] justify-end' : 'bg-neutral-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* M-Pesa Manual Till */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <div>
                      <span className="font-bold text-neutral-700 text-xs block">M-Pesa Manual Till</span>
                      <span className="text-[9px] text-neutral-400">Buy Goods Paybill route</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod('mpesa_till')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        paymentMethods.mpesa_till ? 'bg-[#D63F6F] justify-end' : 'bg-neutral-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* M-Pesa STK Push */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <div>
                      <span className="font-bold text-neutral-700 text-xs block">M-Pesa STK Push</span>
                      <span className="text-[9px] text-neutral-400">Express prompt push</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod('stk_push')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        paymentMethods.stk_push ? 'bg-[#D63F6F] justify-end' : 'bg-neutral-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DELIVERY TAB */}
        {activeTab === 'delivery' && (
          <div className="space-y-4 animate-fadeIn">
            <h4 className="font-sora font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-2">
              Delivery Config & notes
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Dynamic Delivery Rates Editor */}
              <div className="space-y-4 bg-white p-5 border border-neutral-200 rounded-xl shadow-sm">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                  <h5 className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider">Delivery Rate Options</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = deliveryRates.length > 0 ? Math.max(...deliveryRates.map((r: any) => r.id)) + 1 : 1;
                      updateDeliveryRates([...deliveryRates, { id: nextId, location: 'New Location Option', fee: 350 }]);
                    }}
                    className="px-2 py-1 text-[10px] bg-neutral-950 hover:bg-[#D63F6F] text-white rounded transition-colors font-bold uppercase cursor-pointer"
                  >
                    + Add Option
                  </button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {deliveryRates.map((rate: any, idx: number) => (
                    <div key={rate.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={rate.location}
                        onChange={(e) => {
                          const updated = [...deliveryRates];
                          updated[idx].location = e.target.value;
                          updateDeliveryRates(updated);
                        }}
                        placeholder="Location Area (e.g. Mombasa)"
                        className="flex-1 bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                      <div className="w-24 relative shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">KES</span>
                        <input
                          type="number"
                          value={rate.fee}
                          onChange={(e) => {
                            const updated = [...deliveryRates];
                            updated[idx].fee = Number(e.target.value);
                            updateDeliveryRates(updated);
                          }}
                          placeholder="350"
                          className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 pl-9 pr-2 text-xs focus:outline-none focus:border-[#D63F6F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateDeliveryRates(deliveryRates.filter((r: any) => r.id !== rate.id));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                        title="Delete Rate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {deliveryRates.length === 0 && (
                    <p className="text-[10px] text-neutral-400 text-center py-4">No custom delivery rates configured. Seeded defaults will be active.</p>
                  )}
                </div>
              </div>

              {/* Delivery textareas */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Customer Delivery Note card</label>
                  <textarea
                    value={localSettings.delivery_note || ''}
                    onChange={(e) => handleValueChange('delivery_note', e.target.value)}
                    placeholder="Shown on product pages: 'Standard courier delivery takes 24-48 hours within Nairobi COUNTY...'"
                    rows={4}
                    className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] placeholder-neutral-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SOCIALS TAB */}
        {activeTab === 'socials' && (
          <div className="space-y-4 animate-fadeIn">
            <h4 className="font-sora font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-2">
              Social Media redirects
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                  <InstagramIcon className="w-4 h-4 text-neutral-400" /> Instagram Link
                </label>
                <input
                  type="text"
                  value={localSettings.instagram_url || ''}
                  onChange={(e) => handleValueChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/plottwear"
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>

              {/* TikTok */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-neutral-400" /> TikTok Link
                </label>
                <input
                  type="text"
                  value={localSettings.tiktok_url || ''}
                  onChange={(e) => handleValueChange('tiktok_url', e.target.value)}
                  placeholder="https://tiktok.com/@plottwear"
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>

              {/* Facebook */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                  <FacebookIcon className="w-4 h-4 text-neutral-400" /> Facebook Link
                </label>
                <input
                  type="text"
                  value={localSettings.facebook_url || ''}
                  onChange={(e) => handleValueChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/plottwear"
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>

              {/* Twitter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                  <TwitterIcon className="w-4 h-4 text-neutral-400" /> Twitter/X Link
                </label>
                <input
                  type="text"
                  value={localSettings.twitter_url || ''}
                  onChange={(e) => handleValueChange('twitter_url', e.target.value)}
                  placeholder="https://x.com/plottwear"
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>

              {/* Whatsapp */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-neutral-400" /> WhatsApp Line
                </label>
                <input
                  type="text"
                  value={localSettings.whatsapp_number || ''}
                  onChange={(e) => handleValueChange('whatsapp_number', e.target.value)}
                  placeholder="e.g. 254700000000"
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>

              {/* Phone support */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-neutral-400" /> Support Phone Line
                </label>
                <input
                  type="text"
                  value={localSettings.phone_number || ''}
                  onChange={(e) => handleValueChange('phone_number', e.target.value)}
                  placeholder="e.g. 0700000000"
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-4 animate-fadeIn">
            <h4 className="font-sora font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-2">
              Site content configs
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Footer tagline text</label>
                <input
                  type="text"
                  value={localSettings.footer_tagline || ''}
                  onChange={(e) => handleValueChange('footer_tagline', e.target.value)}
                  placeholder="e.g. BORN IN NAIROBI. BUILT FOR THE STREETS."
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Terms and Conditions (large text)</label>
                <textarea
                  value={localSettings.terms_and_conditions || ''}
                  onChange={(e) => handleValueChange('terms_and_conditions', e.target.value)}
                  placeholder="Markdown terms specifications..."
                  rows={6}
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] placeholder-neutral-550"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save button footer */}
        <div className="flex justify-between items-center border-t border-neutral-100 pt-4 bg-neutral-50 -mx-6 -mb-6 p-6 rounded-b-xl">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted STK push parameters</span>
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className="bg-[#D63F6F] text-white hover:bg-neutral-800 font-sora font-extrabold text-xs uppercase tracking-widest py-3 px-8 rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {submitLoading ? 'Saving config...' : 'Save Configuration'}
          </button>
        </div>

      </form>

    </div>
  );
}
