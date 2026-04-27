export type Language = 'ar' | 'en';
export type UserRole = 'admin' | 'client';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type SubscriptionStatus = 'active' | 'trial' | 'pending_approval' | 'paused' | 'cancelled' | 'rejected';
export type FeatureKey = 'appointments' | 'whatsapp' | 'scripts' | 'xray' | 'reports' | 'reminders';
export type ServiceType = 'ai_chatbot' | 'booking_system' | 'crm_automation' | 'custom_workflow' | 'full_suite' | null;

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  business_name?: string;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
}

export interface ClientRecord {
  id: string;
  business_name?: string;
  owner_whatsapp?: string;
  features: FeatureKey[];
  subscription_status: SubscriptionStatus;
  setup_fee?: number;
  monthly_price?: number;
  plan?: string;
  rejection_reason?: string;
  service_type?: ServiceType;
  service_label?: string;
  notes?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_name: string;
  client_phone?: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  send_whatsapp?: boolean;
  created_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface QAScript {
  id: string;
  user_id?: string;
  client_id?: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  message: string;
  recipient_phone?: string;
  scheduled_at: string;
  sent: boolean;
  created_at: string;
}

export interface ScheduledReminder {
  id: string;
  appointment_id: string;
  user_id: string;
  recipient_phone: string;
  message: string;
  scheduled_at: string;
  sent: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  last_message?: string;
  last_message_at?: string;
  is_bot_active: boolean;
  unread_count: number;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender: 'bot' | 'human' | 'client';
  content: string;
  created_at: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
}

export interface OnboardingData {
  businessName: string;
  businessType: string;
  services: string;
  targetAudience: string;
  goals: string;
  challenges: string;
  teamSize: string;
}

export interface StatCardData {
  label: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
}

export interface AdminClient {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  business_name?: string;
  owner_whatsapp?: string;
  features?: FeatureKey[];
  subscription_status?: SubscriptionStatus;
  setup_fee?: number;
  monthly_price?: number;
  plan?: string;
  rejection_reason?: string;
  role: UserRole;
  onboarding_completed?: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

export interface XRayOpportunity {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  selected?: boolean;
}

export interface XRayResult {
  id: string;
  user_id: string;
  opportunities: XRayOpportunity[];
  summary: string;
  created_at: string;
}

export interface IntakeAnswer {
  id: string;
  user_id: string;
  question_key: string;
  answer: string;
  created_at: string;
}

export type ContactRequestStatus = 'new' | 'contacted' | 'converted' | 'closed';

export interface ContactRequest {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  business_name?: string;
  business_type?: string;
  city?: string;
  team_size?: string;
  years_in_business?: string;
  daily_operations?: string;
  client_acquisition?: string;
  current_tools?: string;
  daily_volume?: string;
  time_wasters?: string;
  recurring_problems?: string;
  one_thing_to_fix?: string;
  automation_goals?: string;
  timeline?: string;
  source?: string;
  challenge?: string;
  message?: string;
  status?: ContactRequestStatus;
  created_at: string;
}
