'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Copy, Sparkles, Pencil } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequireFeature } from '@/components/guards/RequireFeature';
import type { QAScript } from '@/lib/types';

const CATEGORIES = ['appointments', 'pricing', 'location', 'services', 'general'] as const;
type Category = typeof CATEGORIES[number];

export default function ScriptsPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ts = t.scripts;
  const [scripts, setScripts] = useState<QAScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QAScript | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'general' as Category,
    is_active: true,
  });

  const load = async (cid?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const resolvedClientId = cid ?? clientId ?? (await (async () => {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();
      return client?.id ?? null;
    })());

    if (!resolvedClientId) {
      setScripts([]);
      setLoading(false);
      return;
    }

    if (!clientId) setClientId(resolvedClientId);

    const { data } = await supabase
      .from('qa_scripts')
      .select('*')
      .eq('client_id', resolvedClientId)
      .order('category')
      .order('created_at', { ascending: false });
    setScripts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      const cid = client?.id ?? null;
      if (cancelled) return;
      setClientId(cid);

      await load(cid ?? undefined);
      if (!cid) return;

      channel = supabase
        .channel(`qa_scripts:${cid}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'qa_scripts',
          filter: `client_id=eq.${cid}`,
        }, () => {
          load(cid);
        })
        .subscribe();
    };

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editTarget) {
      setForm({
        question: editTarget.question,
        answer: editTarget.answer,
        category: editTarget.category as Category,
        is_active: editTarget.is_active,
      });
      setOpen(true);
    }
  }, [editTarget]);

  const filtered = scripts.filter((s) => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    const matchSearch = !search || s.question.toLowerCase().includes(search.toLowerCase()) || s.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const reset = () => {
    setOpen(false);
    setEditTarget(null);
    setForm({ question: '', answer: '', category: 'general', is_active: true });
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error(lang === 'ar' ? 'أدخل السؤال والإجابة' : 'Enter question and answer');
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();
    const cid = client?.id ?? clientId;
    if (!cid) return;

    if (editTarget) {
      await supabase.from('qa_scripts').update(form).eq('id', editTarget.id).eq('client_id', cid);
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated');
    } else {
      await supabase.from('qa_scripts').insert({ ...form, client_id: cid, user_id: user.id });
      toast.success(ts.addSuccess);
    }
    reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
    const supabase = createClient();
    if (clientId) {
      await supabase.from('qa_scripts').delete().eq('id', id).eq('client_id', clientId);
    } else {
      await supabase.from('qa_scripts').delete().eq('id', id);
    }
    toast.success(ts.deleteSuccess);
  };

  const handleAiSuggest = async () => {
    setLoadingSuggest(true);
    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: lang === 'ar' ? 'اقترح 5 أسئلة وإجابات شائعة' : 'Suggest 5 common Q&A' }),
      });
      toast.success(lang === 'ar' ? 'تم الحصول على اقتراحات' : 'Got suggestions');
    } catch {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
    setLoadingSuggest(false);
  };

  return (
    <RequireFeature feature="scripts">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ts.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'ردود جاهزة لعملائك' : 'Ready replies for clients'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAiSuggest} disabled={loadingSuggest}>
            {loadingSuggest ? <span className="spinner size-3.5" /> : <Sparkles className="text-primary" />}
            {ts.aiSuggest}
          </Button>
          <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else setOpen(true); }}>
            <DialogTrigger render={<Button onClick={() => setEditTarget(null)}><Plus />{ts.addNew}</Button>} />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editTarget ? t.common.edit : ts.addNew}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>{ts.category}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as Category }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{ts.categories[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q">{ts.question}</Label>
                  <Input id="q" value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} placeholder={ts.questionPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a">{ts.answer}</Label>
                  <Textarea id="a" rows={4} value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} placeholder={ts.answerPlaceholder} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="active" className="cursor-pointer">{lang === 'ar' ? 'فعّال' : 'Active'}</Label>
                  <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={reset}>{t.common.cancel}</Button>
                <Button onClick={handleSave}>{t.common.save}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category | 'all')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">{t.common.all}</TabsTrigger>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>{ts.categories[c]}</TabsTrigger>
            ))}
          </TabsList>
          <div className="relative w-full max-w-xs">
            <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ts.searchPlaceholder} className="ps-9" />
          </div>
        </div>
      </Tabs>

      {loading ? (
        <Card><CardContent className="py-16 flex justify-center"><span className="spinner size-8" /></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{ts.noScripts}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((script) => (
            <Card key={script.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-primary/15 text-primary">
                        {ts.categories[script.category as Category] || script.category}
                      </Badge>
                      {!script.is_active && (
                        <Badge variant="secondary">{lang === 'ar' ? 'غير فعّال' : 'Inactive'}</Badge>
                      )}
                    </div>
                    <p className="mb-1.5 text-sm font-medium">{script.question}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{script.answer}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { navigator.clipboard.writeText(script.answer); toast.success(t.common.copied); }}
                      title={t.common.copy}
                    >
                      <Copy />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(script)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(script.id)} className="text-destructive">
                      <Trash2 />
                    </Button>
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
