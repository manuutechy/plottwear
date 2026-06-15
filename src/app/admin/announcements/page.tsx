'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Trash2, Edit2, Sparkles, X, Megaphone, Check, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// Zod validation Schema
const announcementSchema = z.object({
  text: z.string().min(5, 'Announcement string must be at least 5 characters'),
  sort_order: z.coerce.number().min(0),
  is_active: z.boolean().default(true)
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface Announcement {
  id: number;
  text: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminAnnouncements() {
  const { settings, refreshData } = useAdmin();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      text: '',
      sort_order: 0,
      is_active: true
    }
  });

  // Load and parse announcements from settings on mount/update
  useEffect(() => {
    if (settings && settings.announcements) {
      try {
        const parsed = JSON.parse(settings.announcements);
        if (Array.isArray(parsed)) {
          setAnnouncements(parsed.sort((a, b) => a.sort_order - b.sort_order));
        }
      } catch (err) {
        console.error('Failed to parse announcements JSON', err);
      }
    }
  }, [settings]);

  const saveAnnouncementsToDB = async (list: Announcement[]) => {
    try {
      // Serialize list to settings payload
      const updatedSettings = {
        ...settings,
        announcements: JSON.stringify(list)
      };

      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(updatedSettings)
      });
      refreshData();
    } catch (err) {
      toast.error('Failed to sync changes to database.');
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    reset({
      text: '',
      sort_order: announcements.length,
      is_active: true
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    reset({
      text: ann.text,
      sort_order: ann.sort_order,
      is_active: ann.is_active
    });
    setDrawerOpen(true);
  };

  const resetForm = () => {
    reset({ text: '', sort_order: 0, is_active: true });
    setEditingId(null);
    setDrawerOpen(false);
  };

  const onFormSubmit = async (data: any) => {
    setSubmitLoading(true);
    let updatedList = [...announcements];

    if (editingId) {
      // Update existing
      updatedList = updatedList.map(ann => ann.id === editingId ? {
        ...ann,
        text: data.text,
        sort_order: data.sort_order,
        is_active: data.is_active
      } : ann);
      toast.success('Announcement modified.');
    } else {
      // Create new
      const newAnn: Announcement = {
        id: Date.now(),
        text: data.text,
        sort_order: data.sort_order,
        is_active: data.is_active
      };
      updatedList.push(newAnn);
      toast.success('Announcement added.');
    }

    await saveAnnouncementsToDB(updatedList);
    resetForm();
    setSubmitLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const updatedList = announcements.filter(ann => ann.id !== id);
    toast.success('Announcement removed.');
    await saveAnnouncementsToDB(updatedList);
  };

  const handleToggleActive = async (ann: Announcement) => {
    const updatedList = announcements.map(a => a.id === ann.id ? {
      ...a,
      is_active: !a.is_active
    } : a);
    toast.success('Status toggled.');
    await saveAnnouncementsToDB(updatedList);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-neutral-700 font-dmsans">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Scrolling Marquee Announcements</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Configure marquee notifications shown dynamically on storefront header.</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 bg-[#D63F6F] text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Text
        </button>
      </div>

      {/* Announcements List Table */}
      <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-dmsans text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 bg-opacity-40 text-[10px] text-neutral-400 uppercase font-black">
                <th className="p-4">Sort order</th>
                <th className="p-4">Marquee Display text</th>
                <th className="p-4 text-center">Active status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-neutral-500 font-dmsans">
                    <div className="flex flex-col items-center gap-3">
                      <Megaphone className="w-12 h-12 text-neutral-300" />
                      <p className="font-bold text-neutral-800">No announcements posted</p>
                      <button onClick={handleOpenNew} className="text-[11px] text-[#D63F6F] font-bold hover:underline">Create Announcement Banner</button>
                    </div>
                  </td>
                </tr>
              ) : (
                announcements.map((ann) => (
                  <tr key={ann.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-bold text-[#D63F6F]">Priority #{ann.sort_order}</td>
                    <td className="p-4 font-semibold text-neutral-800">{ann.text}</td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ann.is_active}
                          onChange={() => handleToggleActive(ann)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#D63F6F]" />
                      </label>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ann)}
                          className="p-1 text-neutral-400 hover:text-[#D63F6F] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1 text-neutral-400 hover:text-red-650 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col justify-between"
            >
              <div className="p-6 border-b border-neutral-200 flex justify-between items-center shrink-0">
                <h4 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D63F6F]" /> {editingId ? 'Modify Marquee notification' : 'Deploy Marquee notification'}
                </h4>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 flex-grow overflow-y-auto space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Announcement Text *</label>
                  <textarea
                    {...register('text')}
                    placeholder="e.g. Free delivery on orders over KES 5,000"
                    rows={4}
                    className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F]"
                  />
                  {errors.text && <p className="text-red-500 text-[10px] font-semibold">{errors.text.message?.toString()}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Sort Order index</label>
                    <input
                      type="number"
                      {...register('sort_order')}
                      placeholder="0"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                    />
                  </div>

                  <div className="flex items-center gap-3 py-4">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register('is_active')}
                      className="rounded text-[#D63F6F] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="is_active" className="font-bold text-neutral-600 uppercase cursor-pointer">Active Marquee</label>
                  </div>
                </div>

                <button id="ann-submit-btn" type="submit" className="hidden" />
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
                  onClick={() => document.getElementById('ann-submit-btn')?.click()}
                  className="px-6 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : 'Deploy Text'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
