'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock3, Mail, MessageCircle, Phone, Trash2, X, ChevronDown } from 'lucide-react';

import { SUPPORT_WHATSAPP } from '@/lib/constants';

type TranscriptRole = 'user' | 'assistant';
type TranscriptEntry = { role: TranscriptRole; content: string; created_at?: string };

type Recommendation = {
  title: string;
  problem: string;
  solution: string;
  current_pain?: string;
  after_state?: string;
  time_saved_hours_per_month: number;
  estimated_roi: string;
  priority: 'high' | 'medium' | 'low';
  channel: string;
};

type SessionRow = {
  id: string;
  is_anonymous: boolean;
  user_id: string | null;
  captured_email: string | null;
  captured_phone: string | null;
  captured_business_name: string | null;
  language: 'en' | 'ar';
  status: 'in_progress' | 'completed' | 'abandoned';
  transcript: TranscriptEntry[];
  business_summary: string | null;
  recommendations: Recommendation[];
  last_activity_at: string;
  contacted_at: string | null;
  contacted_by: string | null;
  admin_notes: string | null;
  captured_budget_range: 'under_300' | '300_to_1000' | '1000_plus' | 'not_sure' | null;
  pipeline_status?: 'pending' | 'running' | 'complete' | 'error' | null;
  pipeline_error?: string | null;
  strategist_output?: {
    core_bottleneck?: string;
    root_causes?: string[];
    highest_leverage_move?: string;
    monthly_cost_of_inaction?: number;
    risks_if_no_action?: string[];
    growth_blockers?: string[];
    what_winning_looks_like?: string;
    strategic_summary?: string;
  } | null;
  pricer_output?: {
    total_build_complexity?: 'simple' | 'medium' | 'complex';
    estimated_build_hours?: number;
    suggested_quote_range_usd?: { min?: number; max?: number };
    recommended_tier?: string;
    budget_fit?: 'matches' | 'stretch' | 'below_budget' | 'unknown';
    pricing_strategy_note?: string;
  } | null;
  pitcher_output?: {
    hero_headline?: string;
    hero_subline?: string;
    cost_of_inaction_headline?: string;
    transformation_promise?: string;
    cta_main?: string;
    cta_secondary?: string;
    closing_emotional_line?: string;
  } | null;
};

type Filters = {
  source: 'all' | 'anonymous' | 'registered';
  status: 'all' | 'completed' | 'in_progress' | 'abandoned';
};

function isArabic(lang: string): lang is 'ar' {
  return lang === 'ar';
}

const WINDOW_7_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const WINDOW_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function computeIsAbandoned(row: SessionRow): boolean {
  if (row.status !== 'in_progress') return false;
  const last = new Date(row.last_activity_at).getTime();
  return Date.now() - last > WINDOW_7_DAYS_MS;
}

function computeIsAbandonedOlderThan30Days(row: SessionRow): boolean {
  if (row.status !== 'in_progress') return false;
  const last = new Date(row.last_activity_at).getTime();
  return Date.now() - last > WINDOW_30_DAYS_MS;
}

function displayAssistantContent(content: string): string {
  try {
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && typeof (parsed as any).next_question === 'string') {
      return (parsed as any).next_question;
    }
  } catch {
    // noop
  }
  return content;
}

