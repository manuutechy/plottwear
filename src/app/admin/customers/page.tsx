'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { apiFetch } from '@/lib/api';
import { 
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, ColumnDef, flexRender
} from '@tanstack/react-table';
import { 
  Search, Filter, Calendar, Users, 
  ArrowUpDown, Eye, UserMinus, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminCustomers() {
  const { customers, orders, refreshData } = useAdmin();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<any[]>([]);

  const formatPrice = (kes: number) => `KES ${kes.toLocaleString()}`;
  const formatCents = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

  // Calculate total spent per customer from orders
  const customerSpend = useMemo(() => {
    const spend: Record<number, number> = {};
    orders.forEach(o => {
      if (o.user_id && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) {
        spend[o.user_id] = (spend[o.user_id] || 0) + o.total;
      }
    });
    return spend;
  }, [orders]);

  // Table columns
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'avatar',
      header: '',
      cell: ({ row }) => (
        <div className="w-8 h-8 rounded-full bg-[#D63F6F] bg-opacity-10 text-[#D63F6F] flex items-center justify-center font-bold text-xs border border-[#D63F6F] border-opacity-15 shrink-0">
          {row.original.name.charAt(0).toUpperCase()}
        </div>
      )
    },
    {
      accessorKey: 'name',
      header: 'Full Name',
      cell: ({ row }) => <span className="font-bold text-neutral-800 text-xs">{row.original.name}</span>
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
      cell: ({ row }) => <span className="text-neutral-500">{row.original.email}</span>
    },
    {
      accessorKey: 'phone',
      header: 'Phone Number',
      cell: ({ row }) => <span>{row.original.phone || 'N/A'}</span>
    },
    {
      accessorKey: 'orders_count',
      header: 'Orders Log',
      cell: ({ row }) => <span className="font-semibold">{row.original.orders_count || 0} orders</span>
    },
    {
      id: 'total_spent',
      header: 'Total Spent',
      cell: ({ row }) => {
        const spent = customerSpend[row.original.id] || 0;
        return <span className="font-bold text-neutral-800">{formatCents(spent)}</span>;
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Join Date',
      cell: ({ row }) => <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
    },
    {
      accessorKey: 'is_active',
      header: 'Access State',
      cell: ({ row }) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
          row.original.is_active
            ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
            : 'bg-red-100 text-red-600 border border-red-200'
        }`}>
          {row.original.is_active ? 'Active' : 'Banned'}
        </span>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/customers/${row.original.id}`}
            className="px-2.5 py-1 bg-neutral-100 hover:bg-[#D63F6F] hover:text-white rounded-md text-[10px] font-bold transition-all inline-block cursor-pointer"
          >
            View
          </Link>
          <button
            onClick={() => handleToggleCustomerActive(row.original.id, row.original.is_active)}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              row.original.is_active 
                ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200' 
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200'
            }`}
            title={row.original.is_active ? 'Deactivate Customer' : 'Activate Customer'}
          >
            {row.original.is_active ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
        </div>
      )
    }
  ], [customerSpend]);

  // Filter customers list
  const processedCustomers = useMemo(() => {
    return customers.filter(cust => {
      // Filter out admin accounts so this is purely customer listings
      if (cust.role !== 'customer') return false;

      const matchSearch = 
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cust.phone || '').includes(searchQuery);

      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && cust.is_active) ||
        (statusFilter === 'inactive' && !cust.is_active);

      return matchSearch && matchStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // TanStack Table instance
  const table = useReactTable({
    data: processedCustomers,
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

  const handleToggleCustomerActive = async (customerId: number, currentStatus: boolean) => {
    const actionText = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionText} this customer profile?`)) return;
    try {
      await apiFetch(`/admin/customers/${customerId}/toggle-active`, {
        method: 'PUT'
      });
      toast.success('Customer status updated successfully.');
      refreshData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      
      {/* Upper header */}
      <div>
        <h3 className="font-sora font-extrabold text-sm uppercase tracking-wider text-neutral-800">Customer Directory</h3>
        <p className="text-[10px] text-neutral-400 mt-1">Review user registration logs, orders frequency, and spent indices.</p>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-neutral-200 border-opacity-70 p-4 rounded-xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone contact..."
            className="w-full bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 pl-9 pr-4 text-xs text-neutral-850 focus:outline-none focus:border-[#D63F6F] focus:ring-1 focus:ring-[#D63F6F] placeholder-neutral-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-[#F7F7F8] border border-neutral-300 rounded-lg py-2 px-3 text-xs text-neutral-850 focus:outline-none cursor-pointer"
          >
            <option value="all">All States</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Banned Accounts</option>
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
                      <Users className="w-12 h-12 text-neutral-300" />
                      <p className="font-bold text-neutral-800">No matching customer logs</p>
                      <p className="text-[11px] text-neutral-400">All registered buyer profiles are mapped to this screen.</p>
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
