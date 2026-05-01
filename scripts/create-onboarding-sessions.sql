-- Run in Supabase SQL Editor before testing the unified onboarding + contact flow.
-- Creates AI consultation sessions storage + anonymous rate limiting + RLS.

-- Ensure UUID generation is available (Supabase typically has this already).
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- nullable: anonymous sessions don't have a user yet
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  -- captured from the conversation (especially anonymous users)
  captured_email text,
  captured_phone text,
  captured_business_name text,
  -- session lifecycle
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  is_anonymous boolean NOT NULL DEFAULT true,
  language text DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  -- AI consultation data
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  business_summary text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  -- admin workflow
  contacted_at timestamptz,
  contacted_by uuid REFERENCES auth.users(id),
  admin_notes text,
  -- timestamps
  completed_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_client_id ON onboarding_sessions(client_id);
CREATE INDEX idx_onboarding_sessions_status ON onboarding_sessions(status);
CREATE INDEX idx_onboarding_sessions_created_at ON onboarding_sessions(created_at DESC);
CREATE INDEX idx_onboarding_sessions_captured_email ON onboarding_sessions(captured_email);

CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_updated_at
BEFORE UPDATE ON onboarding_sessions
FOR EACH ROW EXECUTE FUNCTION update_onboarding_updated_at();

-- Rate-limiting table for anonymous abuse prevention
CREATE TABLE onboarding_rate_limits (
  ip_address text PRIMARY KEY,
  session_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_rate_limits ENABLE ROW LEVEL SECURITY;

-- Authenticated users: own sessions only
CREATE POLICY "users_own_sessions_select" ON onboarding_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_own_sessions_update" ON onboarding_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "users_own_sessions_delete" ON onboarding_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Admins: full access
CREATE POLICY "admin_all_sessions_select" ON onboarding_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "admin_all_sessions_update" ON onboarding_sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "admin_all_sessions_delete" ON onboarding_sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Anonymous sessions are created/updated server-side using the service role
-- key (which bypasses RLS), so no anonymous policy is needed.

GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_sessions TO authenticated;
GRANT ALL ON onboarding_rate_limits TO service_role;

-- Additions for enhanced consultation outputs
ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS monthly_revenue_at_risk numeric,
  ADD COLUMN IF NOT EXISTS captured_budget_range text;

