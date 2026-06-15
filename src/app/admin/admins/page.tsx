'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Trash2, Key, Sparkles, UserSquare2, 
  Check, X, Mail, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

// Zod Schema
const adminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password required')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type AdminFormData = z.infer<typeof adminSchema>;

export default function AdminUsersList() {
  const { customers, refreshData } = useAdmin();
  const { user: currentUser } = useAuth();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Filter only admin accounts from the synced directory list
  const admins = useMemo(() => {
    return customers.filter(c => c.role === 'admin');
  }, [customers]);

  const resetForm = () => {
    reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setDrawerOpen(false);
  };

  const onFormSubmit = async (data: AdminFormData) => {
    setSubmitLoading(true);
    try {
      // POST to create customer with admin role
      await apiFetch('/admin/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: null,
          password: data.password,
          role: 'admin'
        })
      });
      toast.success('Admin account created successfully.');
      resetForm();
      refreshData();
    } catch (err) {
      toast.error('Failed to create admin profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: number, name: string) => {
    if (currentUser?.id === id) {
      toast.error('Self-deletion is protected.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${name} from administrators?`)) return;
    try {
      await apiFetch(`/admin/customers/${id}/toggle-active`, { method: 'PUT' }); // Deactivate
      toast.success(`${name} account deactivated.`);
      refreshData();
    } catch (err) {
      toast.error('Failed to remove admin.');
    }
  };

  const handleSendResetLink = (name: string, email: string) => {
    // Simulate sending reset link
    toast.success(`Password reset link dispatched to ${name} (${email})`);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-neutral-700 font-dmsans">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Console Administrators</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Manage system security keys and employee access rights.</p>
        </div>

        <button
          onClick={handleOpenNew => setDrawerOpen(true)}
          className="flex items-center gap-1.5 bg-[#D63F6F] text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-dmsans text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 bg-opacity-40 text-[10px] text-neutral-400 uppercase font-black">
                <th className="p-4">Admin Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Join Date</th>
                <th className="p-4 text-center">Authentication Link</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((adm) => {
                const isSelf = currentUser?.id === adm.id;
                return (
                  <tr 
                    key={adm.id} 
                    className={`border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors ${
                      isSelf ? 'bg-pink-500 bg-opacity-[0.02]' : ''
                    }`}
                  >
                    <td className="p-4 font-bold text-neutral-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#D63F6F] bg-opacity-10 text-[#D63F6F] flex items-center justify-center font-black text-[10px] border border-[#D63F6F] border-opacity-15">
                        {adm.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="leading-tight">{adm.name}</p>
                        {isSelf && <span className="text-[8px] text-[#D63F6F] font-black uppercase tracking-wider">Active Self</span>}
                      </div>
                    </td>
                    <td className="p-4 text-neutral-500">{adm.email}</td>
                    <td className="p-4">{new Date((adm as any).created_at || new Date()).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleSendResetLink(adm.name, adm.email)}
                        className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md text-[10px] font-bold text-neutral-600 transition-all cursor-pointer"
                      >
                        Reset Password
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      {!isSelf ? (
                        <button
                          onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 border border-neutral-200 hover:bg-red-50 bg-white rounded-md transition-all cursor-pointer"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-neutral-400 font-bold block pr-2">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Drawer */}
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
              className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col justify-between"
            >
              <div className="p-6 border-b border-neutral-200 flex justify-between items-center shrink-0">
                <h4 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D63F6F]" /> Add System Administrator
                </h4>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 flex-grow overflow-y-auto space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Admin Name *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F]"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-semibold">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. name@domain.com"
                    className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] font-semibold">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Security Password *</label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                  />
                  {errors.password && <p className="text-red-500 text-[10px] font-semibold">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Confirm Password *</label>
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-[10px] font-semibold">{errors.confirmPassword.message}</p>}
                </div>

                <button id="admin-submit-btn" type="submit" className="hidden" />
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
                  onClick={() => document.getElementById('admin-submit-btn')?.click()}
                  className="px-6 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Registering...' : 'Provision Admin'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