export function OnboardingSubmissionsTab({ onRefresh }: { onRefresh?: () => void }) {
  const supabase = createClient();
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SessionRow[]>([]);

  const [filters, setFilters] = useState<Filters>({ source: 'all', status: 'all' });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<SessionRow | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [recOpen, setRecOpen] = useState(false);
  const [strategicOpen, setStrategicOpen] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);

  const ui = useMemo(() => {
    const arabic = isArabic(lang);
    return {
      title: arabic ? 'مشاركات الاستشارة' : 'Onboarding Submissions',
      sourceAll: arabic ? 'الكل' : 'All',
      sourceAnon: arabic ? 'مجهول' : 'Anonymous',
      sourceReg: arabic ? 'مسجل' : 'Registered',
      statusAll: arabic ? 'الكل' : 'All',
      statusCompleted: arabic ? 'مكتمل' : 'Completed',
      statusInProgress: arabic ? 'قيد التنفيذ' : 'In Progress',
      statusAbandoned: arabic ? 'متروك' : 'Abandoned',
      tableBusiness: arabic ? 'العمل' : 'Business',
      tableEmail: arabic ? 'البريد' : 'Email',
      tablePhone: arabic ? 'الهاتف' : 'Phone',
      tableStatus: arabic ? 'الحالة' : 'Status',
      tableRecs: arabic ? 'التوصيات' : 'Recs',
      tableLastActivity: arabic ? 'آخر نشاط' : 'Last Activity',
      contacted: arabic ? 'تم التواصل' : 'Contacted',
      openWhatsApp: arabic ? 'افتح واتساب' : 'Open WhatsApp',
      markContacted: arabic ? 'تم التواصل' : 'Mark as contacted',
      addNote: arabic ? 'أضف ملاحظة' : 'Add note',
      save: arabic ? 'حفظ' : 'Save',
      delete: arabic ? 'حذف' : 'Delete',
      noSessions: arabic ? 'لا توجد مشاركات.' : 'No submissions yet.',
    };
  }, [lang]);

  const load = async () => {
    setLoading(true);
    try {
      console.log('[admin/onboarding] Request received');
      const { data, error } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .order('last_activity_at', { ascending: false });

      console.log('[admin/onboarding] Supabase error:', error);
      console.log('[admin/onboarding] Data length:', data?.length);
      if (error) throw error;

      setRows((data ?? []) as SessionRow[]);
    } catch (e) {
      toast.error(lang === 'ar' ? 'تعذر تحميل المشاركات.' : 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const abandoned = computeIsAbandoned(row);

      if (filters.source !== 'all') {
        if (filters.source === 'anonymous' && !row.is_anonymous) return false;
        if (filters.source === 'registered' && row.is_anonymous) return false;
      }

      if (filters.status !== 'all') {
        if (filters.status === 'completed' && row.status !== 'completed') return false;
        if (filters.status === 'in_progress' && row.status !== 'in_progress') return false;
        if (filters.status === 'in_progress' && abandoned) return false;
        if (filters.status === 'abandoned' && !abandoned) return false;
      }

      return true;
    });
  }, [filters, rows]);

  const openSession = (row: SessionRow) => {
    setSelected(row);
    setNoteDraft(row.admin_notes ?? '');
    setRecOpen(false);
    setStrategicOpen(true);
    setPricingOpen(false);
    setPitchOpen(false);
    setSheetOpen(true);
  };

  const openWhatsAppHref = (row: SessionRow): string => {
    const recTitle = row.recommendations?.[0]?.title ?? '';
    const businessName = row.captured_business_name || 'there';
    const text = `Hi ${businessName}, this is TwentyFour. I reviewed your consultation — let's talk about ${recTitle}`;
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
  };

  const markContacted = async (row: SessionRow) => {
    const { error } = await supabase
      .from('onboarding_sessions')
      .update({ contacted_at: new Date().toISOString(), contacted_by: (await supabase.auth.getUser()).data.user?.id ?? null })
      .eq('id', row.id);
    if (error) {
      toast.error(lang === 'ar' ? 'فشل تحديد التواصل.' : 'Failed to mark contacted.');
      return;
    }
    toast.success(lang === 'ar' ? 'تم تحديث الحالة.' : 'Contact status updated.');
    await load();
    onRefresh?.();
  };

  const saveNote = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from('onboarding_sessions')
      .update({ admin_notes: noteDraft })
      .eq('id', selected.id);
    if (error) {
      toast.error(lang === 'ar' ? 'تعذر حفظ الملاحظة.' : 'Failed to save note.');
      return;
    }
    toast.success(lang === 'ar' ? 'تم الحفظ.' : 'Saved.');
    await load();
    onRefresh?.();
  };

  const deleteSession = async (row: SessionRow) => {
    const canDelete = row.is_anonymous && computeIsAbandonedOlderThan30Days(row);
    if (!canDelete) return;

    const ok = window.confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?');
    if (!ok) return;

    const { error } = await supabase.from('onboarding_sessions').delete().eq('id', row.id);
    if (error) {
      toast.error(lang === 'ar' ? 'تعذر حذف السجل.' : 'Failed to delete session.');
      return;
    }
    toast.success(lang === 'ar' ? 'تم الحذف.' : 'Deleted.');
    await load();
    onRefresh?.();
    setSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{ui.title}</h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'تابع الاستشارات، سجل القنوات، ودوّن ملاحظاتك.' : 'Track consultations, capture sources, and add internal notes.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {(['all', 'anonymous', 'registered'] as const).map((key) => (
              <Button
                key={key}
                variant={filters.source === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters((p) => ({ ...p, source: key }))}
              >
                {key === 'all' ? ui.sourceAll : key === 'anonymous' ? ui.sourceAnon : ui.sourceReg}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'completed', 'in_progress', 'abandoned'] as const).map((key) => (
            <Button
              key={key}
              variant={filters.status === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters((p) => ({ ...p, status: key }))}
            >
              {key === 'all'
                ? ui.statusAll
                : key === 'completed'
                  ? ui.statusCompleted
                  : key === 'in_progress'
                    ? ui.statusInProgress
                    : ui.statusAbandoned}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{ui.title}</CardContent>
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">{ui.noSessions}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 w-full overflow-x-hidden">
            <Table className="table-fixed w-full min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">{lang === 'ar' ? 'المصدر' : 'Source'}</TableHead>
                  <TableHead className="min-w-0">{ui.tableBusiness}</TableHead>
                  <TableHead className="w-48">{ui.tableEmail}</TableHead>
                  <TableHead className="w-36">{ui.tablePhone}</TableHead>
                  <TableHead className="w-28">{ui.tableStatus}</TableHead>
                  <TableHead className="w-12 text-center">{ui.tableRecs}</TableHead>
                  <TableHead className="w-36">{ui.tableLastActivity}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const abandoned = computeIsAbandoned(row);
                  const isContacted = Boolean(row.contacted_at);
                  return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => openSession(row)}
                    >
                      <TableCell className="w-24 align-top">
                        <Badge
                          variant="secondary"
                          className={
                            row.is_anonymous ? 'bg-amber-500/15 text-amber-500' : 'bg-green-500/15 text-green-500'
                          }
                        >
                          {row.is_anonymous ? (lang === 'ar' ? 'مجهول' : 'Anon') : lang === 'ar' ? 'مسجل' : 'Reg'}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-0 font-medium">
                        <span className="block truncate" title={row.captured_business_name || undefined}>
                          {row.captured_business_name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="w-48 max-w-48 truncate text-sm" title={row.captured_email || undefined}>
                        {row.captured_email || '-'}
                      </TableCell>
                      <TableCell className="w-36 max-w-36 truncate text-sm" title={row.captured_phone || undefined}>
                        {row.captured_phone || '-'}
                      </TableCell>
                      <TableCell className="w-28 align-top text-xs">
                        {abandoned ? (
                          <Badge className="bg-amber-500/15 text-amber-500">{ui.statusAbandoned}</Badge>
                        ) : row.status === 'completed' ? (
                          <Badge className="bg-green-500/15 text-green-500">{ui.statusCompleted}</Badge>
                        ) : (
                          <Badge className="bg-blue-500/15 text-blue-500">{ui.statusInProgress}</Badge>
                        )}
                        {isContacted ? (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1">{ui.contacted}</Badge>
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="w-12 text-center tabular-nums">{row.recommendations?.length ?? 0}</TableCell>
                      <TableCell className="w-36 text-xs text-muted-foreground whitespace-normal break-words">
                        {new Date(row.last_activity_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {sheetOpen && selected ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20"
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close panel'}
            onClick={() => setSheetOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 z-50 h-screen w-[460px] max-w-[100vw] border-l border-border bg-background shadow-xl overflow-y-auto flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl font-bold truncate">{selected.captured_business_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={selected.is_anonymous ? 'bg-amber-500/15 text-amber-500' : 'bg-green-500/15 text-green-500'}>
                      {selected.is_anonymous ? ui.sourceAnon : ui.sourceReg}
                    </Badge>
                    <Badge variant="secondary">{selected.language.toUpperCase()}</Badge>
                    <Badge className={selected.status === 'completed' ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-500'}>
                      {selected.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setSheetOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1 min-h-0">
              <Card>
                <CardContent className="p-3 text-xs space-y-2">
                  <p className="flex items-center gap-2"><Mail className="size-3 shrink-0" /> {selected.captured_email || '-'}</p>
                  <p className="flex items-center gap-2"><Phone className="size-3 shrink-0" /> {selected.captured_phone || '-'}</p>
                  <p className="flex items-center gap-2"><Clock3 className="size-3 shrink-0" /> {new Date(selected.last_activity_at).toLocaleString()}</p>
                  {selected.captured_budget_range ? (
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">Budget signal:</span>
                      <Badge
                        className={
                          selected.captured_budget_range === 'under_300'
                            ? 'bg-zinc-500/15 text-zinc-500'
                            : selected.captured_budget_range === '300_to_1000'
                              ? 'bg-amber-500/15 text-amber-500'
                              : selected.captured_budget_range === '1000_plus'
                                ? 'bg-green-500/15 text-green-500'
                                : 'bg-muted text-muted-foreground'
                        }
                      >
                        {selected.captured_budget_range}
                      </Badge>
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold">Business Summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.business_summary || 'Summary not yet generated'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Collapsible open={strategicOpen} onOpenChange={setStrategicOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-start">
                      <span>Strategic Analysis</span>
                      <ChevronDown className={`size-4 transition-transform shrink-0 ${strategicOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {!selected.strategist_output ? (
                        <p className="text-sm text-muted-foreground mt-3">No strategist output yet.</p>
                      ) : (
                        <div className="mt-3 space-y-3 text-sm">
                          <p><span className="font-semibold">Core bottleneck:</span> {selected.strategist_output.core_bottleneck || '-'}</p>
                          <div>
                            <p className="font-semibold">Root causes</p>
                            <ul className="list-disc ps-5 text-muted-foreground">
                              {(selected.strategist_output.root_causes || []).map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>
                          <p><span className="font-semibold">Highest leverage move:</span> {selected.strategist_output.highest_leverage_move || '-'}</p>
                          <p className="text-red-600 dark:text-red-400 font-bold text-lg">
                            ${Math.round(Number(selected.strategist_output.monthly_cost_of_inaction || 0)).toLocaleString()} / month cost of inaction
                          </p>
                          <div>
                            <p className="font-semibold">Risks if no action</p>
                            <ul className="list-disc ps-5 text-muted-foreground">
                              {(selected.strategist_output.risks_if_no_action || []).map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold">Growth blockers</p>
                            <ul className="list-disc ps-5 text-muted-foreground">
                              {(selected.strategist_output.growth_blockers || []).map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>
                          <p><span className="font-semibold">What winning looks like:</span> {selected.strategist_output.what_winning_looks_like || '-'}</p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Collapsible open={recOpen} onOpenChange={setRecOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-start">
                      <span>Recommendations ({selected.recommendations.length})</span>
                      <ChevronDown className={`size-4 transition-transform shrink-0 ${recOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {selected.recommendations.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-3">None generated yet</p>
                      ) : (
                        <div className="space-y-3 mt-3">
                          {selected.recommendations.map((rec, ri) => (
                            <div key={`${rec.title}-${ri}`} className="rounded-lg border border-border p-3 text-xs space-y-2 bg-muted/20">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <span className="font-semibold text-sm text-foreground leading-snug">{rec.title}</span>
                                <div className="flex flex-wrap gap-1 shrink-0">
                                  <Badge variant="secondary">{rec.channel}</Badge>
                                  <Badge className={rec.priority === 'high' ? 'bg-red-500/15 text-red-500' : rec.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-green-500/15 text-green-500'}>{rec.priority}</Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium uppercase text-muted-foreground">Problem</p>
                                <p className="text-xs text-muted-foreground line-clamp-3">{rec.problem}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium uppercase text-muted-foreground">Solution</p>
                                <p className="text-xs text-foreground line-clamp-4">{rec.solution}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                                <Badge variant="outline">{rec.time_saved_hours_per_month}h / mo</Badge>
                                <span className="text-xs text-muted-foreground">{rec.estimated_roi}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Collapsible open={pricingOpen} onOpenChange={setPricingOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-start">
                      <span>Pricing Intel (Internal Only)</span>
                      <ChevronDown className={`size-4 transition-transform shrink-0 ${pricingOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {!selected.pricer_output ? (
                        <p className="text-sm text-muted-foreground mt-3">No pricer output yet.</p>
                      ) : (
                        <div className="mt-3 space-y-3 text-sm">
                          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">
                            ADMIN ONLY - DO NOT SHARE WITH CLIENT
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge className="bg-muted text-foreground">{selected.pricer_output.total_build_complexity || 'medium'}</Badge>
                            <Badge variant="secondary">{selected.pricer_output.estimated_build_hours || 0} hrs est.</Badge>
                            <Badge
                              className={
                                selected.pricer_output.budget_fit === 'matches'
                                  ? 'bg-green-500/15 text-green-500'
                                  : selected.pricer_output.budget_fit === 'stretch'
                                    ? 'bg-amber-500/15 text-amber-500'
                                    : selected.pricer_output.budget_fit === 'below_budget'
                                      ? 'bg-blue-500/15 text-blue-500'
                                      : 'bg-muted text-muted-foreground'
                              }
                            >
                              Budget fit: {selected.pricer_output.budget_fit || 'unknown'}
                            </Badge>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            Quote range: $
                            {Math.round(Number(selected.pricer_output.suggested_quote_range_usd?.min || 0)).toLocaleString()}
                            {' - '}
                            $
                            {Math.round(Number(selected.pricer_output.suggested_quote_range_usd?.max || 0)).toLocaleString()}
                          </p>
                          <p><span className="font-semibold">Recommended tier:</span> {selected.pricer_output.recommended_tier || '-'}</p>
                          <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3 italic text-muted-foreground">
                            {selected.pricer_output.pricing_strategy_note || 'No pricing strategy note generated yet.'}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Collapsible open={pitchOpen} onOpenChange={setPitchOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-start">
                      <span>Personalized Pitch Copy</span>
                      <ChevronDown className={`size-4 transition-transform shrink-0 ${pitchOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {!selected.pitcher_output ? (
                        <p className="text-sm text-muted-foreground mt-3">No pitcher output yet.</p>
                      ) : (
                        <div className="mt-3 space-y-2 text-sm">
                          <p><span className="font-semibold">Hero headline:</span> {selected.pitcher_output.hero_headline || '-'}</p>
                          <p><span className="font-semibold">Hero subline:</span> {selected.pitcher_output.hero_subline || '-'}</p>
                          <p><span className="font-semibold">Cost of inaction headline:</span> {selected.pitcher_output.cost_of_inaction_headline || '-'}</p>
                          <p><span className="font-semibold">Transformation promise:</span> {selected.pitcher_output.transformation_promise || '-'}</p>
                          <p><span className="font-semibold">CTA main:</span> {selected.pitcher_output.cta_main || '-'}</p>
                          <p><span className="font-semibold">CTA secondary:</span> {selected.pitcher_output.cta_secondary || '-'}</p>
                          <p><span className="font-semibold">Closing line:</span> {selected.pitcher_output.closing_emotional_line || '-'}</p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold">Conversation Transcript</p>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {selected.transcript.map((entry, idx) => {
                      const isUser = entry.role === 'user';
                      const content = isUser ? entry.content : displayAssistantContent(entry.content);
                      return (
                        <div key={`${entry.role}-${idx}`} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isUser
                              ? 'bg-muted text-foreground'
                              : 'bg-amber-50 dark:bg-amber-950/30 text-foreground'
                          }`}>
                            {content}
                          </div>
                          {entry.created_at ? <span className="text-[10px] text-muted-foreground mt-1">{new Date(entry.created_at).toLocaleString()}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <Label>{ui.addNote}</Label>
                  <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Internal notes for this lead" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => void markContacted(selected)}>
                      <Clock3 className="size-4 me-2" />
                      {ui.markContacted}
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => void saveNote()}>{ui.save}</Button>
                      <Button className="bg-amber-500 text-black hover:bg-amber-400" nativeButton={false} render={<a href={openWhatsAppHref(selected)} target="_blank" rel="noopener noreferrer" />}>
                        <MessageCircle className="size-4 me-2" />
                        {ui.openWhatsApp}
                      </Button>
                      {selected.is_anonymous && computeIsAbandonedOlderThan30Days(selected) ? (
                        <Button variant="destructive" onClick={() => void deleteSession(selected)}>
                          <Trash2 className="size-4 me-2" />
                          {ui.delete}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

