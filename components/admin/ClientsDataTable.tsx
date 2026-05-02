'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown, ChevronLeft, ChevronRight, Pause, Play, Pencil, Trash2, Search,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { AdminClient, SubscriptionStatus } from '@/lib/types';

const STATUS_LIST: SubscriptionStatus[] = ['active', 'trial', 'pending_approval', 'paused', 'rejected', 'cancelled'];

const statusBadgeClass = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active': return 'bg-green-500/15 text-green-500';
    case 'trial': return 'bg-blue-500/15 text-blue-500';
    case 'pending_approval': return 'bg-yellow-500/15 text-yellow-500';
    case 'paused': return 'bg-gray-500/15 text-gray-400';
    case 'rejected': return 'bg-red-500/15 text-red-500';
    case 'cancelled': return 'bg-red-500/15 text-red-500';
  }
};

interface Props {
  data: AdminClient[];
  onEdit: (client: AdminClient) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: SubscriptionStatus) => void;
  loading: boolean;
}

export function ClientsDataTable({ data, onEdit, onDelete, onSetStatus, loading }: Props) {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ta = t.admin;

  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<AdminClient>[]>(() => [
    {
      id: 'business',
      accessorFn: (row) => row.business_name || row.full_name,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {ta.businessName}
          <ArrowUpDown className="ms-1.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.business_name || row.original.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.full_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 hidden h-8 md:inline-flex"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t.common.email}
          <ArrowUpDown className="ms-1.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="hidden text-xs text-muted-foreground md:inline">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'subscription_status',
      header: ta.subscriptionStatusLabel,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === 'all') return true;
        return row.getValue(columnId) === filterValue;
      },
      cell: ({ row }) => {
        const status = (row.original.subscription_status || 'pending_approval') as SubscriptionStatus;
        return (
          <Badge className={statusBadgeClass(status)}>
            {ta.subscriptionStatus[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'setup_fee',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 hidden h-8 lg:inline-flex"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {ta.setupFee}
          <ArrowUpDown className="ms-1.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="hidden text-sm lg:inline">
          {row.original.setup_fee ? `$${row.original.setup_fee}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 hidden h-8 xl:inline-flex"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {ta.joinDate}
          <ArrowUpDown className="ms-1.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="hidden text-xs text-muted-foreground xl:inline">
          {new Date(row.original.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-end">{t.common.actions}</div>,
      cell: ({ row }) => {
        const client = row.original;
        const status = (client.subscription_status || 'pending_approval') as SubscriptionStatus;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(client)} title={t.common.edit}>
              <Pencil />
            </Button>
            {status === 'active' ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onSetStatus(client.id, 'paused')}
                className="text-yellow-500"
                title={lang === 'ar' ? 'إيقاف' : 'Pause'}
              >
                <Pause />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onSetStatus(client.id, 'active')}
                className="text-green-500"
                title={lang === 'ar' ? 'تفعيل' : 'Activate'}
              >
                <Play />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(client.id)}
              className="text-destructive"
              title={t.common.delete}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    },
  ], [ta, t, lang, onEdit, onDelete, onSetStatus]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const q = String(filterValue).toLowerCase();
      const c = row.original;
      return Boolean(
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.business_name?.toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const statusFilter = (table.getColumn('subscription_status')?.getFilterValue() as string) ?? 'all';

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={ta.searchPlaceholder}
            className="ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => table.getColumn('subscription_status')?.setFilterValue(v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.all}</SelectItem>
            {STATUS_LIST.map((s) => (
              <SelectItem key={s} value={s}>{ta.subscriptionStatus[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {lang === 'ar' ? 'نتيجة' : 'results'}
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.id === 'email' && 'hidden md:table-cell',
                      header.id === 'setup_fee' && 'hidden lg:table-cell',
                      header.id === 'created_at' && 'hidden xl:table-cell',
                    )}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center">
                  <span className="spinner inline-block size-8" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                  {ta.noClients}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === 'email' && 'hidden md:table-cell',
                        cell.column.id === 'setup_fee' && 'hidden lg:table-cell',
                        cell.column.id === 'created_at' && 'hidden xl:table-cell',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {lang === 'ar'
              ? `صفحة ${table.getState().pagination.pageIndex + 1} من ${table.getPageCount()}`
              : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / {lang === 'ar' ? 'صفحة' : 'page'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
