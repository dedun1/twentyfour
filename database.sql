-- TwentyFour Database Migration
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. ALTER profiles table (existing)
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- ============================================================
-- 2. CREATE clients table (stores subscription + features per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  features text[] DEFAULT '{}',
  subscription_status text DEFAULT 'pending_approval'
    CHECK (subscription_status IN ('active', 'trial', 'pending_approval', 'paused', 'cancelled')),
  owner_whatsapp text,
  setup_fee numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policies: users can read their own record; admins can read/write all
CREATE POLICY "Users can view own client record"
  ON clients FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage all clients"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. CREATE scheduled_reminders table
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  message text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled reminders"
  ON scheduled_reminders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. CREATE xray_results table
-- ============================================================
CREATE TABLE IF NOT EXISTS xray_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  opportunities jsonb DEFAULT '[]',
  summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xray_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xray results"
  ON xray_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own xray results"
  ON xray_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. CREATE intake_answers table (for X-Ray questionnaire)
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intake_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own intake answers"
  ON intake_answers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. CREATE contact_requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  whatsapp text,
  business_type text,
  challenge text,
  source text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Public insert (no auth required for contact form)
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can read contact requests"
  ON contact_requests FOR SELECT
  USING (true);

-- ============================================================
-- 7. CREATE qa_scripts table
-- ============================================================
CREATE TABLE IF NOT EXISTS qa_scripts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE qa_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own qa scripts"
  ON qa_scripts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. CREATE conversations table (WhatsApp inbox)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  is_bot_active boolean DEFAULT true,
  unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 9. CREATE conversation_messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('bot', 'human', 'client')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages of own conversations"
  ON conversation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Enable realtime for conversation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;

-- ============================================================
-- 10. Make sure appointments table has send_whatsapp column
-- ============================================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS send_whatsapp boolean DEFAULT false;
