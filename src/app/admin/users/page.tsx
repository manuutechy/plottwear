'use client';

import React, { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { Plus, Users, Sparkles, UserCheck, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
  const { customers, refreshData } = useAdmin();
  const [creatingUser, setCreatingUser] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'customer'>('customer');

  const clearForm = () => {
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserPassword('');
    setUserRole('customer');
    setCreatingUser(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await apiFetch('/admin/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          phone: userPhone || null,
          password: userPassword,
          role: userRole
        })
      });
      alert('User account registered successfully.');
      refreshData();
      clearForm();
    } catch (err) {
      alert('Error creating user profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleCustomerActive = async (customerId: number) => {
    try {
      await apiFetch(`/admin/customers/${customerId}/toggle-active`, {
        method: 'PUT'
      });
      alert('Customer status toggled.');
      refreshData();
    } catch (err) {
      alert('Failed to toggle customer status.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and trigger */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-white">Staff & User Directory</h3>
          <p className="text-[10px] text-neutral-500 mt-1">Configure staff authorization, role access, and view customers.</p>
        </div>

        <button
          onClick={() => {
            if (creatingUser) clearForm();
            else setCreatingUser(true);
          }}
          className="flex items-center gap-1.5 bg-pink-500 text-black font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-white transition-all shadow-md cursor-pointer"
        >
          {creatingUser ? 'Close Form' : 'Add Staff Account'}
        </button>
      </div>

      {/* User Creation Form */}
      <AnimatePresence>
        {creatingUser && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateUser}
            className="bg-neutral-900 border border-white border-opacity-5 rounded-xl p-6 space-y-4 overflow-hidden"
          >
            <h4 className="font-sora font-bold text-xs uppercase tracking-wider text-pink-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Create User Profile
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-sora uppercase font-semibold text-neutral-400">User Name *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-neutral-950 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-pink-500 placeholder-neutral-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sora uppercase font-semibold text-neutral-400">Email Address *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. jane@domain.com"
                  className="w-full bg-neutral-950 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-pink-500 placeholder-neutral-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sora uppercase font-semibold text-neutral-400">Phone Contact Line</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="e.g. 254700000000"
                  className="w-full bg-neutral-950 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-pink-500 placeholder-neutral-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sora uppercase font-semibold text-neutral-400">Security Password *</label>
                <input
                  type="password"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-pink-500 placeholder-neutral-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-sora uppercase font-semibold text-neutral-400">Security Role *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-white border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="customer">Customer Access level</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-white border-opacity-10 rounded-lg text-xs text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-pink-500 hover:bg-white text-black font-sora font-extrabold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {submitLoading ? 'Registering...' : 'Deploy Account'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Directory Table */}
      <div className="overflow-x-auto border border-white border-opacity-5 rounded-xl bg-neutral-900 bg-opacity-20">
        <table className="w-full font-dmsans text-xs text-left text-white">
          <thead className="bg-neutral-900 bg-opacity-65 font-sora text-[9px] text-neutral-400 uppercase border-b border-white border-opacity-5">
            <tr>
              <th className="p-4">Profile Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role Access</th>
              <th className="p-4 text-center">Orders Log</th>
              <th className="p-4 text-center">Access State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white divide-opacity-5">
            {customers.map((cust) => (
              <tr key={cust.id} className="hover:bg-white hover:bg-opacity-5 transition-colors">
                <td className="p-4 font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-pink-500 bg-opacity-15 text-pink-400 flex items-center justify-center text-[10px] font-black border border-pink-500 border-opacity-10">
                    {cust.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{cust.name}</span>
                </td>
                <td className="p-4 text-neutral-400">{cust.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    cust.role === 'admin' 
                      ? 'bg-purple-500 bg-opacity-20 text-purple-400 border border-purple-500 border-opacity-35' 
                      : 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-35'
                  }`}>
                    {cust.role}
                  </span>
                </td>
                <td className="p-4 text-center font-bold text-white">{cust.orders_count || 0} drops</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleToggleCustomerActive(cust.id)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider border cursor-pointer ${
                      cust.is_active
                        ? 'bg-emerald-600 bg-opacity-20 text-emerald-400 border-emerald-600 border-opacity-40 hover:bg-red-500 hover:text-black hover:border-red-500'
                        : 'bg-red-600 bg-opacity-20 text-red-400 border-red-600 border-opacity-40 hover:bg-emerald-500 hover:text-black hover:border-emerald-500'
                    }`}
                  >
                    {cust.is_active ? 'Active' : 'Banned'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
