-- ============================================================
-- Fix "Database error querying schema" in Supabase Auth
-- Run this in Supabase SQL Editor (takes 1 second)
-- ============================================================

-- 1. Remove manually inserted SQL users that have missing GoTrue identity data
DELETE FROM auth.users WHERE email IN ('demo1@findr.com', 'demo2@findr.com');

-- 2. Ensure all string columns in auth.users are non-null empty strings
-- (GoTrue Go scanner throws 'Database error querying schema' when scanning NULL strings)
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '');

-- 3. Confirm your accounts so they can sign in immediately
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
