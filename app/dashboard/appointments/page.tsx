'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Calendar as CalendarIcon, Clock, Pencil, Trash2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RequireFeature } from '@/components/guards/RequireFeature';
import type { Appointment } from '@/lib/types';

function validateEgyptianPhone(phone: string) {
  return /^01[0-2,5]\d{8}$/.test(phone.replace(/\s/g, ''));
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'pending' as Appointment['status'],
    notes: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editTarget) {
      setForm({
        client_name: editTarget.client_name,
        client_phone: editTarget.client_phone || '',
        service: editTarget.service,
        date: editTarget.date,
        time: editTarget.time,
        status: editTarget.status,
        notes: editTarget.notes || '',
      });
      setOpen(true);
    }
  }, [editTarget]);

  const filterRows = (todayOnly: boolean) =>
    appointments.filter((a) => {
      const matchTab = !todayOnly || a.date === today;
      const matchSearch = !search ||
        a.client_name.toLowerCase().includes(search.toLowerCase()) ||
        a.service.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });

  const todayCount = appointments.filter((a) => a.date === today).length;

  const resetAndClose = () => {
    setOpen(false);
    setEditTarget(null);
    setForm({
      client_name: '', client_phone: '', service: '',
      date: today, time: '10:00', status: 'pending', notes: '',
    });
  };

  const handleSave = async () => {
    if (!form.client_name.trim()) return toast.error(lang === 'ar' ? 'أدخل اسم العميل' : 'Enter client name');
    if (form.client_phone && !validateEgyptianPhone(form.client_phone)) return toast.error(ta.invalidPhone);
    if (!form.service.trim()) return toast.error(lang === 'ar' ? 'أدخل الخدمة' : 'Enter service');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      service: form.service,
      date: form.date,
      time: form.time,
      status: form.status,
      notes: form.notes || null,
    };

    if (editTarget) {
      await supabase.from('appointments').update(payload).eq('id', editTarget.id);
      toast.success(ta.updateSuccess);
    } else {
      await supabase.from('appointments').insert({ ...payload, user_id: user.id });
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

      <Tabs defaultValue="today">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="today">
              <CalendarIcon className="me-1.5 size-3.5" />
              {ta.todayTab}
              {todayCount > 0 && <Badge className="ms-2">{todayCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all">{ta.allTab}</TabsTrigger>
          </TabsList>
          <div className="relative w-full max-w-xs">
            <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ta.searchPlaceholder} className="ps-9" />
          </div>
        </div>
        <TabsContent value="today" className="mt-4">{renderTable(filterRows(true))}</TabsContent>
        <TabsContent value="all" className="mt-4">{renderTable(filterRows(false))}</TabsContent>
      </Tabs>
    </div>
    </RequireFeature>
  );
}
