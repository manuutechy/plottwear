'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { 
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, ColumnDef, flexRender
} from '@tanstack/react-table';
import { 
  Search, Calendar, Download, ShoppingBag, 
  ArrowUpDown, Eye, ArrowLeftRight 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminOrders() {
  const { orders } = useAdmin();

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [sorting, setSorting] = useState<any[]>([]);

  const formatCents = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

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

  const statusTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Paid' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // TanStack Table columns
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => <span className="font-bold text-[#D63F6F]">#{row.original.id}</span>
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div>
            <p className="font-bold text-neutral-800 text-xs">{u?.name || 'Guest User'}</p>
            <p className="text-[10px] text-neutral-400">{u?.email || 'N/A'}</p>
          </div>
        );
      }
    },
    {
      id: 'phone',
      header: 'Phone Number',
      cell: ({ row }) => <span>{row.original.user?.phone || 'N/A'}</span>
    },
    {
      id: 'items_count',
      header: 'Items',
      cell: ({ row }) => <span>{row.original.items?.length || 0} items</span>
    },
    {
      accessorKey: 'total',
      header: 'Subtotal',
      cell: ({ row }) => <span>{formatCents(row.original.total - 35000)}</span> // Subtotal (Total minus delivery fee)
    },
    {
      id: 'delivery_method',
      header: 'Delivery',
      cell: () => <span>Standard Courier</span>
    },
    {
      id: 'delivery_fee',
      header: 'Fee',
      cell: () => <span>KES 350</span>
    },
    {
      accessorKey: 'total_invoice',
      header: 'Total KES',
      cell: ({ row }) => <span className="font-bold">{formatCents(row.original.total)}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${getStatusStyle(row.original.status)}`}>
          {row.original.status}
        </span>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="px-3 py-1 bg-neutral-100 hover:bg-[#D63F6F] hover:text-white rounded-md text-[10px] font-bold transition-all inline-block cursor-pointer"
          >
            View
          </Link>
        </div>
      )
    }
  ], []);

  // Filter orders locally
  const processedOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = 
        String(order.id).includes(searchQuery) ||
        (order.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.user?.phone || '').includes(searchQuery);

      const matchTab = activeTab === 'all' || order.status === activeTab;
      const matchDelivery = deliveryFilter === 'all'; // Standard courier fits all currently

      return matchSearch && matchTab && matchDelivery;
    });
  }, [orders, searchQuery, activeTab, deliveryFilter]);

  // Table instance
  const table = useReactTable({
    data: processedOrders,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  // CSV Exporter client-side
  const handleExportCSV = () => {
    if (processedOrders.length === 0) {
      toast.error('No orders to export.');
      return;
    }
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Phone', 'Items count', 'Total (KES)', 'Status', 'Date'];
    const rows = processedOrders.map(o => [
      o.id,
      o.user?.name || 'Guest User',
      o.user?.email || '',
      o.user?.phone || '',
      o.items?.length || 0,
      o.total / 100,
      o.status.toUpperCase(),
      new Date(o.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plottwear_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Orders Manager</h3>
          <p className="text-[10px] text-neutral-400 mt-1">Manage pipeline invoices and shipment state approvals.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-neutral-200 overflow-x-auto whitespace-nowrap scrollbar-none">
        {statusTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 font-bold transition-all text-[11px] uppercase tracking-wider cursor-pointer ${
              activeTab === tab.id 
                ? 'border-[#D63F6F] text-[#D63F6F]' 
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-neutral-200 border-opacity-70 p-4 rounded-xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Invoice ID, customer name, phone..."
            className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 pl-9 pr-4 text-xs text-neutral-850 focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="w-full md:w-40 bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 px-3 text-xs text-neutral-800 focus:outline-none cursor-pointer"
          >
            <option value="all">All Delivery Options</option>
            <option value="courier">Standard Courier</option>
          </select>
        </div>
      </div>

      {/* Table view */}
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
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag className="w-12 h-12 text-neutral-300" />
                      <p className="font-bold text-neutral-800">No matching transactions logged</p>
                      <p className="text-[11px] text-neutral-400">All storefront purchases will map to this interface.</p>
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

        {/* Pagination */}
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

    </div>
  );
}
