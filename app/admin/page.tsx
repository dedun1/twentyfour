'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LineChart,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings2,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TwentyFourStatsTab } from '@/app/admin/components/TwentyFourStatsTab';
import { ClientStatsTab } from '@/app/admin/components/ClientStatsTab';
import { DashboardControlTab } from '@/app/admin/components/DashboardControlTab';
import { AdminsTab } from '@/app/admin/components/AdminsTab';
import { TwentyFourAppointmentsTab } from '@/app/admin/components/TwentyFourAppointmentsTab';
import { OnboardingSubmissionsTab } from '@/app/admin/components/OnboardingSubmissionsTab';
import { EmptyState } from '@/app/admin/components/EmptyState';
import type {
  AppointmentStatus,
  ContactRequest,
  ContactRequestStatus,
  Conversation,
  ConversationMessage,
  FeatureKey,
  QAScript,
  Reminder,
  ServiceType,
  SubscriptionStatus,
} from '@/lib/types';

type TabKey =
  | 'pending'
  | 'clients'
  | 'admins'
  | 'appointments'
  | 'twentyfour-appointments'
  | 'inbox'
  | 'scripts'
  | 'reminders'
  | 'contacts'
  | 'onboarding-submissions'
  | 'twentyfour-stats'
  | 'client-stats'
  | 'dashboard-control';
type PlanType = 'Starter' | 'Growth' | 'Scale' | 'Custom';

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  business_name?: string | null;
  role: 'admin' | 'client';
  client_id?: string | null;
  created_at: string;
};

type ClientRow = {
  id: string;
  profile_id?: string | null;
  business_name?: string | null;
  owner_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  city?: string | null;
  subscription_status?: SubscriptionStatus;
  features?: FeatureKey[];
  monthly_price?: number | null;
  plan?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  service_type?: ServiceType;
  service_label?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type AdminClientRow = ProfileRow & ClientRow & {
  internal_notes?: string | null;
};
type AdminTabRow = {
  clientId: string;
  profileId: string;
  businessName: string;
  contactEmail: string;
  status: SubscriptionStatus;
  plan: string | null;
  monthlyPrice: number | null;
  features: FeatureKey[];
  approvedAt: string | null;
};

type AppointmentRow = {
  id: string;
  user_id: string;
  client_id?: string | null;
  client_name: string;
  client_phone?: string | null;
  service: string;
  cost?: number | null;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string | null;
  created_at: string;
  clients?: {
    id: string;
    business_name?: string | null;
  } | null;
};

type ReminderRow = Reminder & {
  status?: 'pending' | 'sent';
};

type ContactRequestRow = ContactRequest & {
  admin_notes?: string | null;
};

type AppointmentClient = {
  id: string;
  business_name: string | null;
  subscription_status: SubscriptionStatus | null;
};

const FEATURES: FeatureKey[] = ['appointments', 'whatsapp', 'scripts', 'reports', 'reminders'];
const SERVICE_LABELS: Record<Exclude<ServiceType, null>, string> = {
  ai_chatbot: 'AI Chatbot Service',
  booking_system: 'Booking System',
  crm_automation: 'CRM Automation',
  custom_workflow: 'Custom Workflow',
  full_suite: 'Full Suite',
};
const SERVICE_DEFAULTS: Record<Exclude<ServiceType, null>, FeatureKey[]> = {
  ai_chatbot: ['whatsapp', 'scripts', 'reports'],
  booking_system: ['appointments', 'reminders', 'reports'],
  crm_automation: ['whatsapp', 'appointments', 'reminders', 'reports'],
  custom_workflow: [],
  full_suite: FEATURES,
};
const STATUS_BADGE_CLASS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/15 text-green-500',
  trial: 'bg-blue-500/15 text-blue-500',
  pending_approval: 'bg-amber-500/15 text-amber-500',
  paused: 'bg-yellow-500/15 text-yellow-500',
  rejected: 'bg-red-500/15 text-red-500',
  cancelled: 'bg-zinc-500/15 text-zinc-400',
};
const APPOINTMENT_BADGE_CLASS: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-500/15 text-yellow-500',
  confirmed: 'bg-green-500/15 text-green-500',
  cancelled: 'bg-red-500/15 text-red-500',
  completed: 'bg-blue-500/15 text-blue-500',
};

const emptyClientForm = {
  full_name: '',
  email: '',
  password: '',
  business_name: '',
  contact_email: '',
  contact_phone: '',
  city: '',
  subscription_status: 'pending_approval' as SubscriptionStatus,
  plan: 'Starter' as PlanType,
  monthly_price: '',
  features: [] as FeatureKey[],
  internal_notes: '',
};

const emptyAppointmentForm = {
  clientId: '',
  client_name: '',
  client_phone: '',
  service: '',
  cost: 0,
  date: '',
  time: '',
  status: 'pending' as AppointmentStatus,
  notes: '',
};

const emptyScriptForm = {
  clientProfileId: '',
  clientId: '',
  question: '',
  answer: '',
  category: 'general',
  is_active: true,
};

const emptyReminderForm = {
  clientProfileId: '',
  title: '',
  message: '',
  recipient_phone: '',
  scheduled_at: '',
  status: 'pending' as 'pending' | 'sent',
};

type DatePreset = 'all' | 'today' | 'week' | 'month';

