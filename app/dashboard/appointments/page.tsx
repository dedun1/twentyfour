'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Clock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RequireFeature } from '@/components/guards/RequireFeature';
import { useClient } from '@/components/providers/ClientProvider';
import type { Appointment } from '@/lib/types';

/** US phone: 10 digits, or 11 digits with leading country code 1 */
function validateUSPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith('1')) return true;
  return false;
}

const STATUS_VARIANTS: Record<Appointment['status'], { className: string }> = {
  pending: { className: 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/20' },
  confirmed: { className: 'bg-green-500/15 text-green-500 hover:bg-green-500/20' },
  completed: { className: 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/20' },
  cancelled: { className: 'bg-red-500/15 text-red-500 hover:bg-red-500/20' },
};

export default function AppointmentsPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ta = t.appointments;
  const { clientId } = useClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    service: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'pending' as Appointment['status'],
    notes: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    const supabase = createClient();
    if (!clientId) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .order('time', { ascending: true });
    setAppointments(((data || []) as Appointment[]).map((row) => ({
      ...row,
      client_name: row.client_name ?? (row as Appointment & { customer_name?: string }).customer_name ?? '',
      client_phone: row.client_phone ?? (row as Appointment & { customer_phone?: string }).customer_phone ?? undefined,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  useEffect(() => {
    if (editTarget) {
      setForm({
        client_name: editTarget.client_name,
        client_phone: editTarget.client_phone || '',
        service: editTarget.service,
        cost: Number(editTarget.cost || 0),
        date: editTarget.date,
        time: editTarget.time,
        status: editTarget.status,
        notes: editTarget.notes || '',
      });
      setOpen(true);
    }
  }, [editTarget]);

  const filteredRows = appointments.filter((a) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 7)}-01`;

    const matchSearch = !search ||
      a.client_name.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchPreset =
      datePreset === 'all' ||
      (datePreset === 'today' && a.date === today) ||
      (datePreset === 'week' && a.date >= weekStartStr && a.date <= weekEndStr) ||
      (datePreset === 'month' && a.date >= monthStart && a.date <= today);
    const matchFrom = !fromDate || a.date >= fromDate;
    const matchTo = !toDate || a.date <= toDate;
    return matchSearch && matchStatus && matchPreset && matchFrom && matchTo;
  });

  const resetAndClose = () => {
    setOpen(false);
    setEditTarget(null);
    setForm({
      client_name: '', client_phone: '', service: '',
      cost: 0,
      date: today, time: '10:00', status: 'pending', notes: '',
    });
  };

  const handleSave = async () => {
    if (!form.client_name.trim()) return toast.error(lang === 'ar' ? 'أدخل اسم العميل' : 'Enter client name');
    if (form.client_phone && !validateUSPhone(form.client_phone)) return toast.error(ta.invalidPhone);
    if (!form.service.trim()) return toast.error(lang === 'ar' ? 'أدخل الخدمة' : 'Enter service');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      service: form.service,
      cost: Number(form.cost || 0),
      date: form.date,
      time: form.time,
      status: form.status,
      notes: form.notes || null,
    };

    if (editTarget) {
      await supabase.from('appointments').update(payload).eq('id', editTarget.id);
      toast.success(ta.updateSuccess);
    } else {
      await supabase.from('appointments').insert({
        ...payload,
        user_id: user.id,
        ...(clientId ? { client_id: clientId } : {}),
      });
      toast.success(ta.addSuccess);
    }
    resetAndClose();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ta.confirmDelete)) return;
    const supabase = createClient();
    await supabase.from('appointments').delete().eq('id', id);
    toast.success(ta.deleteSuccess);
    load();
  };

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    const supabase = createClient();
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const renderTable = (rows: Appointment[]) => {
    if (loading) return <Card><CardContent className="py-16 flex justify-center"><span className="spinner size-8" /></CardContent></Card>;
    if (rows.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <Clock className="size-10 opacity-40" />
            <p>{ta.noAppointments}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{ta.clientName}</TableHead>
              <TableHead className="hidden sm:table-cell">{ta.service}</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>{ta.date} / {ta.time}</TableHead>
              <TableHead>{ta.status}</TableHead>
              <TableHead className="text-end">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((appt) => (
              <TableRow key={appt.id}>
                <TableCell>
                  <p className="font-medium text-sm">{appt.client_name}</p>
                  {appt.client_phone && <p className="text-xs text-muted-foreground" dir="ltr">{appt.client_phone}</p>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{appt.service}</TableCell>
                <TableCell>${Number(appt.cost || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <p className="text-sm">{appt.date}</p>
                  <p className="text-xs text-muted-foreground">{appt.time}</p>
                </TableCell>
                <TableCell>
                  <Select value={appt.status} onValueChange={(v) => handleStatusChange(appt.id, v as Appointment['status'])}>
                    <SelectTrigger className={`w-[120px] h-7 text-xs ${STATUS_VARIANTS[appt.status].className}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{ta.pending}</SelectItem>
                      <SelectItem value="confirmed">{ta.confirmed}</SelectItem>
                      <SelectItem value="completed">{ta.completed}</SelectItem>
                      <SelectItem value="cancelled">{ta.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(appt)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(appt.id)} className="text-destructive">
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  return (
    <RequireFeature feature="appointments">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ta.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'إدارة مواعيد عملائك' : 'Manage your client bookings'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else setOpen(true); }}>
          <DialogTrigger render={<Button onClick={() => setEditTarget(null)}><Plus />{ta.addNew}</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTarget ? t.common.edit : ta.addNew}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">{ta.clientName}</Label>
                <Input id="name" value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{ta.clientPhone}</Label>
                <Input id="phone" value={form.client_phone} onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} placeholder={ta.phonePlaceholder} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">{ta.service}</Label>
                <Input id="service" value={form.service} onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))} placeholder={ta.servicePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">{lang === 'ar' ? 'تكلفة الحجز (USD)' : 'Booking Cost (USD)'}</Label>
                <Input id="cost" type="number" min="0" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: Number(e.target.value || 0) }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">{ta.date}</Label>
                  <Input id="date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{ta.time}</Label>
                  <Input id="time" type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{ta.status}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as Appointment['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{ta.pending}</SelectItem>
                    <SelectItem value="confirmed">{ta.confirmed}</SelectItem>
                    <SelectItem value="completed">{ta.completed}</SelectItem>
                    <SelectItem value="cancelled">{ta.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{ta.notes}</Label>
                <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder={ta.notesPlaceholder} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>{t.common.cancel}</Button>
              <Button onClick={handleSave}>{t.common.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'All Time'],
            ['today', 'Today'],
            ['week', 'This Week'],
            ['month', 'This Month'],
          ] as Array<['all' | 'today' | 'week' | 'month', string]>).map(([preset, label]) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              className={datePreset === preset ? 'border-amber-500 bg-amber-500/10 text-amber-500' : ''}
              onClick={() => setDatePreset(preset)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ta.searchPlaceholder} className="ps-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? 'all') as 'all' | Appointment['status'])}>
            <SelectTrigger><SelectValue placeholder={ta.status} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all}</SelectItem>
              <SelectItem value="pending">{ta.pending}</SelectItem>
              <SelectItem value="confirmed">{ta.confirmed}</SelectItem>
              <SelectItem value="cancelled">{ta.cancelled}</SelectItem>
              <SelectItem value="completed">{ta.completed}</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
        {renderTable(filteredRows)}
      </div>
    </div>
    </RequireFeature>
  );
}
