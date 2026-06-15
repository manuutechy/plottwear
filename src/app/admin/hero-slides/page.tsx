'use client';

import React, { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, Trash2, Edit2, ImageIcon, Sparkles, X, 
  ArrowUp, ArrowDown, Check, Eye
} from 'lucide-react';
import { toast } from 'sonner';

// Zod validation Schema
const slideSchema = z.object({
  title: z.string().min(2, 'Slide title is required'),
  subtitle: z.string().optional(),
  cta_label: z.string().min(1, 'CTA label required'),
  cta_link: z.string().min(1, 'CTA redirection endpoint required'),
  sort_order: z.coerce.number().min(0),
  is_active: z.boolean().default(true)
});

type SlideFormData = z.infer<typeof slideSchema>;

export default function AdminHeroSlides() {
  const { slides, refreshData } = useAdmin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // File Upload states
  const [uploadedSlide, setUploadedSlide] = useState<{ preview: string; file?: File; path?: string } | null>(null);

  // Preview Overlay toggle
  const [showLivePreview, setShowLivePreview] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(slideSchema) as any,
    defaultValues: {
      title: '',
      subtitle: '',
      cta_label: 'Shop Now',
      cta_link: '',
      sort_order: 0,
      is_active: true
    }
  });

  const watchTitle = watch('title');
  const watchSubtitle = watch('subtitle');
  const watchCtaLabel = watch('cta_label');

  // Single Image Dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setUploadedSlide({
          preview: URL.createObjectURL(acceptedFiles[0]),
          file: acceptedFiles[0]
        });
      }
    }
  });

  const resetForm = () => {
    reset({
      title: '',
      subtitle: '',
      cta_label: 'Shop Now',
      cta_link: '',
      sort_order: slides.length,
      is_active: true
    });
    setUploadedSlide(null);
    setEditingSlideId(null);
    setShowLivePreview(false);
    setDrawerOpen(false);
  };

  const handleOpenEdit = (slide: any) => {
    setEditingSlideId(slide.id);
    reset({
      title: slide.title,
      subtitle: slide.subtitle || '',
      cta_label: slide.cta_label || 'Shop Now',
      cta_link: slide.cta_link || '',
      sort_order: slide.sort_order || 0,
      is_active: !!slide.is_active
    });
    setUploadedSlide({
      preview: `http://localhost:8000${slide.image_path}`,
      path: slide.image_path
    });
    setDrawerOpen(true);
  };

  const handleOpenNew = () => {
    setEditingSlideId(null);
    reset({
      title: '',
      subtitle: '',
      cta_label: 'Shop Now',
      cta_link: '',
      sort_order: slides.length,
      is_active: true
    });
    setUploadedSlide(null);
    setDrawerOpen(true);
  };

  const onFormSubmit = async (data: any) => {
    if (!uploadedSlide) {
      toast.error('A slide background banner image is required.');
      return;
    }
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('subtitle', data.subtitle || '');
      formData.append('cta_label', data.cta_label);
      formData.append('cta_link', data.cta_link);
      formData.append('sort_order', String(data.sort_order));
      formData.append('is_active', data.is_active ? '1' : '0');

      if (uploadedSlide.file) {
        formData.append('image', uploadedSlide.file);
      }

      if (editingSlideId) {
        // Larvel route updateSlide uses POST for uploads
        await apiFetch(`/admin/hero-slides/${editingSlideId}`, {
          method: 'POST',
          body: formData
        });
        toast.success('Hero banner slide updated.');
      } else {
        await apiFetch('/admin/hero-slides', {
          method: 'POST',
          body: formData
        });
        toast.success('Hero banner slide published.');
      }

      resetForm();
      refreshData();
    } catch (err) {
      toast.error('Failed to save slide.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this slider banner?')) return;
    try {
      await apiFetch(`/admin/hero-slides/${id}`, { method: 'DELETE' });
      toast.success('Slide banner deleted.');
      refreshData();
    } catch (err) {
      toast.error('Failed to delete slide.');
    }
  };

  const handleToggleActive = async (slide: any) => {
    try {
      const formData = new FormData();
      formData.append('title', slide.title);
      formData.append('cta_label', slide.cta_label);
      formData.append('cta_link', slide.cta_link);
      formData.append('sort_order', String(slide.sort_order));
      formData.append('is_active', slide.is_active ? '0' : '1'); // Toggle

      await apiFetch(`/admin/hero-slides/${slide.id}`, {
        method: 'POST',
        body: formData
      });
      toast.success('Status toggled.');
      refreshData();
    } catch (err) {
      toast.error('Failed to toggle active status.');
    }
  };

  const handleShiftSort = async (slide: any, direction: 'up' | 'down') => {
    const sorted = [...slides].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sorted.findIndex(s => s.id === slide.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const swapTarget = sorted[targetIndex];

    try {
      // Re-save sort parameters in background
      const fd1 = new FormData();
      fd1.append('title', slide.title);
      fd1.append('cta_label', slide.cta_label);
      fd1.append('cta_link', slide.cta_link);
      fd1.append('is_active', slide.is_active ? '1' : '0');
      fd1.append('sort_order', String(swapTarget.sort_order));

      const fd2 = new FormData();
      fd2.append('title', swapTarget.title);
      fd2.append('cta_label', swapTarget.cta_label);
      fd2.append('cta_link', swapTarget.cta_link);
      fd2.append('is_active', swapTarget.is_active ? '1' : '0');
      fd2.append('sort_order', String(slide.sort_order));

      await Promise.all([
        apiFetch(`/admin/hero-slides/${slide.id}`, { method: 'POST', body: fd1 }),
        apiFetch(`/admin/hero-slides/${swapTarget.id}`, { method: 'POST', body: fd2 })
      ]);

      toast.success('Slide reordered.');
      refreshData();
    } catch (err) {
      toast.error('Failed to reorder slides.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Hero Slider Slides</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Configure promotional homepage background slides.</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 bg-[#D63F6F] text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {/* Slide cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slides.length === 0 ? (
          <div className="col-span-full border border-neutral-200 border-opacity-70 bg-white rounded-xl py-12 text-center text-xs text-neutral-500 font-dmsans flex flex-col items-center justify-center gap-3">
            <ImageIcon className="w-12 h-12 text-neutral-300" />
            <p className="font-bold text-neutral-800">No promo slides configured</p>
            <button onClick={handleOpenNew} className="text-[11px] text-[#D63F6F] font-bold hover:underline">Deploy Slide Banner</button>
          </div>
        ) : (
          slides.map((slide, index) => {
            const heroUrl = slide.image_path ? `http://localhost:8000${slide.image_path}` : '/storage/collections/placeholder.jpg';
            return (
              <div 
                key={slide.id}
                className="bg-white border border-neutral-200 border-opacity-70 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between h-80"
              >
                {/* Image background & Overlay */}
                <div className="h-44 relative bg-neutral-900 overflow-hidden flex items-center justify-center border-b border-neutral-100">
                  <img src={heroUrl} alt={slide.title} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />

                  {/* Actions overlay */}
                  <div className="absolute top-3 right-3 flex gap-2 z-20">
                    <button
                      onClick={() => handleOpenEdit(slide)}
                      className="p-1.5 rounded-md bg-white text-neutral-700 hover:text-[#D63F6F] hover:bg-neutral-50 transition-all shadow-md cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-all shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Priority Order buttons */}
                  <div className="absolute bottom-3 right-3 flex bg-white bg-opacity-90 rounded-md border border-neutral-200 text-neutral-600 shadow-md z-20">
                    <button 
                      onClick={() => handleShiftSort(slide, 'up')}
                      disabled={index === 0}
                      className="p-1 border-r border-neutral-200 hover:text-[#D63F6F] transition-all disabled:opacity-40 cursor-pointer"
                      title="Move Priority Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleShiftSort(slide, 'down')}
                      disabled={index === slides.length - 1}
                      className="p-1 hover:text-[#D63F6F] transition-all disabled:opacity-40 cursor-pointer"
                      title="Move Priority Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Active Slide Text Preview */}
                  <div className="absolute bottom-3 left-3 text-white max-w-xs space-y-1">
                    <p className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest leading-none">{slide.subtitle}</p>
                    <h4 className="font-sora font-extrabold text-xs tracking-tight leading-tight">{slide.title}</h4>
                  </div>
                </div>

                {/* Details bottom bar */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-neutral-500">
                    <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-neutral-600">CTA: {slide.cta_label}</span>
                    <span className="truncate max-w-[120px] text-neutral-400">URI: {slide.cta_link}</span>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-[10px] uppercase font-bold text-neutral-500 mt-2">
                    <div className="flex items-center gap-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!slide.is_active}
                          onChange={() => handleToggleActive(slide)}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-3.5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-neutral-350 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-[#D63F6F]" />
                      </label>
                      <span className="ml-1 text-[9px]">Active Banner</span>
                    </div>

                    <span>Priority: #{slide.sort_order}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
                  <Sparkles className="w-4 h-4 text-[#D63F6F]" /> {editingSlideId ? 'Update Promo Slide' : 'Publish Promo Slide'}
                </h4>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="p-6 flex-grow overflow-y-auto space-y-6">
                
                {/* Preview layout toggle */}
                <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="font-bold text-neutral-700 flex items-center gap-1.5"><Eye className="w-4 h-4 text-[#D63F6F]" /> Live Preview Simulator</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!uploadedSlide) toast.error('Please upload a slide background image first.');
                      else setShowLivePreview(!showLivePreview);
                    }}
                    className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded font-bold text-[10px] text-neutral-700 cursor-pointer"
                  >
                    {showLivePreview ? 'Hide Overlay' : 'View Overlay'}
                  </button>
                </div>

                {/* Show Preview mock */}
                {showLivePreview && uploadedSlide && (
                  <div className="relative aspect-video rounded-xl border border-neutral-200 overflow-hidden bg-neutral-900 flex items-center justify-start p-6 text-white shadow-inner">
                    <img src={uploadedSlide.preview} alt="mock" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="relative space-y-2 max-w-[280px]">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#D63F6F] leading-none animate-pulse">{watchSubtitle || ' Nairobi Drop Archive'}</p>
                      <h3 className="font-sora font-extrabold text-lg tracking-tight leading-tight uppercase">{watchTitle || 'Plott Masterpiece'}</h3>
                      <button type="button" className="px-4 py-1.5 bg-[#D63F6F] text-white rounded font-bold text-[9px] uppercase tracking-wider shadow-md">{watchCtaLabel || 'Shop Now'}</button>
                    </div>
                  </div>
                )}

                <form id="slide-submit-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Slide Title *</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="e.g. THE NEW WAVE"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                    />
                    {errors.title && <p className="text-red-500 text-[10px] font-semibold">{errors.title.message?.toString()}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Subtitle Details</label>
                    <input
                      type="text"
                      {...register('subtitle')}
                      placeholder="e.g. Nairobi Heavyweight Vector Illustration Drop"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] placeholder-neutral-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">CTA Button Label *</label>
                      <input
                        type="text"
                        {...register('cta_label')}
                        placeholder="Shop Now"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                      {errors.cta_label && <p className="text-red-500 text-[10px] font-semibold">{errors.cta_label.message?.toString()}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">CTA Redirect Link *</label>
                      <input
                        type="text"
                        {...register('cta_link')}
                        placeholder="e.g. #new-wave or /shop"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                      {errors.cta_link && <p className="text-red-500 text-[10px] font-semibold">{errors.cta_link.message?.toString()}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Sort Order Index</label>
                      <input
                        type="number"
                        {...register('sort_order')}
                        placeholder="0"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        {...register('is_active')}
                        className="rounded text-[#D63F6F] focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="is_active" className="font-bold text-neutral-600 uppercase cursor-pointer">Active slide</label>
                    </div>
                  </div>

                  {/* Dropzone background image */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Background Image *</label>
                    <div 
                      {...getRootProps()} 
                      className="border-2 border-dashed border-neutral-300 hover:border-[#D63F6F] rounded-xl p-4 text-center cursor-pointer bg-[#F7F7F8] hover:bg-neutral-50 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <ImageIcon className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                      <p className="font-bold text-neutral-700 text-xs">Drag or upload landscape slide banner</p>
                      <p className="text-[9px] text-neutral-500">Min dimensions: 1440x800px recommended.</p>
                    </div>

                    {uploadedSlide && !showLivePreview && (
                      <div className="relative aspect-video rounded-lg border border-neutral-200 overflow-hidden bg-neutral-900 mt-2">
                        <img src={uploadedSlide.preview} alt="slide preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedSlide(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black bg-opacity-70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>

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
                  onClick={() => document.getElementById('slide-submit-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                  className="px-6 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : 'Save Slide'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
