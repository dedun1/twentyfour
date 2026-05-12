import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { runPipeline } from '../lib/agents/pipeline';
import type { BudgetRange, CapturedFacts, ConsultantOutput, TranscriptMessage } from '../lib/agents/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function normalizeTranscript(raw: unknown): TranscriptMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: TranscriptMessage[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const role = r.role === 'user' || r.role === 'assistant' ? r.role : null;
    const content = typeof r.content === 'string' ? r.content : '';
    if (role) out.push({ role, content });
  }
  return out;
}

function budgetFromRow(raw: unknown): BudgetRange {
  const br = typeof raw === 'string' ? raw : null;
  if (br === 'under_300' || br === '300_to_1000' || br === '1000_plus' || br === 'not_sure') return br;
  return 'not_sure';
}

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: tsx scripts/retry-pipeline.ts <session-id>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[retry-pipeline] Loading session ${sessionId}...`);
  const { data: session, error } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session) {
    console.error('[retry-pipeline] Session not found:', error?.message);
    process.exit(1);
  }

  const recs = session.recommendations as unknown[] | null;
  const recCount = Array.isArray(recs) ? recs.length : 0;
  console.log(
    `[retry-pipeline] Session loaded. status=${session.status} pipeline_status=${session.pipeline_status} rec_count=${recCount}`,
  );

  // Reconstruct ConsultantOutput from DB columns. The pipeline only
  // reads a subset of these fields, so we provide what we have and
  // fall back to sensible defaults.
  const consultantOutput = {
    business_summary: String(session.business_summary ?? ''),
    contact: {
      name: typeof session.contact_name === 'string' ? session.contact_name : undefined,
      email: typeof session.captured_email === 'string' ? session.captured_email : undefined,
      phone: typeof session.captured_phone === 'string' ? session.captured_phone : undefined,
      business_name: typeof session.captured_business_name === 'string' ? session.captured_business_name : undefined,
    },
    raw_data: {
      budget_range: budgetFromRow(session.captured_budget_range),
    },
    captured_facts: (session.captured_facts ?? {}) as CapturedFacts,
    transcript: normalizeTranscript(session.transcript),
  } as ConsultantOutput;

  console.log('[retry-pipeline] Reset pipeline_status to running...');
  await supabase.from('onboarding_sessions').update({ pipeline_status: 'running', pipeline_error: null }).eq('id', sessionId);

  console.log('[retry-pipeline] Firing runPipeline...');
  try {
    await runPipeline(sessionId, consultantOutput);
    console.log('[retry-pipeline] Pipeline completed successfully.');
  } catch (err) {
    console.error('[retry-pipeline] Pipeline failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

void main();
