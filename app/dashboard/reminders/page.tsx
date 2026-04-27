'use client';

import { useEffect, useState } from 'react';
import { Plus, Bell, Trash2, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { formatDateTime } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import { RequireFeature } from '@/components/guards/RequireFeature';
import type { Reminder } from '@/lib/types';

const schema = z.object({
  title: z.string().min(2),
  message: z.string().min(5),
  recipient_phone: z.string().optional(),
  scheduled_at: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function RemindersPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });
    setReminders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSave = async (data: FormData) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('reminders').insert({ ...data, user_id: user.id, sent: false });
    toast.success(t.reminders.addSuccess);
    setOpen(false);
    reset();
    load();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('reminders').delete().eq('id', id);
    toast.success(t.reminders.deleteSuccess);
    load();
  };

  return (
    <RequireFeature feature="reminders">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.reminders.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'تذكيرات تلقائية للعملاء' : 'Automatic client reminders'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus />{t.reminders.addNew}</Button>} />
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit(onSave)}>
              <DialogHeader>
                <DialogTitle>{t.reminders.addNew}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.reminders.reminderTitle}</Label>
                  <Input id="title" {...register('title')} placeholder={t.reminders.titlePlaceholder} />
                  {errors.title && <p className="text-xs text-destructive">{t.common.required}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient">{t.reminders.recipient}</Label>
                  <Input id="recipient" {...register('recipient_phone')} placeholder={t.auth.phonePlaceholder} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">{t.reminders.scheduledAt}</Label>
                  <Input id="scheduled_at" type="datetime-local" {...register('scheduled_at')} />
                  {errors.scheduled_at && <p className="text-xs text-destructive">{t.common.required}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t.reminders.message}</Label>
                  <Textarea id="message" rows={4} {...register('message')} placeholder={t.reminders.messagePlaceholder} />
                  {errors.message && <p className="text-xs text-destructive">{t.common.required}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.common.cancel}</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner" /> : t.common.save}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card><CardContent className="py-16 flex justify-center"><span className="spinner size-8" /></CardContent></Card>
      ) : reminders.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <Bell className="size-10 opacity-40" />
            <p>{t.reminders.noReminders}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${reminder.sent ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                  {reminder.sent ? <CheckCircle className="size-[18px]" /> : <Clock className="size-[18px]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{reminder.title}</h3>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(reminder.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 />
                    </Button>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reminder.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDateTime(reminder.scheduled_at, lang)}</span>
                    {reminder.recipient_phone && (
                      <span className="text-xs text-muted-foreground" dir="ltr">{reminder.recipient_phone}</span>
                    )}
                    <Badge className={reminder.sent ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'}>
                      {reminder.sent ? t.reminders.sent : t.reminders.pending}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </RequireFeature>
  );
}
