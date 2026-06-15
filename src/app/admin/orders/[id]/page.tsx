'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAdmin } from '../../AdminContext';
import { 
  ArrowLeft, Calendar, Mail, Phone, MapPin, 
  ShoppingCart, FileText, ShieldCheck, Tag, PenTool
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useParams();
  const { refreshData, orders } = useAdmin();

  // Local Order State loaded from ID
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Status Updater fields
  const [statusVal, setStatusVal] = useState('pending');
  const [adminNoteVal, setAdminNoteVal] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Retrieve order by filtering local context array
      const matched = orders.find(o => String(o.id) === String(id));
      
      if (matched) {
        setOrder(matched);
        setStatusVal(matched.status);
        // Load note safely from model response
        setAdminNoteVal((matched as any).admin_note || '');
      } else {
        // Fallback to direct GET fetch if not loaded in context list
        const res = await apiFetch<any>(`/admin/orders`);
        const item = res.find((o: any) => String(o.id) === String(id));
        if (item) {
          setOrder(item);
          setStatusVal(item.status);
          setAdminNoteVal(item.admin_note || '');
        } else {
          toast.error('Order not found.');
          router.push('/admin/orders');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve order specifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id, orders]);

  const handleUpdate = async () => {
    setUpdateLoading(true);
    try {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: statusVal,
          admin_note: adminNoteVal
        })
      });
      toast.success('Order status and notes updated.');
      refreshData();
    } catch (err) {
      toast.error('Failed to update order.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-500 bg-opacity-10 text-blue-500 border border-blue-500 border-opacity-20';
      case 'delivered':
        return 'bg-green-500 bg-opacity-10 text-green-500 border border-green-500 border-opacity-20';
      case 'pending':
        return 'bg-neutral-500 bg-opacity-10 text-neutral-500 border border-neutral-500 border-opacity-20';
      case 'processing':
        return 'bg-amber-500 bg-opacity-10 text-amber-500 border border-[#D63F6F] border-opacity-20';
      case 'shipped':
        return 'bg-orange-500 bg-opacity-10 text-orange-500 border border-orange-500 border-opacity-20';
      case 'cancelled':
        return 'bg-red-500 bg-opacity-10 text-red-500 border border-red-500 border-opacity-20';
      default:
        return 'bg-neutral-600 bg-opacity-10 text-neutral-400 border border-neutral-600 border-opacity-20';
    }
  };

  const formatCents = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

  if (loading || !order) {
    return (
      <div className="text-center py-20 text-xs text-neutral-500">
        Loading order detail invoice...
      </div>
    );
  }

  // Calculate totals
  const deliveryFee = order.delivery_fee || 35000; // default KES 350 in cents
  const discount = order.discount_amount || 0; // discount in cents
  const subtotal = order.total - deliveryFee + discount;

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-neutral-700 font-dmsans">
      
      {/* Upper header */}
      <div className="flex justify-between items-center shrink-0">
        <button
          onClick={() => router.push('/admin/orders')}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-800 transition-all font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns (Spans 2): Items & Invoicing details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order info card */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="font-sora font-extrabold text-sm text-neutral-800">Invoice Drop #{order.id}</h4>
            <p className="text-[10px] text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Posted: {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          {/* Items breakdown */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-sora font-bold text-xs text-neutral-800 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
              <ShoppingCart className="w-4 h-4 text-[#D63F6F]" /> Specification Details
            </h4>

            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => {
                const imgPath = item.product?.images?.find((i: any) => i.is_primary)?.image_path || item.product?.images?.[0]?.image_path;
                return (
                  <div key={idx} className="flex justify-between items-center border-b border-neutral-50 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                        {imgPath ? (
                          <img src={`http://localhost:8000${imgPath}`} alt="item" className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-neutral-800 leading-tight">{item.product?.name}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Size: <strong>{item.variant?.size || 'OS'}</strong> · Color: <strong>{item.variant?.color || 'N/A'}</strong> · Qty: <strong className="text-[#D63F6F]">x{item.qty}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-neutral-800">{formatCents(item.price * item.qty)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoicing summary */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-3 font-semibold text-neutral-600">
            <h4 className="font-sora font-bold text-xs text-neutral-800 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
              <FileText className="w-4 h-4 text-[#D63F6F]" /> Invoicing Summary
            </h4>

            <div className="flex justify-between text-[11px]">
              <span>Cart Subtotal</span>
              <span className="text-neutral-800">{formatCents(subtotal)}</span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span>Delivery Fee (Standard Courier)</span>
              <span className="text-neutral-800">{formatCents(deliveryFee)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-600">
                <span>Discount Applied ({order.coupon_code || 'PROMO'})</span>
                <span>-{formatCents(discount)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-neutral-100 pt-3 text-[#D63F6F] font-bold text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
              <span className="uppercase tracking-wider">Total Invoice Sum</span>
              <span className="font-sora font-black">{formatCents(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Right Column (Spans 1): Status editor, Customer details & Notes */}
        <div className="space-y-6">
          
          {/* Status Updater */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-sora font-bold text-xs text-neutral-800 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#D63F6F]" /> Pipeline Actions
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Update Pipeline status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 px-3 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Internal notes */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Internal Admin Notes</label>
                <textarea
                  value={adminNoteVal}
                  onChange={(e) => setAdminNoteVal(e.target.value)}
                  placeholder="e.g. Lipa na Mpesa confirmed. Package dispatched to Fargo courier..."
                  rows={4}
                  className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] placeholder-neutral-500"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateLoading}
                className="w-full py-2.5 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {updateLoading ? 'Updating parameters...' : 'Update Invoice Info'}
              </button>
            </div>
          </div>

          {/* Customer profile card */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-sora font-bold text-xs text-neutral-800 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
              <PenTool className="w-4 h-4 text-[#D63F6F]" /> Buyer Profile
            </h4>

            <div className="space-y-3 font-semibold text-neutral-600">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-[#D63F6F] bg-opacity-20 text-[#D63F6F] flex items-center justify-center font-black border border-neutral-100 shrink-0">
                  {order.user?.name ? order.user.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <p className="font-bold text-xs text-neutral-800 leading-tight">{order.user?.name || 'Guest Checkout'}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{order.user?.email}</p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="space-y-2 text-[10px] uppercase font-bold text-neutral-500">
                {order.user?.phone && (
                  <p className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-neutral-400" /> {order.user.phone}</p>
                )}
                <p className="flex items-start gap-1.5 normal-case font-normal text-neutral-600">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0" /> 
                  <span>Delivery location: <strong className="text-neutral-800 font-bold">{order.delivery_location || 'Nairobi County'}</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* MPESA Details */}
          {order.mpesa_transaction_id && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-2">
              <h5 className="text-[9px] uppercase tracking-widest font-black text-emerald-700">Mpesa Lipa Na Mpesa Confirmed</h5>
              <div className="font-dmsans text-[10px] text-emerald-800 space-y-0.5 font-bold">
                <p>Transaction ID: <span className="text-neutral-800">{order.mpesa_transaction_id}</span></p>
                <p>Payment Mode: <span className="text-neutral-800">Direct STK Push callback</span></p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
