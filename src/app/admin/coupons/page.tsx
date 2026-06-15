'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Trash2, Edit2, Sparkles, Key, AlertCircle, 
  Calendar, Percent, HelpCircle, Check, X, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Zod validation Schema
const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  discount_type: z.enum(['flat', 'percentage']),
  discount_value: z.coerce.number().min(1, 'Discount value must be at least 1'),
  min_order_amount: z.coerce.number().nullable().optional(),
  max_uses: z.coerce.number().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true)
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function AdminCoupons() {
  const { coupons, refreshData } = useAdmin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: null,
      max_uses: null,
      expires_at: '',
      is_active: true
    }
  });

  const watchDiscType = watch('discount_type');
  const watchCode = watch('code');

  const formatCents = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;
  const formatPrice = (kes: number) => `KES ${kes.toLocaleString()}`;

  const resetForm = () => {
    reset({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: null,
      max_uses: null,
      expires_at: '',
      is_active: true
    });
    setEditingCouponId(null);
    setDrawerOpen(false);
  };

  const handleOpenEdit = (coupon: any) => {
    setEditingCouponId(coupon.id);
    reset({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_type === 'flat' ? coupon.discount_value / 100 : coupon.discount_value,
      min_order_amount: coupon.min_order_amount ? coupon.min_order_amount / 100 : null,
      max_uses: coupon.max_uses || null,
      expires_at: coupon.expires_at ? coupon.expires_at.split(' ')[0] : '', // format YYYY-MM-DD
      is_active: !!coupon.is_active
    });
    setDrawerOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCouponId(null);
    reset({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: null,
      max_uses: null,
      expires_at: '',
      is_active: true
    });
    setDrawerOpen(true);
  };

  // Generate random 8-character code
  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PLOTT-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('code', result);
    toast.success(`Generated code: ${result}`);
  };

  const onFormSubmit = async (data: any) => {
    setSubmitLoading(true);
    try {
      const payload = {
        code: data.code.toUpperCase(),
        discount_type: data.discount_type,
        discount_value: data.discount_type === 'flat' ? data.discount_value * 100 : data.discount_value,
        min_order_amount: data.min_order_amount ? data.min_order_amount * 100 : null,
        max_uses: data.max_uses || null,
        expires_at: data.expires_at || null,
        is_active: data.is_active
      };

      if (editingCouponId) {
        await apiFetch(`/admin/coupons/${editingCouponId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Coupon updated successfully.');
      } else {
        await apiFetch('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Promo coupon code launched.');
      }

      resetForm();
      refreshData();
    } catch (err) {
      toast.error('Failed to save promo coupon.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo coupon?')) return;
    try {
      await apiFetch(`/admin/coupons/${id}`, { method: 'DELETE' });
      toast.success('Coupon deleted.');
      refreshData();
    } catch (err) {
      toast.error('Failed to delete coupon.');
    }
  };

  const handleToggleActive = async (coupon: any) => {
    try {
      await apiFetch(`/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...coupon,
          is_active: !coupon.is_active
        })
      });
      toast.success('Coupon status toggled.');
      refreshData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Check Expiry / Limit status
  const getCouponStatusBadge = (coupon: any) => {
    const isExpired = coupon.expires_at && new Date(coupon.expires_at).getTime() < new Date().getTime();
    const isMaxedOut = coupon.max_uses && coupon.used_count >= coupon.max_uses;

    if (isExpired) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-red-100 text-red-600 border border-red-200">
          Expired
        </span>
      );
    }
    if (isMaxedOut) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-600 border border-amber-200">
          Maxed Out
        </span>
      );
    }
    if (!coupon.is_active) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-400 border border-neutral-200">
          Disabled
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600 border border-emerald-200">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-neutral-700 font-dmsans">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Commerce Promo Codes</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Configure percentage or flat rate cart discounts.</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 bg-[#D63F6F] text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Coupons Table view */}
      <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-dmsans text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 bg-opacity-40 text-[10px] text-neutral-400 uppercase font-black">
                <th className="p-4">Promo Code</th>
                <th className="p-4">Discount Type</th>
                <th className="p-4">Value</th>
                <th className="p-4 text-center">Min Order</th>
                <th className="p-4">Limit progress</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4 text-center">Active</th>
                <th className="p-4 text-center">Badges</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-neutral-500 font-dmsans">
                    <div className="flex flex-col items-center gap-3">
                      <Key className="w-12 h-12 text-neutral-300" />
                      <p className="font-bold text-neutral-800">No active promotional codes</p>
                      <button onClick={handleOpenNew} className="text-[11px] text-[#D63F6F] font-bold hover:underline">Launch Promo Code</button>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const percent = coupon.max_uses ? Math.min(100, Math.round((coupon.used_count / coupon.max_uses) * 100)) : 0;
                  return (
                    <tr key={coupon.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-bold text-neutral-800 tracking-wide">{coupon.code}</td>
                      <td className="p-4 capitalize">{coupon.discount_type}</td>
                      <td className="p-4 font-semibold text-neutral-800">
                        {coupon.discount_type === 'flat' ? formatCents(coupon.discount_value) : `${coupon.discount_value}%`}
                      </td>
                      <td className="p-4 text-center font-bold">
                        {coupon.min_order_amount ? formatCents(coupon.min_order_amount) : 'None'}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 w-32">
                          <span className="text-[9px] text-neutral-400 font-bold block">
                            {coupon.used_count} / {coupon.max_uses || '∞'} Used
                          </span>
                          {coupon.max_uses ? (
                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                              <div className="h-full bg-[#D63F6F] transition-all" style={{ width: `${percent}%` }} />
                            </div>
                          ) : (
                            <span className="text-[9px] text-emerald-500 font-black">Unlimited use</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!coupon.is_active}
                            onChange={() => handleToggleActive(coupon)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#D63F6F]" />
                        </label>
                      </td>
                      <td className="p-4 text-center">
                        {getCouponStatusBadge(coupon)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(coupon)}
                            className="p-1 text-neutral-400 hover:text-[#D63F6F] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col justify-between"
            >
              <div className="p-6 border-b border-neutral-200 flex justify-between items-center shrink-0">
                <h4 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D63F6F]" /> {editingCouponId ? 'Edit Promo Coupon' : 'Create Promo Coupon'}
                </h4>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-4">
                  
                  {/* Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Coupon Code *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        {...register('code')}
                        placeholder="e.g. PLOTT25"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="px-3 bg-neutral-950 hover:bg-[#D63F6F] hover:text-white border border-neutral-300 text-neutral-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Generate
                      </button>
                    </div>
                    {errors.code && <p className="text-red-500 text-[10px] font-semibold">{errors.code.message?.toString()}</p>}
                  </div>

                  {/* Discount Type Cards */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Discount Type *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setValue('discount_type', 'percentage')}
                        className={`p-4 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                          watchDiscType === 'percentage' 
                            ? 'border-[#D63F6F] bg-pink-500 bg-opacity-5 text-[#D63F6F] font-bold' 
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                        }`}
                      >
                        <Percent className="w-6 h-6" />
                        <span>Percentage (%)</span>
                      </div>
                      <div 
                        onClick={() => setValue('discount_type', 'flat')}
                        className={`p-4 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                          watchDiscType === 'flat' 
                            ? 'border-[#D63F6F] bg-pink-500 bg-opacity-5 text-[#D63F6F] font-bold' 
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                        }`}
                      >
                        <Key className="w-6 h-6" />
                        <span>Flat Amount (KES)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">
                      Discount Value ({watchDiscType === 'percentage' ? '%' : 'KES'}) *
                    </label>
                    <input
                      type="number"
                      {...register('discount_value')}
                      placeholder={watchDiscType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F]"
                    />
                    {errors.discount_value && <p className="text-red-500 text-[10px] font-semibold">{errors.discount_value.message?.toString()}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Min Order Amount (KES)</label>
                      <input
                        type="number"
                        {...register('min_order_amount')}
                        placeholder="e.g. 2000"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Max Uses Limit</label>
                      <input
                        type="number"
                        {...register('max_uses')}
                        placeholder="e.g. 100"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        {...register('expires_at')}
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-3 py-4">
                      <input
                        type="checkbox"
                        id="is_active"
                        {...register('is_active')}
                        className="rounded text-[#D63F6F] focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="is_active" className="font-bold text-neutral-600 uppercase cursor-pointer">Active Promo</label>
                    </div>
                  </div>

                </div>

                <button id="coupon-submit-btn" type="submit" className="hidden" />
              </form>

              <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => document.getElementById('coupon-submit-btn')?.click()}
                  className="px-6 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Creating...' : 'Save Coupon'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
