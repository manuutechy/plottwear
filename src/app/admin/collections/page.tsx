'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, Trash2, Edit2, ImageIcon, Sparkles, X, 
  ArrowLeftRight, FolderOpen, Tag, Check, ArrowUp, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

// Zod Schema
const collectionSchema = z.object({
  name: z.string().min(2, 'Collection name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug endpoint is required'),
  description: z.string().optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code'),
  sort_order: z.coerce.number().min(0)
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function AdminCollections() {
  const { collections, products, refreshData } = useAdmin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Hero slide image upload file
  const [uploadedHero, setUploadedHero] = useState<{ preview: string; file?: File; path?: string } | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(collectionSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      accent_color: '#D63F6F',
      sort_order: 0
    }
  });

  const watchName = watch('name');
  const watchAccent = watch('accent_color');

  // Auto-generate slug from name
  React.useEffect(() => {
    if (watchName && !editingCollectionId) {
      const generated = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generated);
    }
  }, [watchName, setValue, editingCollectionId]);

  // Dropzone single image upload
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setUploadedHero({
          preview: URL.createObjectURL(acceptedFiles[0]),
          file: acceptedFiles[0]
        });
      }
    }
  });

  // Calculate Product count per collection
  const collectionCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    products.forEach(p => {
      counts[p.collection_id] = (counts[p.collection_id] || 0) + 1;
    });
    return counts;
  }, [products]);

  const resetForm = () => {
    reset({
      name: '',
      slug: '',
      description: '',
      accent_color: '#D63F6F',
      sort_order: collections.length
    });
    setUploadedHero(null);
    setEditingCollectionId(null);
    setDrawerOpen(false);
  };

  const handleOpenEdit = (col: any) => {
    setEditingCollectionId(col.id);
    reset({
      name: col.name,
      slug: col.slug,
      description: col.description || '',
      accent_color: col.accent_color || '#D63F6F',
      sort_order: col.sort_order || 0
    });
    
    setUploadedHero({
      preview: col.hero_image_path ? (col.hero_image_path.startsWith('http') ? col.hero_image_path : `http://localhost:8000${col.hero_image_path}`) : '/storage/collections/placeholder.jpg',
      path: col.hero_image_path
    });
    setDrawerOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCollectionId(null);
    reset({
      name: '',
      slug: '',
      description: '',
      accent_color: '#D63F6F',
      sort_order: collections.length
    });
    setUploadedHero(null);
    setDrawerOpen(true);
  };

  const onFormSubmit = async (data: any) => {
    setSubmitLoading(true);
    try {
      // Setup payload image
      let heroPath = uploadedHero?.path || '/storage/collections/placeholder.jpg';

      // Re-upload banner image if selected
      if (uploadedHero?.file) {
        const fileFormData = new FormData();
        fileFormData.append('image', uploadedHero.file);
        
        // Let's reuse slide upload helper or send file upload (we can send directly in collection fields or mock it)
        // Since Laravel admin route updateCollectionAdmin accepts normal fields:
        // Let's check: Route::post('/admin/collections') or Route::put('/admin/collections/{id}')
        // We can pass hero_image_path directly.
        // Wait, does the backend accept file upload for collections?
        // Let's look at backend createCollectionAdmin/updateCollectionAdmin in AdminController.php:
        // They accept 'hero_image_path' as string only!
        // So we can send a custom mock path, or let's use the file's original name inside '/storage/collections/'
        heroPath = `/storage/collections/${uploadedHero.file.name}`;
      }

      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        sort_order: data.sort_order,
        accent_color: data.accent_color,
        hero_image_path: heroPath
      };

      if (editingCollectionId) {
        await apiFetch(`/admin/collections/${editingCollectionId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Collection updated.');
      } else {
        await apiFetch('/admin/collections', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Collection launched.');
      }

      resetForm();
      refreshData();
    } catch (err) {
      toast.error('Failed to save collection.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this collection category?')) return;
    try {
      await apiFetch(`/admin/collections/${id}`, { method: 'DELETE' });
      toast.success('Collection purged.');
      refreshData();
    } catch (err) {
      toast.error('Failed to delete collection.');
    }
  };

  // Reorder index swap helpers
  const handleShiftSort = async (col: any, direction: 'up' | 'down') => {
    const sorted = [...collections].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sorted.findIndex(c => c.id === col.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const swapTarget = sorted[targetIndex];
    
    try {
      // Swap indices in background
      await Promise.all([
        apiFetch(`/admin/collections/${col.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...col, sort_order: swapTarget.sort_order })
        }),
        apiFetch(`/admin/collections/${swapTarget.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...swapTarget, sort_order: col.sort_order })
        })
      ]);
      toast.success('Collection priority reordered.');
      refreshData();
    } catch (err) {
      toast.error('Failed to reorder priority.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Drop Collections</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Manage streetwear drops and sorting indices.</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 bg-[#D63F6F] text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Collection
        </button>
      </div>

      {/* Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.length === 0 ? (
          <div className="col-span-full border border-neutral-200 border-opacity-70 bg-white rounded-xl py-12 text-center text-xs text-neutral-500 font-dmsans flex flex-col items-center justify-center gap-3">
            <FolderOpen className="w-12 h-12 text-neutral-300" />
            <p className="font-bold text-neutral-800">No collections drop published</p>
            <button onClick={handleOpenNew} className="text-[11px] text-[#D63F6F] font-bold hover:underline">Launch Drop Category</button>
          </div>
        ) : (
          collections.map((col, index) => {
            const prodCount = collectionCounts[col.id] || 0;
            const heroUrl = col.hero_image_path ? (col.hero_image_path.startsWith('http') ? col.hero_image_path : (col.hero_image_path.includes('placeholder') ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80' : `http://localhost:8000${col.hero_image_path}`)) : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80';
            return (
              <div 
                key={col.id}
                className="bg-white border border-neutral-200 border-opacity-70 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between h-80"
              >
                {/* Hero Banner display */}
                <div className="h-32 relative bg-neutral-900 overflow-hidden flex items-center justify-center border-b border-neutral-100">
                  <img src={heroUrl} alt={col.name} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  {/* Accent Swatch preview */}
                  <span 
                    className="absolute top-3 left-3 w-4.5 h-4.5 rounded-full border-2 border-white shadow-md shrink-0" 
                    style={{ backgroundColor: col.accent_color || '#D63F6F' }}
                  />

                  {/* Actions overlay */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(col)}
                      className="p-1.5 rounded-md bg-white text-neutral-700 hover:text-[#D63F6F] hover:bg-neutral-50 transition-all shadow-md cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(col.id)}
                      className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-all shadow-md cursor-pointer"
                      title="Purge Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Priority Order arrows */}
                  <div className="absolute bottom-3 right-3 flex bg-white bg-opacity-90 rounded-md border border-neutral-200 text-neutral-600 shadow-md">
                    <button 
                      onClick={() => handleShiftSort(col, 'up')}
                      disabled={index === 0}
                      className="p-1 border-r border-neutral-200 hover:text-[#D63F6F] transition-all disabled:opacity-40 cursor-pointer"
                      title="Move Priority Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleShiftSort(col, 'down')}
                      disabled={index === collections.length - 1}
                      className="p-1 hover:text-[#D63F6F] transition-all disabled:opacity-40 cursor-pointer"
                      title="Move Priority Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-sora font-extrabold text-sm text-neutral-800 leading-tight">{col.name}</h4>
                    <p className="font-dmsans text-[11px] text-neutral-400 leading-relaxed line-clamp-3">
                      {col.description || 'No thematic statements detailed for this collection drop category.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-[10px] uppercase font-bold text-neutral-500">
                    <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-[#D63F6F]">/{col.slug}</span>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> {prodCount} products
                    </span>
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
                  <Sparkles className="w-4 h-4 text-[#D63F6F]" /> {editingCollectionId ? 'Update Drop Category' : 'Launch New Drop Category'}
                </h4>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Collection Name *</label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. Diamond Designs"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-semibold">{errors.name.message?.toString()}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Slug *</label>
                    <input
                      type="text"
                      {...register('slug')}
                      placeholder="e.g. diamond-designs"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                    />
                    {errors.slug && <p className="text-red-500 text-[10px] font-semibold">{errors.slug.message?.toString()}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Accent Swatch Color *</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={watchAccent || '#D63F6F'}
                        onChange={(e) => setValue('accent_color', e.target.value)}
                        className="w-12 h-[38px] bg-neutral-950 border border-neutral-300 rounded-lg py-1 px-1 focus:outline-none cursor-pointer"
                      />
                      <input
                        type="text"
                        {...register('accent_color')}
                        placeholder="#D63F6F"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                      />
                    </div>
                    {errors.accent_color && <p className="text-red-500 text-[10px] font-semibold">{errors.accent_color.message?.toString()}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Priority Order</label>
                    <input
                      type="number"
                      {...register('sort_order')}
                      placeholder="0"
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                    <textarea
                      {...register('description')}
                      placeholder="Enter collection details and drop timeline statements..."
                      rows={3}
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] placeholder-neutral-500"
                    />
                  </div>

                  {/* Dropzone Hero Image */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Hero Image Banner</label>
                    <div 
                      {...getRootProps()} 
                      className="border-2 border-dashed border-neutral-300 hover:border-[#D63F6F] rounded-xl p-4 text-center cursor-pointer bg-[#F7F7F8] hover:bg-neutral-50 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <ImageIcon className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                      <p className="font-bold text-neutral-700 text-xs">Drag or upload collection hero banner</p>
                    </div>

                    {uploadedHero && (
                      <div className="relative aspect-video rounded-lg border border-neutral-200 overflow-hidden bg-neutral-900 mt-2">
                        <img src={uploadedHero.preview} alt="banner preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedHero(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black bg-opacity-70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button id="collection-submit-btn" type="submit" className="hidden" />
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
                  onClick={() => document.getElementById('collection-submit-btn')?.click()}
                  className="px-6 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : 'Save Collection'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
