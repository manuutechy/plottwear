'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, Trash2, Edit2, ImageIcon, Sparkles, Filter, Search, 
  ArrowUpDown, X, Star, AlertTriangle, Layers, Eye, Check
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, ColumnDef, flexRender
} from '@tanstack/react-table';

// Zod validation schemas
const variantSchema = z.object({
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  color: z.string().min(1, 'Colorway name required'),
  stock_qty: z.coerce.number().min(0, 'Stock cannot be negative'),
  price_override: z.coerce.number().nullable().optional()
});

const productSchema = z.object({
  name: z.string().min(3, 'Garment title must be at least 3 characters'),
  description: z.string().min(10, 'Description must detail the material properties'),
  collection_id: z.coerce.number().min(1, 'Please map to a drop category'),
  base_price: z.coerce.number().min(100, 'Base price must be at least KES 100'),
  is_active: z.boolean().default(true),
  sort_color: z.enum(['black', 'white', 'pink']).default('black'),
  variants: z.array(variantSchema).default([])
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const { products, collections, refreshData, submitLoading, setSubmitLoading } = useAdmin();

  // Navigation / Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Table Selection & Filter States
  const [sorting, setSorting] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Image Upload states
  const [uploadedFiles, setUploadedFiles] = useState<{ id?: number; preview: string; file?: File; isPrimary: boolean }[]>([]);

  const formatPrice = (kes: number) => `KES ${kes.toLocaleString()}`;
  const formatCents = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

  // React Hook Form Configuration
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      collection_id: 0,
      base_price: 2500,
      is_active: true,
      sort_color: 'black',
      variants: []
    }
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const watchVariants = watch('variants');

  // React Dropzone file handler
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 8,
    onDrop: (acceptedFiles) => {
      if (uploadedFiles.length + acceptedFiles.length > 8) {
        toast.error('Maximum of 8 images allowed per product.');
        return;
      }
      const newFiles = acceptedFiles.map((file, idx) => ({
        preview: URL.createObjectURL(file),
        file,
        isPrimary: uploadedFiles.length === 0 && idx === 0 // Default first to primary
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  });

  // Table Column definitions
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded text-[#D63F6F] focus:ring-0 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded text-[#D63F6F] focus:ring-0 cursor-pointer"
        />
      )
    },
    {
      accessorKey: 'images',
      header: 'Thumbnail',
      cell: ({ row }) => {
        const images = row.original.images || [];
        const primary = images.find((i: any) => i.is_primary) || images[0];
        return (
          <div className="w-12 h-12 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
            {primary ? (
              <img src={`http://localhost:8000${primary.image_path}`} alt="product" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => <span className="font-bold text-neutral-800 text-xs">{row.original.name}</span>
    },
    {
      accessorKey: 'collectionName',
      header: 'Collection',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
          {row.original.collectionName}
        </span>
      )
    },
    {
      accessorKey: 'base_price',
      header: 'Base Price',
      cell: ({ row }) => <span className="font-bold">{formatCents(row.original.base_price)}</span>
    },
    {
      id: 'variants_count',
      header: 'Variants',
      cell: ({ row }) => <span>{row.original.variants?.length || 0} Size Profiles</span>
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={row.original.is_active}
            onChange={() => handleToggleActive(row.original.id, row.original.is_active)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#D63F6F]" />
        </label>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1 text-neutral-500 hover:text-[#D63F6F] transition-colors cursor-pointer"
            title="Edit Specifications"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Purge Drop"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ], []);

  // Filter products locally before passing to table
  const processedProducts = useMemo(() => {
    return products.filter(p => {
      const matchCol = collectionFilter === 'all' || String(p.collection_id) === collectionFilter;
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && p.is_active) || 
        (statusFilter === 'inactive' && !p.is_active);
      return matchCol && matchStatus;
    });
  }, [products, collectionFilter, statusFilter]);

  // TanStack table instantiation
  const table = useReactTable({
    data: processedProducts,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id
  });

  // Toggle active/inactive status
  const handleToggleActive = async (productId: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...products.find(p => p.id === productId),
          is_active: !currentStatus
        })
      });
      toast.success('Product status updated successfully.');
      refreshData();
    } catch (err) {
      toast.error('Failed to toggle active status.');
    }
  };

  // Bulk actions
  const getSelectedIds = () => Object.keys(rowSelection).map(Number);

  const handleBulkStatus = async (status: boolean) => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map(id => {
          const prod = products.find(p => p.id === id);
          return apiFetch(`/admin/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...prod, is_active: status })
          });
        })
      );
      toast.success(`Selected products ${status ? 'activated' : 'deactivated'}.`);
      setRowSelection({});
      refreshData();
    } catch (err) {
      toast.error('Bulk operation failed.');
    }
  };

  const handleBulkDelete = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${ids.length} selected products?`)) return;
    try {
      await Promise.all(ids.map(id => apiFetch(`/admin/products/${id}`, { method: 'DELETE' })));
      toast.success('Selected products purged.');
      setRowSelection({});
      refreshData();
    } catch (err) {
      toast.error('Bulk delete failed.');
    }
  };

  // Open Edit Product Drawer
  const handleOpenEdit = (product: any) => {
    setEditingProductId(product.id);
    reset({
      name: product.name,
      description: product.description || '',
      collection_id: product.collection_id,
      base_price: product.base_price / 100,
      is_active: !!product.is_active,
      sort_color: product.sort_color || 'black',
      variants: product.variants?.map((v: any) => ({
        size: v.size,
        color: v.color,
        stock_qty: v.stock_qty,
        price_override: v.price_override ? v.price_override / 100 : null
      })) || []
    });

    // Handle existing images formatting
    const existingImgs = product.images?.map((i: any) => ({
      id: i.id,
      preview: `http://localhost:8000${i.image_path}`,
      isPrimary: !!i.is_primary
    })) || [];
    setUploadedFiles(existingImgs);
    setDrawerOpen(true);
  };

  const handleOpenNew = () => {
    setEditingProductId(null);
    reset({
      name: '',
      description: '',
      collection_id: collections[0]?.id || 0,
      base_price: 2500,
      is_active: true,
      sort_color: 'black',
      variants: []
    });
    setUploadedFiles([]);
    setDrawerOpen(true);
  };

  const resetProductForm = () => {
    setDrawerOpen(false);
    setEditingProductId(null);
    reset({
      name: '',
      description: '',
      collection_id: collections[0]?.id || 0,
      base_price: 2500,
      is_active: true,
      sort_color: 'black',
      variants: []
    });
    setUploadedFiles([]);
  };

  // Save / Update product
  const onFormSubmit = async (data: any) => {
    setSubmitLoading(true);
    try {
      let productId = editingProductId;
      
      // 1. Create or Update Core Product
      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify({
            collection_id: data.collection_id,
            name: data.name,
            description: data.description,
            base_price: data.base_price * 100,
            is_active: data.is_active,
            sort_color: data.sort_color
          })
        });
      } else {
        const newProd = await apiFetch<any>('/admin/products', {
          method: 'POST',
          body: JSON.stringify({
            collection_id: data.collection_id,
            name: data.name,
            description: data.description,
            base_price: data.base_price * 100,
            is_active: data.is_active,
            sort_color: data.sort_color
          })
        });
        productId = newProd.id;
      }

      if (!productId) throw new Error('Product catalog failure.');

      // 2. Handle Variants Creation (Sync arrays)
      if (editingProductId) {
        // Simple variant update is to recreate variants on change, but let's send individual variant post
        const currentProd = products.find(p => p.id === editingProductId);
        // Clear old variants
        if (currentProd?.variants) {
          await Promise.all(
            currentProd.variants.map(v => apiFetch(`/admin/variants/${v.id}`, { method: 'DELETE' }))
          );
        }
      }

      await Promise.all(
        data.variants.map((v: any) => apiFetch(`/admin/products/${productId}/variants`, {
          method: 'POST',
          body: JSON.stringify({
            size: v.size,
            color: v.color,
            stock_qty: v.stock_qty,
            price_override: v.price_override ? v.price_override * 100 : null
          })
        }))
      );

      // 3. Upload files to product
      const newImages = uploadedFiles.filter(img => img.file);
      if (newImages.length > 0) {
        await Promise.all(
          newImages.map(img => {
            const formData = new FormData();
            formData.append('image', img.file!);
            formData.append('is_primary', img.isPrimary ? '1' : '0');
            formData.append('sort_order', '0');
            return apiFetch(`/admin/products/${productId}/images`, {
              method: 'POST',
              body: formData
            });
          })
        );
      }

      toast.success(editingProductId ? 'Specifications updated.' : 'Garment launched.');
      setDrawerOpen(false);
      refreshData();
    } catch (err) {
      toast.error('Failed to save drop specs.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
      toast.success('Garment drop deleted.');
      refreshData();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  const markImagePrimary = async (idx: number, id?: number) => {
    setUploadedFiles(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === idx
    })));
    if (id) {
      try {
        await apiFetch(`/admin/images/${id}/primary`, { method: 'PUT' });
        toast.success('Primary image saved.');
      } catch (err) {
        toast.error('Failed to sync primary image.');
      }
    }
  };

  const deleteUploadedImage = async (idx: number, id?: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    if (id) {
      try {
        await apiFetch(`/admin/images/${id}`, { method: 'DELETE' });
        toast.success('Image deleted from database.');
      } catch (err) {
        toast.error('Failed to delete image.');
      }
    }
  };

  // Warn if duplicate sizes + colorway combination
  const duplicateWarning = useMemo(() => {
    const combos = new Set();
    for (const v of watchVariants) {
      const key = `${v.size}-${v.color.trim().toLowerCase()}`;
      if (combos.has(key)) return true;
      combos.add(key);
    }
    return false;
  }, [watchVariants]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Catalogue Drops</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Configure base items, size arrays, and gallery imagery.</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 bg-[#D63F6F] text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-neutral-200 border-opacity-70 p-4 rounded-xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search items by name..."
            className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 pl-9 pr-4 text-xs text-neutral-850 focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
          />
        </div>

        {/* Collection & Status filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="w-full md:w-40 bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 px-3 text-xs text-neutral-800 focus:outline-none cursor-pointer"
          >
            <option value="all">All Collections</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 px-3 text-xs text-neutral-800 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {getSelectedIds().length > 0 && (
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 flex items-center justify-between animate-fadeIn text-xs">
          <span className="font-semibold text-neutral-600">
            Selected: <strong className="text-neutral-800">{getSelectedIds().length} products</strong>
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkStatus(true)}
              className="px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded font-bold transition-all cursor-pointer"
            >
              Activate
            </button>
            <button 
              onClick={() => handleBulkStatus(false)}
              className="px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded font-bold transition-all cursor-pointer"
            >
              Deactivate
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-bold transition-all cursor-pointer"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* TanStack Table View */}
      <div className="bg-white border border-neutral-200 border-opacity-70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-dmsans text-[13px] border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-neutral-200 bg-neutral-50 bg-opacity-40 text-[10px] text-neutral-400 uppercase font-black">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-4 select-none">
                      {header.isPlaceholder ? null : (
                        <div 
                          className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="w-3 h-3 text-neutral-400" />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-xs text-neutral-500 font-dmsans">
                    {/* Inline SVG empty state */}
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="w-12 h-12 text-neutral-300" />
                      <p className="font-bold text-neutral-800">No products posted</p>
                      <p className="text-[11px] text-neutral-400">Add a new streetwear product to populate this list.</p>
                      <button onClick={handleOpenNew} className="text-[11px] text-[#D63F6F] font-bold hover:underline">Launch New Product</button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 text-neutral-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {table.getPageCount() > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-neutral-200 bg-neutral-50 bg-opacity-20 text-[11px]">
            <span className="text-neutral-500 font-semibold">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Slide-in Drawer using Framer Motion */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={resetProductForm}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-200 flex justify-between items-center shrink-0">
                <h4 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D63F6F]" /> {editingProductId ? 'Edit Garment Details' : 'Publish New Drop'}
                </h4>
                <button onClick={resetProductForm} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form 
                onSubmit={handleSubmit(onFormSubmit)} 
                className="p-6 flex-1 overflow-y-auto space-y-8 text-xs font-dmsans text-neutral-700"
              >
                {/* SECTION 1: Basic Info */}
                <div className="space-y-4">
                  <h5 className="font-sora font-black text-[9px] uppercase tracking-widest text-neutral-400">1. Basic specifications</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Garment Title *</label>
                      <input
                        type="text"
                        {...register('name')}
                        placeholder="Heavyweight Vector Tee"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                      />
                      {errors.name && <p className="text-red-500 text-[10px] font-semibold">{errors.name.message?.toString()}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Base Price (KES) *</label>
                      <input
                        type="number"
                        {...register('base_price')}
                        placeholder="2500"
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                      />
                      {errors.base_price && <p className="text-red-500 text-[10px] font-semibold">{errors.base_price.message?.toString()}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Drop Collection Category *</label>
                      <select
                        {...register('collection_id')}
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] cursor-pointer"
                      >
                        <option value={0}>Select a Collection</option>
                        {collections.map(col => (
                          <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                      </select>
                      {errors.collection_id && <p className="text-red-500 text-[10px] font-semibold">{errors.collection_id.message?.toString()}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Theme Sorting Color Accent *</label>
                      <select
                        {...register('sort_color')}
                        className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] cursor-pointer"
                      >
                        <option value="black">Black Accent</option>
                        <option value="white">White Accent</option>
                        <option value="pink">Pink Accent</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        {...register('is_active')}
                        className="rounded text-[#D63F6F] focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="is_active" className="font-bold text-neutral-600 uppercase cursor-pointer">Active in Catalogue</label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Description / Details *</label>
                    <textarea
                      {...register('description')}
                      placeholder="Crafted from premium 450gsm organic heavyweight cotton. Dropped shoulder outline..."
                      rows={3}
                      className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
                    />
                    {errors.description && <p className="text-red-500 text-[10px] font-semibold">{errors.description.message?.toString()}</p>}
                  </div>
                </div>

                {/* SECTION 2: Dynamic Variants */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-sora font-black text-[9px] uppercase tracking-widest text-neutral-400">2. Variant configuration</h5>
                    <button
                      type="button"
                      onClick={() => appendVariant({ size: 'M', color: 'Black', stock_qty: 10, price_override: null })}
                      className="text-[10px] font-bold text-[#D63F6F] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Array row
                    </button>
                  </div>

                  {duplicateWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg flex items-center gap-2 text-[10px] font-semibold">
                      <AlertCircle className="w-4 h-4" /> Warning: Duplicate size and color combinations detected.
                    </div>
                  )}

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {variantFields.map((field, idx) => (
                      <div key={field.id} className="grid grid-cols-4 gap-2 items-center bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 relative group/row">
                        <div>
                          <label className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5">Size</label>
                          <select
                            {...register(`variants.${idx}.size`)}
                            className="w-full bg-white border border-neutral-200 rounded py-1 px-1.5 focus:outline-none text-[11px] cursor-pointer"
                          >
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5">Colorway</label>
                          <input
                            type="text"
                            {...register(`variants.${idx}.color`)}
                            placeholder="e.g. Onyx"
                            className="w-full bg-white border border-neutral-200 rounded py-1 px-1.5 focus:outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5">Stock</label>
                          <input
                            type="number"
                            {...register(`variants.${idx}.stock_qty`)}
                            className="w-full bg-white border border-neutral-200 rounded py-1 px-1.5 focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5">Override</label>
                            <input
                              type="number"
                              {...register(`variants.${idx}.price_override`)}
                              placeholder="Optional"
                              className="w-full bg-white border border-neutral-200 rounded py-1 px-1.5 focus:outline-none text-[11px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 mt-3 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {variantFields.length === 0 && (
                      <p className="text-center py-4 text-neutral-400 text-[10px]">No variants configured. Click above to add size arrays.</p>
                    )}
                  </div>
                </div>

                {/* SECTION 3: Dropzone Multi Image Gallery */}
                <div className="space-y-4">
                  <h5 className="font-sora font-black text-[9px] uppercase tracking-widest text-neutral-400">3. Drop Gallery (Max 8 files)</h5>
                  
                  {/* Dropzone container */}
                  <div 
                    {...getRootProps()} 
                    className="border-2 border-dashed border-neutral-300 hover:border-[#D63F6F] rounded-xl p-6 text-center cursor-pointer bg-[#F7F7F8] hover:bg-neutral-50 transition-colors duration-300"
                  >
                    <input {...getInputProps()} />
                    <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="font-bold text-neutral-700 text-xs">Drag & drop slide assets, or select file</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Accepts PNG, JPG, WEBP. Max size 4MB.</p>
                  </div>

                  {/* Previews Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {uploadedFiles.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg border border-neutral-200 overflow-hidden bg-neutral-100 flex items-center justify-center shadow-sm">
                        <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                        
                        {/* Primary Badge */}
                        {img.isPrimary && (
                          <div className="absolute top-1 left-1 bg-[#D63F6F] text-white text-[7px] font-black uppercase px-1 py-0.5 rounded-sm flex items-center gap-0.5 shadow-md">
                            <Check className="w-2.5 h-2.5 stroke-[3px]" /> Primary
                          </div>
                        )}

                        {/* Hover commands overlay */}
                        <div className="absolute inset-0 bg-neutral-950 bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => markImagePrimary(idx, img.id)}
                              className="text-[8px] bg-white text-black font-extrabold px-1.5 py-0.5 rounded uppercase hover:bg-[#D63F6F] hover:text-white transition-colors cursor-pointer"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteUploadedImage(idx, img.id)}
                            className="text-[8px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hidden submit trigger */}
                <button id="drawer-submit-btn" type="submit" className="hidden" />
              </form>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => document.getElementById('drawer-submit-btn')?.click()}
                  className="px-6 py-2 bg-[#D63F6F] hover:bg-neutral-800 text-white font-sora font-extrabold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Saving specifications...' : 'Save Garment'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}
