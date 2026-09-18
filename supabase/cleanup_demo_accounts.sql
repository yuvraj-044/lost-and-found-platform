-- ============================================================
-- Findr — Remove All Demo Accounts
-- Run this in your Supabase SQL Editor to purge all demo users
-- ============================================================

-- 1. Delete demo user profiles from public.users
DELETE FROM public.users 
WHERE id IN (
  'd1111111-1111-1111-1111-111111111111',
  'd2222222-2222-2222-2222-222222222222'
);

-- 2. Delete demo users from auth.users (also cascades to related claims/items if any)
DELETE FROM auth.users 
WHERE email IN (
  'demo1@findr.com',
  'demo2@findr.com',
  'demo.student@findr.com',
  'admin.staff@findr.com'
)
OR id IN (
  'd1111111-1111-1111-1111-111111111111',
  'd2222222-2222-2222-2222-222222222222'
);

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