export default function AdminPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ta = t.admin;
  const common = t.common;
  const supabase = createClient();
  const [tab, setTab] = useState<TabKey>('pending');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  const [clients, setClients] = useState<AdminClientRow[]>([]);
  const [adminClients, setAdminClients] = useState<AdminClientRow[]>([]);
  const [appointmentClients, setAppointmentClients] = useState<AppointmentClient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [scripts, setScripts] = useState<QAScript[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [contacts, setContacts] = useState<ContactRequestRow[]>([]);

  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);

  const [approveTarget, setApproveTarget] = useState<AdminClientRow | null>(null);
  const [declineTarget, setDeclineTarget] = useState<AdminClientRow | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [approvalForm, setApprovalForm] = useState({
    service_type: 'ai_chatbot' as Exclude<ServiceType, null>,
    service_label: 'AI Chatbot Service',
    features: SERVICE_DEFAULTS.ai_chatbot,
    monthly_price: '',
    plan: 'Starter' as PlanType,
    notes: '',
  });

  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientDialogMode, setClientDialogMode] = useState<'create' | 'edit'>('create');
  const [clientEditorTarget, setClientEditorTarget] = useState<AdminClientRow | null>(null);
  const [clientForm, setClientForm] = useState(emptyClientForm);

  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentEditorTarget, setAppointmentEditorTarget] = useState<AppointmentRow | null>(null);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);

  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [scriptEditorTarget, setScriptEditorTarget] = useState<QAScript | null>(null);
  const [scriptForm, setScriptForm] = useState(emptyScriptForm);

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderEditorTarget, setReminderEditorTarget] = useState<ReminderRow | null>(null);
  const [reminderForm, setReminderForm] = useState(emptyReminderForm);

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; label: string } | null>(null);

  const [clientFilter, setClientFilter] = useState('all');
  const [appointmentClientSearch, setAppointmentClientSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [appointmentFrom, setAppointmentFrom] = useState('');
  const [appointmentTo, setAppointmentTo] = useState('');
  const [appointmentDatePreset, setAppointmentDatePreset] = useState<DatePreset>('all');
  const [clientsSearch, setClientsSearch] = useState('');
  const [adminsSearch, setAdminsSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | ContactRequestStatus>('all');
  const [contactSearch, setContactSearch] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const ui = {
    adminControlCenter: lang === 'ar' ? 'مركز تحكم الإدارة' : 'Admin Control Center',
    adminSubtitle: lang === 'ar'
      ? 'إدارة الموافقات والعملاء والمواعيد والرسائل والسكريبتات والتذكيرات وصحة النظام.'
      : 'Manage approvals, clients, appointments, inbox, scripts, reminders, leads, and system health.',
    pendingApprovals: lang === 'ar' ? 'الموافقات المعلقة' : 'Pending Approvals',
    allClients: lang === 'ar' ? 'كل العملاء' : 'All Clients',
    allAppointments: lang === 'ar' ? 'كل المواعيد' : 'All Appointments',
    inbox: lang === 'ar' ? 'الرسائل / الوارد' : 'Messages / Inbox',
    scriptsLibrary: lang === 'ar' ? 'مكتبة السكريبتات' : 'Scripts Library',
    reminders: lang === 'ar' ? 'التذكيرات' : 'Reminders',
    contactRequests: lang === 'ar' ? 'طلبات التواصل' : 'Contact Requests',
    onboardingSubmissions: lang === 'ar' ? 'مشاركات الاستشارة' : 'Onboarding Submissions',
    addNewClient: lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Client',
    searchClients: lang === 'ar' ? 'ابحث عن العملاء...' : 'Search clients...',
    appointmentsCount: lang === 'ar' ? 'موعد' : 'appointments',
    newAppointment: lang === 'ar' ? 'موعد جديد' : 'New Appointment',
    editAppointment: lang === 'ar' ? 'تعديل الموعد' : 'Edit Appointment',
    selectClient: lang === 'ar' ? 'اختر العميل' : 'Select client',
    customerName: lang === 'ar' ? 'اسم العميل' : 'Customer Name',
    customerPhone: lang === 'ar' ? 'هاتف العميل' : 'Customer Phone',
    bookingCost: lang === 'ar' ? 'تكلفة الحجز (EGP)' : 'Booking Cost (EGP)',
    service: lang === 'ar' ? 'الخدمة' : 'Service',
    status: lang === 'ar' ? 'الحالة' : 'Status',
    date: lang === 'ar' ? 'التاريخ' : 'Date',
    time: lang === 'ar' ? 'الوقت' : 'Time',
    notes: lang === 'ar' ? 'ملاحظات' : 'Notes',
    noAppointmentsYet: lang === 'ar' ? 'لا توجد مواعيد بعد' : 'No appointments yet',
    noAppointmentsHint: lang === 'ar' ? 'ستظهر المواعيد هنا بعد إنشائها.' : 'Appointments for this selection will appear here once they are created.',
    filterByStatus: lang === 'ar' ? 'فلترة حسب الحالة' : 'Filter by status',
    allStatuses: lang === 'ar' ? 'كل الحالات' : 'All statuses',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    loadingPending: lang === 'ar' ? 'جاري تحميل الموافقات المعلقة...' : 'Loading pending approvals...',
    noPending: lang === 'ar' ? 'لا توجد موافقات معلقة.' : 'No pending approvals.',
    untitledClient: lang === 'ar' ? 'عميل بدون اسم' : 'Untitled client',
    signupDate: lang === 'ar' ? 'تاريخ التسجيل' : 'Signup date',
    approve: lang === 'ar' ? 'موافقة' : 'Approve',
    decline: lang === 'ar' ? 'رفض' : 'Decline',
    viewDetails: lang === 'ar' ? 'عرض التفاصيل' : 'View Details',
    loadingClients: lang === 'ar' ? 'جاري تحميل العملاء...' : 'Loading clients...',
    plan: lang === 'ar' ? 'الخطة' : 'Plan',
    monthlyPrice: lang === 'ar' ? 'السعر الشهري' : 'Monthly Price',
    approvedAt: lang === 'ar' ? 'تاريخ الموافقة' : 'Approved At',
    city: lang === 'ar' ? 'المدينة' : 'City',
    activate: lang === 'ar' ? 'تفعيل' : 'Activate',
    pause: lang === 'ar' ? 'إيقاف مؤقت' : 'Pause',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    searchContactRequests: lang === 'ar' ? 'ابحث في طلبات التواصل' : 'Search contact requests',
    markContacted: lang === 'ar' ? 'تم التواصل' : 'Mark Contacted',
    markResolved: lang === 'ar' ? 'تحديد كمحلول' : 'Mark Resolved',
    convertToClient: lang === 'ar' ? 'تحويل إلى عميل' : 'Convert to Client',
    adminNotes: lang === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes',
    saveNotes: lang === 'ar' ? 'حفظ الملاحظات' : 'Save Notes',
    confirmDelete: lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
    deleteActionCannotBeUndone: lang === 'ar' ? 'هذا الإجراء لا يمكن التراجع عنه.' : 'This action cannot be undone.',
    clientRequired: lang === 'ar' ? 'العميل واسم العميل والخدمة مطلوبة' : 'Client, customer name, and service are required',
    clientNotFound: lang === 'ar' ? 'العميل المحدد غير موجود' : 'Selected client was not found',
    appointmentCreated: lang === 'ar' ? 'تم إنشاء الموعد' : 'Appointment created',
    appointmentUpdated: lang === 'ar' ? 'تم تحديث الموعد' : 'Appointment updated',
    saveAppointmentFailed: lang === 'ar' ? 'فشل حفظ الموعد' : 'Failed to save appointment',
  };

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 7)}-01`;
    const [
      { data: authData, error: authError },
      { data: profileRows, error: profileError },
      { data: adminProfileRows, error: adminProfileError },
      { data: clientRows, error: clientError },
      { data: appointmentClientRowsRaw, error: appointmentClientRowsError },
      { data: appointmentRows, error: appointmentError },
      { data: conversationRows, error: conversationError },
      { data: scriptRows, error: scriptError },
      { data: reminderRows, error: reminderError },
      { data: contactRows, error: contactError },
      { error: todayAppointmentsError },
      { error: monthAppointmentsError },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, business_name, subscription_status').order('business_name', { ascending: true }),
      supabase.from('appointments').select('*, clients(id, business_name)').order('date', { ascending: false }).order('time', { ascending: true }),
      supabase.from('conversations').select('*').order('last_message_at', { ascending: false }),
      supabase.from('qa_scripts').select('*').order('created_at', { ascending: false }),
      supabase.from('reminders').select('*').order('scheduled_at', { ascending: true }),
      supabase.from('contact_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', monthStart).lte('date', today),
    ]);

    const firstError =
      authError ||
      profileError ||
      adminProfileError ||
      clientError ||
      appointmentClientRowsError ||
      appointmentError ||
      conversationError ||
      scriptError ||
      reminderError ||
      contactError ||
      todayAppointmentsError ||
      monthAppointmentsError;
    if (firstError) {
      toast.error(firstError.message);
      setLoading(false);
      return;
    }

    setMyProfileId(authData.user?.id ?? null);

    const mergedClients = ((profileRows || []) as ProfileRow[]).map((profile) => {
      const client = ((clientRows || []) as ClientRow[]).find((row) => row.id === profile.client_id || row.profile_id === profile.id);
      return {
        ...profile,
        ...client,
        client_id: profile.client_id ?? client?.id ?? null,
        business_name: client?.business_name ?? profile.business_name ?? '',
        contact_email: client?.contact_email ?? profile.email ?? '',
        contact_phone: client?.contact_phone ?? profile.phone ?? '',
        subscription_status: client?.subscription_status ?? 'pending_approval',
        features: client?.features ?? [],
        monthly_price: client?.monthly_price ?? null,
        plan: client?.plan ?? '',
        approved_at: client?.approved_at ?? null,
        internal_notes: client?.notes ?? null,
      } as AdminClientRow;
    });

    const mergedAdminClients = ((adminProfileRows || []) as ProfileRow[]).map((profile) => {
      const client = ((clientRows || []) as ClientRow[]).find((row) => row.id === profile.client_id || row.profile_id === profile.id);
      return {
        ...profile,
        ...client,
        client_id: profile.client_id ?? client?.id ?? null,
        business_name: client?.business_name ?? profile.business_name ?? '',
        contact_email: client?.contact_email ?? profile.email ?? '',
        contact_phone: client?.contact_phone ?? profile.phone ?? '',
        subscription_status: client?.subscription_status ?? 'pending_approval',
        features: client?.features ?? [],
        monthly_price: client?.monthly_price ?? null,
        plan: client?.plan ?? '',
        approved_at: client?.approved_at ?? null,
        internal_notes: client?.notes ?? null,
      } as AdminClientRow;
    });
    setClients(mergedClients);
    setAdminClients(mergedAdminClients);
    setAppointmentClients((appointmentClientRowsRaw || []) as AppointmentClient[]);
    console.log('[Admin/Appointments] raw appointments:', appointmentRows || []);
    setAppointments(((appointmentRows || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id ?? ''),
      user_id: String(row.user_id ?? ''),
      client_id: (row.client_id as string | null | undefined) ?? null,
      client_name: String((row.customer_name as string | undefined) ?? (row.client_name as string | undefined) ?? ''),
      client_phone: (row.customer_phone as string | null | undefined) ?? (row.client_phone as string | null | undefined) ?? null,
      service: String(row.service ?? ''),
      cost: Number((row.cost as number | null | undefined) ?? 0),
      date: String(row.date ?? ''),
      time: String(row.time ?? ''),
      status: (row.status as AppointmentStatus | undefined) ?? 'pending',
      notes: (row.notes as string | null | undefined) ?? null,
      created_at: String(row.created_at ?? ''),
      clients: (row.clients as { id: string; business_name?: string | null } | null | undefined) ?? null,
    })));
    setConversations((conversationRows || []) as Conversation[]);
    setScripts((scriptRows || []) as QAScript[]);
    setReminders(((reminderRows || []) as ReminderRow[]).map((row) => ({ ...row, status: row.sent ? 'sent' : 'pending' })));
    setContacts((contactRows || []) as ContactRequestRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientsByProfileId = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client])),
    [clients]
  );

  const clientsByClientId = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.client_id || client.id, client])),
    [clients]
  );

  const pendingClients = useMemo(
    () => clients.filter((client) => client.subscription_status === 'pending_approval'),
    [clients]
  );

  const appointmentCounts = useMemo(() => {
    const byClientId: Record<string, number> = {};
    for (const appointment of appointments) {
      const appointmentClientId = appointment.client_id ?? appointment.clients?.id ?? '';
      if (!appointmentClientId) continue;
      byClientId[appointmentClientId] = (byClientId[appointmentClientId] || 0) + 1;
    }
    return {
      totalCount: appointments.length,
      byClientId,
    };
  }, [appointments]);

  const appointmentClientRows = useMemo(() => {
    return appointmentClients.map((client) => {
      const clientUuid = client.id;
      const count = appointmentCounts.byClientId[clientUuid] || 0;
      return {
        client,
        clientUuid,
        count,
      };
    }).filter((row) => {
      const name = (row.client.business_name || '').toLowerCase();
      const matchesSearch = !appointmentClientSearch || name.includes(appointmentClientSearch.toLowerCase());
      return matchesSearch;
    });
  }, [appointmentClientSearch, appointmentClients, appointmentCounts.byClientId]);

  const groupedConversations = useMemo(() => {
    return clients.map((client) => ({
      client,
      items: conversations.filter((conversation) => conversation.user_id === client.id),
    })).filter((group) => group.items.length > 0);
  }, [clients, conversations]);

  const groupedScripts = useMemo(() => {
    return clients.map((client) => ({
      client,
      items: scripts.filter((script) => script.client_id === client.client_id || script.user_id === client.id),
    })).filter((group) => group.items.length > 0);
  }, [clients, scripts]);

  const groupedReminders = useMemo(() => {
    return clients.map((client) => ({
      client,
      items: reminders.filter((reminder) => reminder.user_id === client.id),
    })).filter((group) => group.items.length > 0);
  }, [clients, reminders]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 7)}-01`;

    return appointments.filter((appointment) => {
      const appointmentClientId = appointment.client_id ?? appointment.clients?.id ?? '';
      const clientMatch = clientFilter === 'all' || appointmentClientId === clientFilter;
      const statusMatch = appointmentStatusFilter === 'all' || appointment.status === appointmentStatusFilter;
      const presetMatch =
        appointmentDatePreset === 'all' ||
        (appointmentDatePreset === 'today' && appointment.date === today) ||
        (appointmentDatePreset === 'week' && appointment.date >= weekStartStr && appointment.date <= weekEndStr) ||
        (appointmentDatePreset === 'month' && appointment.date >= monthStart && appointment.date <= today);
      const fromMatch = !appointmentFrom || appointment.date >= appointmentFrom;
      const toMatch = !appointmentTo || appointment.date <= appointmentTo;
      return clientMatch && statusMatch && presetMatch && fromMatch && toMatch;
    });
  }, [appointmentDatePreset, appointmentFrom, appointmentStatusFilter, appointmentTo, appointments, clientFilter, today]);

  const selectedAppointmentCount = filteredAppointments.length;
  const selectedAppointmentClientName = clientFilter === 'all'
    ? ui.allClients
    : appointmentClients.find((client) => client.id === clientFilter)?.business_name
      || ta.clientName;

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const status = (contact.status ?? 'new') as ContactRequestStatus;
      const matchesStatus = contactFilter === 'all' || status === contactFilter;
      const haystack = `${contact.full_name} ${contact.business_name ?? ''} ${contact.email ?? ''}`.toLowerCase();
      const matchesSearch = !contactSearch || haystack.includes(contactSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [contactFilter, contactSearch, contacts]);

  const filteredClients = useMemo(() => {
    const query = clientsSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => {
      const business = (client.business_name || '').toLowerCase();
      const email = (client.contact_email || client.email || '').toLowerCase();
      return business.includes(query) || email.includes(query);
    });
  }, [clients, clientsSearch]);

  const filteredAdminClients = useMemo(() => {
    const query = adminsSearch.trim().toLowerCase();
    const adminRows = adminClients
      .map((client) => {
        const profileId = client.profile_id || '';
        const clientId = client.id || '';
        if (!profileId || !clientId) return null;
        return {
          clientId,
          profileId,
          businessName: client.business_name || client.full_name || '',
          contactEmail: client.contact_email || client.email || '',
          status: client.subscription_status || 'pending_approval',
          plan: client.plan || null,
          monthlyPrice: client.monthly_price ?? null,
          features: client.features || [],
          approvedAt: client.approved_at || null,
        } satisfies AdminTabRow;
      })
      .filter((row): row is AdminTabRow => Boolean(row));
    if (!query) return adminRows;
    return adminRows.filter((client) => {
      const business = client.businessName.toLowerCase();
      const email = client.contactEmail.toLowerCase();
      return business.includes(query) || email.includes(query);
    });
  }, [adminClients, adminsSearch]);

  const openCreateClient = () => {
    setClientDialogMode('create');
    setClientEditorTarget(null);
    setClientForm(emptyClientForm);
    setClientDialogOpen(true);
  };

  const openEditClient = (client: AdminClientRow) => {
    setClientDialogMode('edit');
    setClientEditorTarget(client);
    setClientForm({
      full_name: client.full_name ?? '',
      email: client.email ?? '',
      password: '',
      business_name: client.business_name ?? '',
      contact_email: client.contact_email ?? client.email ?? '',
      contact_phone: client.contact_phone ?? client.phone ?? '',
      city: client.city ?? '',
      subscription_status: client.subscription_status ?? 'pending_approval',
      plan: (client.plan as PlanType) || 'Starter',
      monthly_price: client.monthly_price ? String(client.monthly_price) : '',
      features: client.features ?? [],
      internal_notes: client.internal_notes ?? '',
    });
    setClientDialogOpen(true);
  };

  const openAppointmentDialog = (appointment?: AppointmentRow) => {
    if (appointment) {
      const appointmentClientId = appointment.client_id ?? appointment.clients?.id ?? '';
      setAppointmentEditorTarget(appointment);
      setAppointmentForm({
        clientId: appointmentClientId,
        client_name: appointment.client_name,
        client_phone: appointment.client_phone ?? '',
        service: appointment.service,
        cost: Number(appointment.cost || 0),
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        notes: appointment.notes ?? '',
      });
    } else {
      setAppointmentEditorTarget(null);
      setAppointmentForm({
        ...emptyAppointmentForm,
        date: today,
        time: '10:00',
      });
    }
    setAppointmentDialogOpen(true);
  };

  const openScriptDialog = (script?: QAScript) => {
    if (script) {
      const linkedClient = clients.find((client) => client.client_id === script.client_id || client.id === script.user_id);
      setScriptEditorTarget(script);
      setScriptForm({
        clientProfileId: linkedClient?.id ?? '',
        clientId: linkedClient?.client_id ?? script.client_id ?? '',
        question: script.question,
        answer: script.answer,
        category: script.category,
        is_active: script.is_active,
      });
    } else {
      setScriptEditorTarget(null);
      setScriptForm(emptyScriptForm);
    }
    setScriptDialogOpen(true);
  };

  const openReminderDialog = (reminder?: ReminderRow) => {
    if (reminder) {
      setReminderEditorTarget(reminder);
      setReminderForm({
        clientProfileId: reminder.user_id,
        title: reminder.title,
        message: reminder.message,
        recipient_phone: reminder.recipient_phone ?? '',
        scheduled_at: reminder.scheduled_at.slice(0, 16),
        status: reminder.sent ? 'sent' : 'pending',
      });
    } else {
      setReminderEditorTarget(null);
      setReminderForm(emptyReminderForm);
    }
    setReminderDialogOpen(true);
  };

  const withBusy = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await action();
    } finally {
      setBusyKey(null);
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    if (!approveTarget.client_id) {
      toast.error('Client record is missing for this profile');
      return;
    }
    await withBusy(`approve-${approveTarget.id}`, async () => {
      const label = approvalForm.service_label.trim() || SERVICE_LABELS[approvalForm.service_type];
      const payload = {
        subscription_status: 'active',
        service_type: approvalForm.service_type,
        service_label: label,
        features: approvalForm.features,
        approved_at: new Date().toISOString(),
        approved_by: myProfileId,
        monthly_price: Number(approvalForm.monthly_price || 0),
        plan: approvalForm.plan,
        internal_notes: approvalForm.notes || null,
      };
      console.log('Approve payload:', JSON.stringify(payload));
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', approveTarget.client_id);
      if (error) throw error;

      const { data: profileData, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('client_id', approveTarget.client_id)
        .single();

      if (profileLookupError) {
        console.error('Approve notification profile lookup error:', JSON.stringify(profileLookupError));
      }

      // Notification is best-effort and must not block approval.
      if (profileData?.id) {
        const { error: notificationError } = await supabase.from('notifications').insert({
          recipient_id: profileData.id,
          type: 'account_approved',
          title: 'Your account is approved!',
          message: `You now have access to ${label}. Start exploring your dashboard.`,
          is_read: false,
        });

        if (notificationError) {
          console.error('Approve notification insert error:', JSON.stringify(notificationError));
        }
      }

      toast.success(`${approveTarget.business_name || approveTarget.full_name} approved`);
      setClients((prev) => {
        const next = prev.map((client) => (
          client.id === approveTarget.id
            ? {
                ...client,
                subscription_status: 'active' as SubscriptionStatus,
                service_type: approvalForm.service_type,
                service_label: label,
                features: approvalForm.features,
                approved_at: payload.approved_at,
                approved_by: payload.approved_by,
                monthly_price: payload.monthly_price,
                plan: payload.plan,
                internal_notes: payload.internal_notes,
              }
            : client
        ));
        const exists = next.some((client) => client.id === approveTarget.id);
        return exists
          ? next
          : [...next, {
              ...approveTarget,
              subscription_status: 'active' as SubscriptionStatus,
              service_type: approvalForm.service_type,
              service_label: label,
              features: approvalForm.features,
              approved_at: payload.approved_at,
              approved_by: payload.approved_by,
              monthly_price: payload.monthly_price,
              plan: payload.plan,
              internal_notes: payload.internal_notes,
            }];
      });
      setAppointmentClients((prev) => prev.map((client) => (
        client.id === approveTarget.client_id
          ? { ...client, subscription_status: 'active' as SubscriptionStatus }
          : client
      )));
      setApproveTarget(null);
    }).catch((error: unknown) => {
      console.error('Approve error:', JSON.stringify(error));
      toast.error(error instanceof Error ? error.message : 'Failed to approve client');
    });
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    if (declineReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    await withBusy(`decline-${declineTarget.id}`, async () => {
      const { error } = await supabase.from('clients').upsert({
        id: declineTarget.client_id,
        profile_id: declineTarget.id,
        subscription_status: 'rejected',
        rejection_reason: declineReason.trim(),
      }, { onConflict: 'id' });
      if (error) throw error;
      toast.success(`${declineTarget.business_name || declineTarget.full_name} declined`);
      setDeclineTarget(null);
      setDeclineReason('');
      await load();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to decline client'));
  };

  const saveClient = async () => {
    await withBusy(clientDialogMode === 'create' ? 'client-create' : 'client-save', async () => {
      if (clientDialogMode === 'create') {
        const derivedFullName = clientForm.business_name.trim();
        const derivedEmail = clientForm.contact_email.trim();
        if (!derivedFullName || !derivedEmail) {
          toast.error('Business name and contact email are required');
          return;
        }
        if (!clientForm.password.trim()) {
          toast.error('Password is required for new clients');
          return;
        }

        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: derivedEmail,
            password: clientForm.password,
            full_name: derivedFullName,
            phone: clientForm.contact_phone,
            business_name: clientForm.business_name,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create user');
        }

        const { data: profile, error: profileLookupError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', derivedEmail)
          .maybeSingle();
        if (profileLookupError) throw profileLookupError;
        if (!profile) throw new Error('Created user profile was not found');

        const { data: insertedClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            profile_id: profile.id,
            business_name: clientForm.business_name || null,
            contact_email: clientForm.contact_email || derivedEmail,
            contact_phone: clientForm.contact_phone || null,
            city: clientForm.city || null,
            subscription_status: clientForm.subscription_status,
            plan: clientForm.plan,
            monthly_price: Number(clientForm.monthly_price || 0),
            features: clientForm.features,
            notes: clientForm.internal_notes || null,
          })
          .select('*')
          .single();
        if (clientError) throw clientError;

        await supabase.from('profiles').update({ client_id: insertedClient?.id }).eq('id', profile.id);
        toast.success('Client created');
      } else if (clientEditorTarget) {
        const clientId = clientEditorTarget.client_id || clientEditorTarget.id;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: clientForm.business_name || null,
          })
          .eq('client_id', clientId);
        if (profileError) {
          console.error('[All Clients] profile update error:', profileError);
          throw profileError;
        }

        const clientPayload = {
          business_name: clientForm.business_name || null,
          contact_email: clientForm.contact_email || clientForm.email,
          contact_phone: clientForm.contact_phone || null,
          city: clientForm.city || null,
          subscription_status: clientForm.subscription_status,
          plan: clientForm.plan,
          monthly_price: Number(clientForm.monthly_price || 0),
          features: clientForm.features,
          internal_notes: clientForm.internal_notes || null,
        };

        const { error: clientError } = await supabase
          .from('clients')
          .update(clientPayload)
          .eq('id', clientId);
        if (clientError) {
          console.error('[All Clients] client update error:', clientError);
          throw clientError;
        }

        const updateClientRecord = (client: AdminClientRow) => (
          (client.client_id || client.id) === clientId
            ? {
                ...client,
                business_name: clientForm.business_name || null,
                contact_email: clientForm.contact_email || client.contact_email || client.email,
                contact_phone: clientForm.contact_phone || null,
                city: clientForm.city || null,
                subscription_status: clientForm.subscription_status,
                plan: clientForm.plan,
                monthly_price: Number(clientForm.monthly_price || 0),
                features: clientForm.features,
                internal_notes: clientForm.internal_notes || null,
              }
            : client
        );

        setClients((prev) => prev.map(updateClientRecord));
        setAdminClients((prev) => prev.map(updateClientRecord));

        setAppointmentClients((prev) => prev.map((client) => (
          client.id === clientId
            ? {
                ...client,
                business_name: clientForm.business_name || null,
                subscription_status: clientForm.subscription_status,
              }
            : client
        )));
        toast.success('Client updated');
      }

      setClientDialogOpen(false);
    }).catch((error: unknown) => {
      console.error('Save error:', JSON.stringify(error));
      toast.error(error instanceof Error ? error.message : 'Failed to save client');
    });
  };

  const handleClientStatus = async (client: AdminClientRow, nextStatus: 'paused' | 'active') => {
    const clientId = client.client_id || client.id;
    await withBusy(`client-status-${client.id}`, async () => {
      const { error } = await supabase
        .from('clients')
        .update({ subscription_status: nextStatus })
        .eq('id', clientId);
      if (error) {
        console.error('[All Clients] pause client error:', error);
        throw error;
      }

      setClients((prev) => prev.map((item) => (
        (item.client_id || item.id) === clientId
          ? { ...item, subscription_status: nextStatus }
          : item
      )));
      setAdminClients((prev) => prev.map((item) => (
        (item.client_id || item.id) === clientId
          ? { ...item, subscription_status: nextStatus }
          : item
      )));

      setAppointmentClients((prev) => prev.map((item) => (
        item.id === clientId
          ? { ...item, subscription_status: nextStatus }
          : item
      )));

      toast.success(nextStatus === 'paused' ? 'Client paused' : 'Client activated');
    }).catch((error: unknown) => {
      console.error('[All Clients] pause operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update client status');
    });
  };

  const saveAppointment = async () => {
    await withBusy(appointmentEditorTarget ? `appointment-save-${appointmentEditorTarget.id}` : 'appointment-create', async () => {
      if (!appointmentForm.clientId || !appointmentForm.client_name.trim() || !appointmentForm.service.trim()) {
        toast.error(ui.clientRequired);
        return;
      }

      const linkedClient = [...clients, ...adminClients].find((client) => client.client_id === appointmentForm.clientId);
      if (!linkedClient) {
        toast.error(ui.clientNotFound);
        return;
      }

      const payload = {
        // Always persist the selected dropdown value as client_id.
        // This prevents accidental fallback to the logged-in admin linkage.
        client_id: appointmentForm.clientId,
        customer_name: appointmentForm.client_name.trim(),
        customer_phone: appointmentForm.client_phone.trim() || null,
        service: appointmentForm.service.trim(),
        cost: Number(appointmentForm.cost || 0),
        date: appointmentForm.date.slice(0, 10),
        time: appointmentForm.time.slice(0, 5),
        status: appointmentForm.status,
        notes: appointmentForm.notes.trim() || null,
      };

      const query = appointmentEditorTarget
        ? supabase.from('appointments').update(payload).eq('id', appointmentEditorTarget.id)
        : supabase.from('appointments').insert(payload);
      const { error } = await query;
      if (error) {
        console.error('[Admin/Appointments] save error:', {
          error,
          payload,
          selectedClientId: appointmentForm.clientId,
          selectedClientBusiness: linkedClient.business_name ?? linkedClient.full_name ?? null,
          appointmentId: appointmentEditorTarget?.id ?? null,
        });
        throw error;
      }

      toast.success(appointmentEditorTarget ? ui.appointmentUpdated : ui.appointmentCreated);
      setAppointmentDialogOpen(false);
      await load();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : ui.saveAppointmentFailed));
  };

  const saveScript = async () => {
    await withBusy(scriptEditorTarget ? `script-save-${scriptEditorTarget.id}` : 'script-create', async () => {
      if (!scriptForm.clientProfileId || !scriptForm.question.trim() || !scriptForm.answer.trim()) {
        toast.error('Client, question, and answer are required');
        return;
      }
      const payload = {
        user_id: scriptForm.clientProfileId,
        client_id: scriptForm.clientId || null,
        question: scriptForm.question,
        answer: scriptForm.answer,
        category: scriptForm.category,
        is_active: scriptForm.is_active,
      };

      const query = scriptEditorTarget
        ? supabase.from('qa_scripts').update(payload).eq('id', scriptEditorTarget.id)
        : supabase.from('qa_scripts').insert(payload);
      const { error } = await query;
      if (error) throw error;

      toast.success(scriptEditorTarget ? 'Script updated' : 'Script created');
      setScriptDialogOpen(false);
      await load();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to save script'));
  };

  const saveReminder = async () => {
    await withBusy(reminderEditorTarget ? `reminder-save-${reminderEditorTarget.id}` : 'reminder-create', async () => {
      if (!reminderForm.clientProfileId || !reminderForm.title.trim() || !reminderForm.message.trim()) {
        toast.error('Client, title, and message are required');
        return;
      }
      const payload = {
        user_id: reminderForm.clientProfileId,
        title: reminderForm.title,
        message: reminderForm.message,
        recipient_phone: reminderForm.recipient_phone || null,
        scheduled_at: reminderForm.scheduled_at,
        sent: reminderForm.status === 'sent',
      };

      const query = reminderEditorTarget
        ? supabase.from('reminders').update(payload).eq('id', reminderEditorTarget.id)
        : supabase.from('reminders').insert(payload);
      const { error } = await query;
      if (error) throw error;

      toast.success(reminderEditorTarget ? 'Reminder updated' : 'Reminder created');
      setReminderDialogOpen(false);
      await load();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to save reminder'));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await withBusy(`delete-${confirmDelete.type}-${confirmDelete.id}`, async () => {
      let error: { message: string } | null = null;

      if (confirmDelete.type === 'client') {
        const clientId = confirmDelete.id;

        const { data: profileData, error: err0 } = await supabase
          .from('profiles')
          .select('id')
          .eq('client_id', clientId)
          .single();
        if (err0) {
          console.error('Step 0 failed:', JSON.stringify(err0));
          throw err0;
        }
        const profileId = profileData?.id ?? null;

        const { error: err1 } = await supabase
          .from('clients')
          .update({ profile_id: null })
          .eq('id', clientId);
        if (err1) {
          console.error('Step 1 failed:', JSON.stringify(err1));
          throw err1;
        }

        if (profileId) {
          const { error: err2 } = await supabase
            .from('notifications')
            .delete()
            .eq('recipient_id', profileId);
          if (err2) {
            console.error('Step 2 failed:', JSON.stringify(err2));
            throw err2;
          }
        }

        const { data: convs, error: err3 } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', clientId);
        if (err3) {
          console.error('Step 3 failed:', JSON.stringify(err3));
          throw err3;
        }
        const conversationIds = (convs || []).map((conv) => conv.id);

        if (conversationIds.length > 0) {
          const { error: err4 } = await supabase
            .from('conversation_messages')
            .delete()
            .in('conversation_id', conversationIds);
          if (err4) {
            console.error('Step 4 failed:', JSON.stringify(err4));
            throw err4;
          }
        }

        const { error: err5 } = await supabase
          .from('conversations')
          .delete()
          .eq('client_id', clientId);
        if (err5) {
          console.error('Step 5 failed:', JSON.stringify(err5));
          throw err5;
        }

        const { error: err6 } = await supabase
          .from('appointments')
          .delete()
          .eq('client_id', clientId);
        if (err6) {
          console.error('Step 6 failed:', JSON.stringify(err6));
          throw err6;
        }

        const { error: err7 } = await supabase
          .from('scheduled_reminders')
          .delete()
          .eq('client_id', clientId);
        if (err7) {
          console.error('Step 7 failed:', JSON.stringify(err7));
          throw err7;
        }

        const { error: err8 } = await supabase
          .from('reminders')
          .delete()
          .eq('client_id', clientId);
        if (err8) {
          console.error('Step 8 failed:', JSON.stringify(err8));
          throw err8;
        }

        const { error: err9 } = await supabase
          .from('qa_scripts')
          .delete()
          .eq('client_id', clientId);
        if (err9) {
          console.error('Step 9 failed:', JSON.stringify(err9));
          throw err9;
        }

        const { error: err10 } = await supabase
          .from('client_settings')
          .delete()
          .eq('client_id', clientId);
        if (err10) {
          console.error('Step 10 failed:', JSON.stringify(err10));
          throw err10;
        }

        if (profileId) {
          const { error: err11 } = await supabase
            .from('xray_results')
            .delete()
            .eq('user_id', profileId);
          if (err11) {
            console.error('Step 11 failed:', JSON.stringify(err11));
            throw err11;
          }
        }

        const { error: err12 } = await supabase
          .from('contact_requests')
          .delete()
          .eq('converted_to_client_id', clientId);
        if (err12) {
          console.error('Step 12 failed:', JSON.stringify(err12));
          throw err12;
        }

        if (profileId) {
          const { error: err13 } = await supabase
            .from('profiles')
            .delete()
            .eq('id', profileId);
          if (err13) {
            console.error('Step 13 failed:', JSON.stringify(err13));
            throw err13;
          }
        }

        const { error: err14 } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);
        if (err14) {
          console.error('Step 14 failed:', JSON.stringify(err14));
          throw err14;
        }

        if (profileId) {
          try {
            await fetch('/api/admin/delete-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: profileId }),
            });
          } catch (e) {
            console.error('Auth user delete failed:', e);
          }
        }

        setClients((prev) => prev.filter((c) => c.id !== clientId));
        setAdminClients((prev) => prev.filter((c) => c.id !== clientId));
        toast.success(`${confirmDelete.label} deleted`);
        setAppointmentClients((prev) => prev.filter((c) => c.id !== clientId));
      } else if (confirmDelete.type === 'appointment') {
        ({ error } = await supabase.from('appointments').delete().eq('id', confirmDelete.id));
      } else if (confirmDelete.type === 'conversation') {
        ({ error } = await supabase.from('conversations').delete().eq('id', confirmDelete.id));
      } else if (confirmDelete.type === 'script') {
        ({ error } = await supabase.from('qa_scripts').delete().eq('id', confirmDelete.id));
      } else if (confirmDelete.type === 'reminder') {
        ({ error } = await supabase.from('reminders').delete().eq('id', confirmDelete.id));
      } else if (confirmDelete.type === 'contact') {
        ({ error } = await supabase.from('contact_requests').delete().eq('id', confirmDelete.id));
      }

      if (error) throw error;
      if (confirmDelete.type !== 'client') {
        toast.success(`${confirmDelete.label} deleted`);
      }
      setConfirmDelete(null);
    }).catch((deleteError: unknown) => {
      console.error('[All Clients] delete operation failed:', JSON.stringify(deleteError));
      const errorMessage =
        deleteError instanceof Error
          ? deleteError.message
          : (typeof deleteError === 'object' && deleteError !== null && 'message' in deleteError)
            ? String((deleteError as { message?: unknown }).message ?? 'Unknown error')
            : 'Unknown error';
      toast.error(`Delete failed at: ${errorMessage}`);
    });
  };

  const openConversationThread = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessagesOpen(true);
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(error.message);
      setConversationMessages([]);
    } else {
      setConversationMessages((data || []) as ConversationMessage[]);
    }
    setMessagesLoading(false);
  };

  const saveContactNotes = async (contact: ContactRequestRow) => {
    await withBusy(`contact-notes-${contact.id}`, async () => {
      const { error } = await supabase
        .from('contact_requests')
        .update({ admin_notes: contact.admin_notes ?? null })
        .eq('id', contact.id);
      if (error) throw error;
      toast.success('Admin notes saved');
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save admin notes');
    });
  };

  const markConversationResolved = async (conversation: Conversation) => {
    await withBusy(`conversation-resolve-${conversation.id}`, async () => {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversation.id);
      if (error) throw error;
      toast.success('Conversation marked as resolved');
      await load();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to update conversation'));
  };

  const markContactStatus = async (contactId: string, status: ContactRequestStatus) => {
    await withBusy(`contact-status-${contactId}-${status}`, async () => {
      const { error } = await supabase.from('contact_requests').update({ status }).eq('id', contactId);
      if (error) throw error;
      toast.success('Contact request updated');
      await load();
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to update contact request'));
  };

  const convertContactToClient = async (contact: ContactRequestRow) => {
    openCreateClient();
    setClientForm({
      ...emptyClientForm,
      full_name: contact.full_name,
      email: contact.email ?? '',
      business_name: contact.business_name ?? '',
      contact_email: contact.email ?? '',
      contact_phone: contact.phone ?? contact.whatsapp ?? '',
      city: contact.city ?? '',
    });
    await markContactStatus(contact.id, 'converted');
  };

  const renderBusyIcon = (key: string) => busyKey === key ? <Loader2 className="animate-spin" /> : null;
  const tabSections: Array<{
    label: string;
    items: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }>;
  }> = [
    {
      label: 'CLIENTS',
      items: [
        { key: 'pending', label: ui.pendingApprovals, icon: Clock3 },
        { key: 'clients', label: ui.allClients, icon: Users },
        { key: 'admins', label: 'Admins', icon: Shield },
      ],
    },
    {
      label: 'APPOINTMENTS',
      items: [
        { key: 'appointments', label: ui.allAppointments, icon: Calendar },
        { key: 'twentyfour-appointments', label: 'TwentyFour Appointments', icon: CalendarCheck },
      ],
    },
    {
      label: 'TOOLS',
      items: [
        { key: 'inbox', label: ui.inbox, icon: MessageSquare },
        { key: 'scripts', label: ui.scriptsLibrary, icon: FileText },
        { key: 'reminders', label: ui.reminders, icon: Bell },
        { key: 'contacts', label: ui.contactRequests, icon: Mail },
            { key: 'onboarding-submissions', label: ui.onboardingSubmissions, icon: FileText },
      ],
    },
    {
      label: 'ANALYTICS',
      items: [
        { key: 'twentyfour-stats', label: 'TwentyFour Stats', icon: BarChart3 },
        { key: 'client-stats', label: 'Client Stats', icon: LineChart },
        { key: 'dashboard-control', label: 'Dashboard Control', icon: Settings2 },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8">
      <div className="border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ui.adminControlCenter}</h1>
          <p className="mt-1 text-sm text-muted-foreground">TwentyFour platform management</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <TabsList className="flex h-auto w-full shrink-0 items-start gap-3 overflow-x-auto bg-transparent p-0 pb-2 lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:overflow-visible lg:pb-0">
            {tabSections.map((section) => (
              <div key={section.label} className="flex shrink-0 flex-col gap-1 lg:w-full">
                <div className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">{section.label}</div>
                {section.items.map(({ key, label, icon: Icon }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="inline-flex w-auto items-center justify-start gap-2 rounded-lg px-3 py-2 text-left text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:border-l-2 data-[state=active]:border-amber-500 data-[state=active]:bg-accent data-[state=active]:font-medium data-[state=active]:text-foreground lg:w-full"
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                    {key === 'pending' ? <Badge className="ms-auto bg-red-500/15 text-red-500">{pendingClients.length}</Badge> : null}
                  </TabsTrigger>
                ))}
              </div>
            ))}
          </TabsList>
          <div className="min-w-0 flex-1 space-y-6">

        <TabsContent value="pending" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-amber-500 text-black hover:bg-amber-400" onClick={openCreateClient}>
              <Plus />
              {ui.addNewClient}
            </Button>
          </div>
          {loading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{ui.loadingPending}</CardContent></Card>
          ) : pendingClients.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="No clients waiting for approval right now."
            />
          ) : pendingClients.map((client) => (
            <Card key={client.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{client.business_name || client.full_name || ui.untitledClient}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                    <p className="text-sm text-muted-foreground">{client.contact_phone || client.phone || '-'}</p>
                    <p className="text-xs text-muted-foreground">{ui.signupDate}: {new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => {
                      setApproveTarget(client);
                      setApprovalForm({
                        service_type: 'ai_chatbot',
                        service_label: SERVICE_LABELS.ai_chatbot,
                        features: SERVICE_DEFAULTS.ai_chatbot,
                        monthly_price: client.monthly_price ? String(client.monthly_price) : '',
                        plan: (client.plan as PlanType) || 'Starter',
                        notes: client.internal_notes ?? '',
                      });
                    }}>
                      {renderBusyIcon(`approve-${client.id}`)}
                      {ui.approve}
                    </Button>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setDeclineTarget(client)}>
                      {ui.decline}
                    </Button>
                    <Button variant="outline" onClick={() => openEditClient(client)}>{ui.viewDetails}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          {loading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{ui.loadingClients}</CardContent></Card>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{ui.allClients}</h2>
                  <Badge variant="secondary">{filteredClients.length}</Badge>
                </div>
                <Button className="bg-amber-500 text-black hover:bg-amber-400" onClick={openCreateClient}>
                  <Plus />
                  {ui.addNewClient}
                </Button>
              </div>
              <Input
                value={clientsSearch}
                onChange={(event) => setClientsSearch(event.target.value)}
                placeholder={ui.searchClients}
              />
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{ta.clientName}</TableHead>
                        <TableHead>{ui.status}</TableHead>
                        <TableHead>{ui.plan}</TableHead>
                        <TableHead>{ui.monthlyPrice}</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>{ui.approvedAt}</TableHead>
                        <TableHead className="text-right">{ui.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => {
                        const clientId = client.client_id || client.id;
                        const isPaused = client.subscription_status === 'paused';
                        return (
                          <TableRow
                            key={client.id}
                            className={`transition-colors hover:bg-muted/40 ${isPaused ? 'opacity-80' : ''}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold uppercase text-amber-500">
                                  {(client.business_name || client.full_name || 'C').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{client.business_name || client.full_name || ui.untitledClient}</p>
                                  <p className="text-xs text-muted-foreground">{client.contact_email || client.email || '-'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_BADGE_CLASS[client.subscription_status ?? 'pending_approval']}>
                                {client.subscription_status}
                              </Badge>
                            </TableCell>
                            <TableCell>{client.plan || '-'}</TableCell>
                            <TableCell>{Number(client.monthly_price || 0).toLocaleString()} EGP</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(client.features || []).map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {client.approved_at ? new Date(client.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditClient(client)}>
                                  <Pencil />
                                  {common.edit}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={isPaused ? 'border-green-500/40 text-green-600 hover:bg-green-500/10' : 'border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10'}
                                  onClick={() => handleClientStatus(client, isPaused ? 'active' : 'paused')}
                                >
                                  <Check />
                                  {isPaused ? 'Resume' : ui.pause}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setConfirmDelete({
                                    type: 'client',
                                    id: clientId,
                                    label: client.business_name || client.full_name || ta.clientName,
                                  })}
                                >
                                  <Trash2 />
                                  {ui.delete}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <AdminsTab
            clients={filteredAdminClients}
            search={adminsSearch}
            onSearchChange={setAdminsSearch}
            currentProfileId={myProfileId}
            onEdit={(clientId) => {
              const fullClient = adminClients.find((item) => (item.client_id || item.id) === clientId);
              if (fullClient) openEditClient(fullClient);
            }}
            onRefresh={load}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex min-h-[620px] flex-col lg:flex-row">
              <aside className="w-full shrink-0 border-b border-border lg:h-[620px] lg:w-[260px] lg:border-b-0 lg:border-r">
                <div className="border-b border-border p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={appointmentClientSearch}
                      onChange={(event) => setAppointmentClientSearch(event.target.value)}
                      placeholder={ui.searchClients}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="max-h-[540px] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setClientFilter('all')}
                    className={`flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors ${clientFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-500">
                        A
                      </div>
                      <span className="text-sm font-medium">{ui.allClients}</span>
                    </div>
                    <Badge variant="secondary">{appointmentCounts.totalCount}</Badge>
                  </button>
                  {appointmentClientRows.map(({ client, clientUuid, count }) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setClientFilter(clientUuid)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors ${clientFilter === clientUuid ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold uppercase text-amber-500">
                          {(client.business_name || 'C').charAt(0)}
                        </div>
                        <span className="truncate text-sm font-medium">{client.business_name || ta.clientName}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedAppointmentClientName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAppointmentCount} {ui.appointmentsCount}</p>
                  </div>
                  <Button onClick={() => openAppointmentDialog()}>
                    <Plus />
                    {ui.newAppointment}
                  </Button>
                </div>
                <div className="space-y-3 border-b border-border p-4">
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['all', 'All Time'],
                      ['today', 'Today'],
                      ['week', 'This Week'],
                      ['month', 'This Month'],
                    ] as Array<[DatePreset, string]>).map(([preset, label]) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        className={appointmentDatePreset === preset ? 'border-amber-500 bg-amber-500/10 text-amber-500' : ''}
                        onClick={() => setAppointmentDatePreset(preset)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                  <Select value={appointmentStatusFilter} onValueChange={(value) => setAppointmentStatusFilter((value ?? 'all') as 'all' | AppointmentStatus)}>
                    <SelectTrigger><SelectValue placeholder={ui.filterByStatus} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{ui.allStatuses}</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                    <Input type="date" value={appointmentFrom} onChange={(event) => setAppointmentFrom(event.target.value)} />
                    <Input type="date" value={appointmentTo} onChange={(event) => setAppointmentTo(event.target.value)} />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-4">
                  {filteredAppointments.length === 0 ? (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                      <Calendar className="mb-3 size-10 text-muted-foreground/50" />
                      <p className="font-medium">{ui.noAppointmentsYet}</p>
                      <p className="text-sm text-muted-foreground">{ui.noAppointmentsHint}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{ui.customerName}</TableHead>
                          {clientFilter === 'all' ? <TableHead>{ta.clientName}</TableHead> : null}
                          <TableHead>{ta.clientPhone}</TableHead>
                          <TableHead>{ui.service}</TableHead>
                          <TableHead>{ui.bookingCost}</TableHead>
                          <TableHead>{ui.date}</TableHead>
                          <TableHead>{ui.time}</TableHead>
                          <TableHead>{ui.status}</TableHead>
                          <TableHead>{ui.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.client_name}</TableCell>
                            {clientFilter === 'all' ? <TableCell>{appointment.clients?.business_name || clientsByClientId[appointment.client_id || '']?.business_name || '-'}</TableCell> : null}
                            <TableCell>{appointment.client_phone || '-'}</TableCell>
                            <TableCell>{appointment.service}</TableCell>
                            <TableCell>{Number(appointment.cost || 0).toLocaleString()} EGP</TableCell>
                            <TableCell>{appointment.date}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              <Badge className={APPOINTMENT_BADGE_CLASS[appointment.status]}>{appointment.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon-sm" onClick={() => openAppointmentDialog(appointment)}>
                                  <Pencil />
                                </Button>
                                <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setConfirmDelete({ type: 'appointment', id: appointment.id, label: appointment.client_name })}>
                                  <Trash2 />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="twentyfour-appointments" className="space-y-4">
          <TwentyFourAppointmentsTab />
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          {groupedConversations.map((group) => (
            <Card key={group.client.id}>
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left">
                  <div>
                    <p className="font-semibold">{group.client.business_name || group.client.full_name || group.client.email}</p>
                    <p className="text-sm text-muted-foreground">{group.items.length} conversations</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 px-6 pb-6">
                  {group.items.map((conversation) => (
                    <div key={conversation.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{conversation.contact_name}</p>
                          <p className="text-sm text-muted-foreground">{conversation.contact_phone}</p>
                          <p className="text-sm text-muted-foreground">{conversation.last_message || 'No messages yet'}</p>
                          <p className="text-xs text-muted-foreground">{conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString() : '-'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{conversation.unread_count > 0 ? 'Open' : 'Resolved'}</Badge>
                          <Button variant="outline" size="sm" onClick={() => openConversationThread(conversation)}>View Thread</Button>
                          <Button variant="outline" size="sm" onClick={() => markConversationResolved(conversation)}>
                            {renderBusyIcon(`conversation-resolve-${conversation.id}`)}
                            Mark Resolved
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete({ type: 'conversation', id: conversation.id, label: conversation.contact_name })}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openScriptDialog()}>
              <Plus />
              New Script
            </Button>
          </div>
          {groupedScripts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No scripts yet"
              description="Scripts let your AI agents respond consistently for each client. Create your first script to get started."
              actionLabel="+ New Script"
              onAction={() => openScriptDialog()}
            />
          ) : groupedScripts.map((group) => (
            <Card key={group.client.id}>
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left">
                  <div>
                    <p className="font-semibold">{group.client.business_name || group.client.full_name || group.client.email}</p>
                    <p className="text-sm text-muted-foreground">{group.items.length} scripts</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((script) => (
                        <TableRow key={script.id}>
                          <TableCell>{script.question}</TableCell>
                          <TableCell>{script.answer}</TableCell>
                          <TableCell>{script.category}</TableCell>
                          <TableCell>{group.client.business_name || group.client.full_name}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openScriptDialog(script)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete({ type: 'script', id: script.id, label: script.question })}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openReminderDialog()}>
              <Plus />
              New Reminder
            </Button>
          </div>
          {groupedReminders.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No reminders yet"
              description="Schedule automated reminders for client appointments and follow-ups."
              actionLabel="+ New Reminder"
              onAction={() => openReminderDialog()}
            />
          ) : groupedReminders.map((group) => (
            <Card key={group.client.id}>
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left">
                  <div>
                    <p className="font-semibold">{group.client.business_name || group.client.full_name || group.client.email}</p>
                    <p className="text-sm text-muted-foreground">{group.items.length} reminders</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Scheduled At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((reminder) => (
                        <TableRow key={reminder.id}>
                          <TableCell>{reminder.title}</TableCell>
                          <TableCell>{reminder.message}</TableCell>
                          <TableCell>{new Date(reminder.scheduled_at).toLocaleString()}</TableCell>
                          <TableCell><Badge variant={reminder.sent ? 'default' : 'secondary'}>{reminder.sent ? 'sent' : 'pending'}</Badge></TableCell>
                          <TableCell>{group.client.business_name || group.client.full_name}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openReminderDialog(reminder)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete({ type: 'reminder', id: reminder.id, label: reminder.title })}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder={ui.searchContactRequests} value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} />
            <Select value={contactFilter} onValueChange={(value) => setContactFilter((value ?? 'all') as 'all' | ContactRequestStatus)}>
              <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredContacts.length === 0 && contacts.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No contact requests"
              description="Form submissions from twentyfour.app/contact will appear here."
            />
          ) : filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">No matching contact requests.</CardContent>
            </Card>
          ) : filteredContacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{contact.status ?? 'new'}</Badge>
                      <p className="font-semibold">{contact.full_name}</p>
                      <p className="text-muted-foreground">{contact.business_name || '-'}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.email || '-'}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone || contact.whatsapp || '-'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => markContactStatus(contact.id, 'contacted')}>{ui.markContacted}</Button>
                    <Button variant="outline" onClick={() => markContactStatus(contact.id, 'closed')}>{ui.markResolved}</Button>
                    <Button variant="outline" onClick={() => convertContactToClient(contact)}>{ui.convertToClient}</Button>
                    <Button variant="destructive" onClick={() => setConfirmDelete({ type: 'contact', id: contact.id, label: contact.full_name })}>{ui.delete}</Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Business Type:</span> {contact.business_type || '-'}</p>
                    <p><span className="font-medium text-foreground">City:</span> {contact.city || '-'}</p>
                    <p><span className="font-medium text-foreground">Team Size:</span> {contact.team_size || '-'}</p>
                    <p><span className="font-medium text-foreground">Timeline:</span> {contact.timeline || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Daily Operations:</span> {contact.daily_operations || '-'}</p>
                    <p><span className="font-medium text-foreground">Current Tools:</span> {contact.current_tools || '-'}</p>
                    <p><span className="font-medium text-foreground">Recurring Problems:</span> {contact.recurring_problems || '-'}</p>
                    <p><span className="font-medium text-foreground">Automation Goals:</span> {contact.automation_goals || '-'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{ui.adminNotes}</Label>
                  <Textarea
                    value={contact.admin_notes ?? ''}
                    onChange={(event) => {
                      setContacts((current) => current.map((item) => item.id === contact.id ? { ...item, admin_notes: event.target.value } : item));
                    }}
                    placeholder="Internal notes for this lead"
                  />
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => saveContactNotes(contact)}>
                      {renderBusyIcon(`contact-notes-${contact.id}`)}
                      {ui.saveNotes}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="onboarding-submissions" className="space-y-4">
          <OnboardingSubmissionsTab onRefresh={load} />
        </TabsContent>

        <TabsContent value="twentyfour-stats" className="space-y-4">
          <TwentyFourStatsTab />
        </TabsContent>

        <TabsContent value="client-stats" className="space-y-4">
          <ClientStatsTab />
        </TabsContent>

        <TabsContent value="dashboard-control" className="space-y-4">
          <DashboardControlTab />
        </TabsContent>
          </div>
        </div>
      </Tabs>

      <Dialog open={Boolean(approveTarget)} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Approve {approveTarget?.business_name || approveTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {(Object.keys(SERVICE_LABELS) as Exclude<ServiceType, null>[]).map((serviceType) => (
                  <Button
                    key={serviceType}
                    type="button"
                    variant={approvalForm.service_type === serviceType ? 'default' : 'outline'}
                    onClick={() => setApprovalForm((current) => ({
                      ...current,
                      service_type: serviceType,
                      service_label: SERVICE_LABELS[serviceType],
                      features: SERVICE_DEFAULTS[serviceType],
                    }))}
                  >
                    {SERVICE_LABELS[serviceType]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Display Label</Label>
              <Input value={approvalForm.service_label} onChange={(event) => setApprovalForm((current) => ({ ...current, service_label: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Dashboard Sections</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="capitalize">{feature}</span>
                    <Switch
                      checked={approvalForm.features.includes(feature)}
                      onCheckedChange={(checked) => setApprovalForm((current) => ({
                        ...current,
                        features: checked
                          ? Array.from(new Set([...current.features, feature]))
                          : current.features.filter((item) => item !== feature),
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Monthly Price</Label>
                <Input type="number" value={approvalForm.monthly_price} onChange={(event) => setApprovalForm((current) => ({ ...current, monthly_price: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={approvalForm.plan} onValueChange={(value) => setApprovalForm((current) => ({ ...current, plan: (value ?? 'Starter') as PlanType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Scale">Scale</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea value={approvalForm.notes} onChange={(event) => setApprovalForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button onClick={handleApprove}>
              {renderBusyIcon(`approve-${approveTarget?.id}`)}
              Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(declineTarget)} onOpenChange={(open) => !open && setDeclineTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Decline {declineTarget?.business_name || declineTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline}>
              {renderBusyIcon(`decline-${declineTarget?.id}`)}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{clientDialogMode === 'create' ? 'Add New Client' : `Edit ${clientEditorTarget?.business_name || clientEditorTarget?.full_name}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={clientForm.business_name} onChange={(event) => setClientForm((current) => ({ ...current, business_name: event.target.value }))} />
            </div>
            {clientDialogMode === 'create' ? (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={clientForm.password} onChange={(event) => setClientForm((current) => ({ ...current, password: event.target.value }))} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={clientForm.contact_email} onChange={(event) => setClientForm((current) => ({ ...current, contact_email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input value={clientForm.contact_phone} onChange={(event) => setClientForm((current) => ({ ...current, contact_phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={clientForm.city} onChange={(event) => setClientForm((current) => ({ ...current, city: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Subscription Status</Label>
              <Select value={clientForm.subscription_status} onValueChange={(value) => setClientForm((current) => ({ ...current, subscription_status: (value ?? 'pending_approval') as SubscriptionStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_approval">pending_approval</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="trial">trial</SelectItem>
                  <SelectItem value="paused">paused</SelectItem>
                  <SelectItem value="rejected">rejected</SelectItem>
                  <SelectItem value="cancelled">cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={clientForm.plan} onValueChange={(value) => setClientForm((current) => ({ ...current, plan: (value ?? 'Starter') as PlanType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                  <SelectItem value="Scale">Scale</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly Price</Label>
              <Input type="number" value={clientForm.monthly_price} onChange={(event) => setClientForm((current) => ({ ...current, monthly_price: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="capitalize">{feature}</span>
                  <Switch
                    checked={clientForm.features.includes(feature)}
                    onCheckedChange={(checked) => setClientForm((current) => ({
                      ...current,
                      features: checked
                        ? Array.from(new Set([...current.features, feature]))
                        : current.features.filter((item) => item !== feature),
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea value={clientForm.internal_notes} onChange={(event) => setClientForm((current) => ({ ...current, internal_notes: event.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveClient}>
              {renderBusyIcon(clientDialogMode === 'create' ? 'client-create' : 'client-save')}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{appointmentEditorTarget ? ui.editAppointment : ui.newAppointment}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{ta.clientName}</Label>
              <Select
                value={appointmentForm.clientId}
                onValueChange={(value) => {
                  const nextValue = value ?? '';
                  setAppointmentForm((current) => ({
                    ...current,
                    clientId: nextValue,
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder={ui.selectClient} /></SelectTrigger>
                <SelectContent>
                  {appointmentClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.business_name || ta.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{ui.customerName}</Label>
              <Input value={appointmentForm.client_name} onChange={(event) => setAppointmentForm((current) => ({ ...current, client_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{ui.customerPhone}</Label>
              <Input value={appointmentForm.client_phone} onChange={(event) => setAppointmentForm((current) => ({ ...current, client_phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{ui.service}</Label>
              <Input value={appointmentForm.service} onChange={(event) => setAppointmentForm((current) => ({ ...current, service: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{ui.bookingCost}</Label>
              <Input type="number" min="0" value={appointmentForm.cost} onChange={(event) => setAppointmentForm((current) => ({ ...current, cost: Number(event.target.value || 0) }))} />
            </div>
            <div className="space-y-2">
              <Label>{ui.status}</Label>
              <Select value={appointmentForm.status} onValueChange={(value) => setAppointmentForm((current) => ({ ...current, status: (value ?? 'pending') as AppointmentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="confirmed">confirmed</SelectItem>
                  <SelectItem value="cancelled">cancelled</SelectItem>
                  <SelectItem value="completed">completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{ui.date}</Label>
              <Input type="date" value={appointmentForm.date} onChange={(event) => setAppointmentForm((current) => ({ ...current, date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{ui.time}</Label>
              <Input type="time" value={appointmentForm.time} onChange={(event) => setAppointmentForm((current) => ({ ...current, time: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{ui.notes}</Label>
              <Textarea value={appointmentForm.notes} onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialogOpen(false)}>{common.cancel}</Button>
            <Button onClick={saveAppointment}>
              {renderBusyIcon(appointmentEditorTarget ? `appointment-save-${appointmentEditorTarget.id}` : 'appointment-create')}
              {common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{scriptEditorTarget ? 'Edit Script' : 'New Script'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={scriptForm.clientProfileId}
                onValueChange={(value) => {
                  const nextValue = value ?? '';
                  const linkedClient = clientsByProfileId[nextValue];
                  setScriptForm((current) => ({
                    ...current,
                    clientProfileId: nextValue,
                    clientId: linkedClient?.client_id ?? '',
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.business_name || client.full_name || client.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea value={scriptForm.question} onChange={(event) => setScriptForm((current) => ({ ...current, question: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea value={scriptForm.answer} onChange={(event) => setScriptForm((current) => ({ ...current, answer: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={scriptForm.category} onChange={(event) => setScriptForm((current) => ({ ...current, category: event.target.value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Active</span>
                <Switch checked={scriptForm.is_active} onCheckedChange={(checked) => setScriptForm((current) => ({ ...current, is_active: checked }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveScript}>
              {renderBusyIcon(scriptEditorTarget ? `script-save-${scriptEditorTarget.id}` : 'script-create')}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{reminderEditorTarget ? 'Edit Reminder' : 'New Reminder'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Client</Label>
              <Select value={reminderForm.clientProfileId} onValueChange={(value) => setReminderForm((current) => ({ ...current, clientProfileId: value ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.business_name || client.full_name || client.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={reminderForm.title} onChange={(event) => setReminderForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={reminderForm.status} onValueChange={(value) => setReminderForm((current) => ({ ...current, status: (value ?? 'pending') as 'pending' | 'sent' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="sent">sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recipient Phone</Label>
              <Input value={reminderForm.recipient_phone} onChange={(event) => setReminderForm((current) => ({ ...current, recipient_phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Scheduled At</Label>
              <Input type="datetime-local" value={reminderForm.scheduled_at} onChange={(event) => setReminderForm((current) => ({ ...current, scheduled_at: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Message</Label>
              <Textarea value={reminderForm.message} onChange={(event) => setReminderForm((current) => ({ ...current, message: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveReminder}>
              {renderBusyIcon(reminderEditorTarget ? `reminder-save-${reminderEditorTarget.id}` : 'reminder-create')}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{ui.confirmDelete}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{confirmDelete?.label ? `${common.delete} ${confirmDelete.label}? ${ui.deleteActionCannotBeUndone}` : ui.deleteActionCannotBeUndone}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>{common.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete}>
              {renderBusyIcon(confirmDelete ? `delete-${confirmDelete.type}-${confirmDelete.id}` : '')}
              {common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedConversation?.contact_name || 'Conversation Thread'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-auto pr-1">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="animate-spin" />
              </div>
            ) : conversationMessages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
            ) : conversationMessages.map((message) => (
              <div key={message.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge variant="secondary">{message.sender}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
