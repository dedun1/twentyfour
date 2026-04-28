-- Run this once in Supabase SQL Editor.
-- Backfill clients.profile_id where profiles.client_id is set but clients.profile_id is NULL.
-- This repairs the bidirectional link that was missing on existing admin records.

UPDATE clients c
SET profile_id = p.id
FROM profiles p
WHERE p.client_id = c.id
  AND c.profile_id IS NULL;

-- Verification query (run after the UPDATE to confirm zero rows remain unlinked):
-- SELECT c.id, c.business_name, p.id AS profile_id, p.role
-- FROM clients c
-- JOIN profiles p ON p.client_id = c.id
-- WHERE c.profile_id IS NULL;
-- Expected result: 0 rows
