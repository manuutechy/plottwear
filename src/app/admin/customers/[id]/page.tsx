'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '../../AdminContext';
import { apiFetch } from '@/lib/api';
import { 
  ArrowLeft, Mail, Phone, Calendar, 
  MapPin, ShoppingBag, Edit2, Check, X, ShieldAlert 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { customers, orders, refreshData } = useAdmin();

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const formatCents = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      // Fetch details from backend to pull saved address relationships
      const res = await apiFetch<any>(`/admin/customers/${id}`);
      setCustomer(res);
      setEditName(res.name);
      setEditPhone(res.phone || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile details.');
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  // Filter orders matching this customer user_id
  const customerOrders = useMemo(() => {
    return orders.filter(o => String(o.user_id) === String(id));
  }, [orders, id]);

  // Calculate stats
  const totalSpent = useMemo(() => {
    return customerOrders
      .filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);
  }, [customerOrders]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    const actionText = customer.is_active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionText} this account profile?`)) return;
    try {
      await apiFetch(`/admin/customers/${customer.id}/toggle-active`, {
        method: 'PUT'
      });
      toast.success('Account state updated.');
      fetchCustomerDetails();
      refreshData();
    } catch (err) {
      toast.error('Failed to toggle active status.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName) {
      toast.error('Name field cannot be left blank.');
      return;
    }
    setEditLoading(true);
    try {
      await apiFetch(`/admin/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          phone: editPhone
        })
      });
      toast.success('Profile saved.');
      setIsEditing(false);
      fetchCustomerDetails();
      refreshData();
    } catch (err) {
      toast.error('Failed to update details.');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-green-500 bg-opacity-10 text-green-500 border border-green-500 border-opacity-20';
      case 'pending':
        return 'bg-neutral-500 bg-opacity-10 text-neutral-500 border border-neutral-500 border-opacity-20';
      case 'processing':
      case 'shipped':
        return 'bg-blue-500 bg-opacity-10 text-blue-500 border border-blue-500 border-opacity-20';
      case 'cancelled':
        return 'bg-red-500 bg-opacity-10 text-red-500 border border-red-500 border-opacity-20';
      default:
        return 'bg-neutral-600 bg-opacity-10 text-neutral-400 border border-neutral-600 border-opacity-20';
    }
  };

  if (loading || !customer) {
    return (
      <div className="text-center py-20 text-xs text-neutral-500">
        Loading customer details...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-neutral-700 font-dmsans">
      
      {/* Upper header */}
      <div className="flex justify-between items-center shrink-0">
        <button
          onClick={() => router.push('/admin/customers')}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-800 transition-all font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
      </div>

      {/* Grid of Profile specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Spans 1: Customer Profile details */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Profile Card */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#D63F6F] bg-opacity-10 text-[#D63F6F] flex items-center justify-center font-black text-lg border border-[#D63F6F] border-opacity-20">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded py-1 px-1.5 text-xs text-neutral-800 focus:outline-none"
                    />
                  </div>
                ) : (
                  <h4 className="font-sora font-extrabold text-sm text-neutral-800 leading-tight">{customer.name}</h4>
                )}
                <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <hr className="border-neutral-100" />

            <div className="space-y-2.5 font-semibold text-neutral-600">
              <p className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" /> {customer.email}
              </p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="bg-[#F7F7F8] border border-neutral-300 rounded py-0.5 px-1.5 text-[11px] text-neutral-800 focus:outline-none"
                  />
                ) : (
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{customer.phone || 'No phone registered'}</span>
                )}
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Profile Action buttons */}
            <div className="space-y-2 pt-1">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={editLoading}
                    className="flex items-center justify-center gap-1 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white rounded-lg font-bold shadow-md cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditName(customer.name); setEditPhone(customer.phone || ''); }}
                    className="flex items-center justify-center gap-1 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-lg font-bold text-neutral-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-lg font-bold text-neutral-700 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile details
                </button>
              )}

              <button
                onClick={handleToggleStatus}
                className={`w-full py-2 font-bold rounded-lg border tracking-wider uppercase transition-all cursor-pointer ${
                  customer.is_active
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                {customer.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>

          {/* Stats details summary */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-4">
            <h5 className="font-sora font-extrabold text-[9px] uppercase tracking-widest text-neutral-400">Buying index</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Total Purchases</span>
                <span className="font-sora font-black text-lg text-neutral-800 mt-1 block">{customerOrders.length}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Total Spent</span>
                <span className="font-sora font-black text-xs text-[#D63F6F] mt-1 block truncate">{formatCents(totalSpent)}</span>
              </div>
            </div>
          </div>

          {/* Addresses list */}
          <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-3">
            <h5 className="font-sora font-extrabold text-[9px] uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Saved Addresses
            </h5>
            <div className="space-y-2">
              {customer.addresses && customer.addresses.length > 0 ? (
                customer.addresses.map((addr: any, idx: number) => (
                  <div key={idx} className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 space-y-1 font-dmsans text-[11px]">
                    <p className="font-bold text-neutral-800">{addr.city || 'Nairobi County'}</p>
                    <p className="text-neutral-500 leading-tight">{addr.street_address || 'Address details...'}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full border border-dashed border-neutral-200 rounded-lg py-4 flex flex-col items-center justify-center text-neutral-500 text-[10px] gap-1 bg-neutral-50 bg-opacity-30">
                  <ShieldAlert className="w-4 h-4 text-neutral-400" />
                  <span>No delivery addresses saved.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Spans 2: Order history */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 border-opacity-70 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="font-sora font-bold text-xs text-neutral-800 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
            <ShoppingBag className="w-4 h-4 text-[#D63F6F]" /> Transaction History
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-dmsans text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 bg-opacity-40 text-[10px] text-neutral-400 uppercase font-black">
                  <th className="p-3">Order ID</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-center">Checkout Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-neutral-500 font-dmsans">
                      No purchase logs associated.
                    </td>
                  </tr>
                ) : (
                  customerOrders.map((o) => (
                    <tr key={o.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                      <td className="p-3 font-bold text-[#D63F6F]">#{o.id}</td>
                      <td className="p-3 text-center font-semibold">{o.items?.length || 0}</td>
                      <td className="p-3 text-center font-bold text-neutral-800">{formatCents(o.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${getStatusStyle(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-[#D63F6F] hover:text-white rounded-md text-[10px] font-bold transition-all inline-block cursor-pointer"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
