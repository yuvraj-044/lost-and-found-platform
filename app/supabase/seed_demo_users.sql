-- ============================================================
-- Findr — Demo Accounts Seed Script
-- Run this in your Supabase SQL Editor (takes 2 seconds)
-- It creates 2 pre-confirmed demo accounts & confirms your personal account
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Confirm any existing unconfirmed accounts (including yuvraj@pccoepune.org)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Demo User 1 (The Reporter / Finder)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd1111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo1@findr.com',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alex Rivera (Reporter)"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Demo User 2 (The Claimant / Owner)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd2222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'demo2@findr.com',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jordan Chen (Claimant)"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Ensure Public Profile Records are Created
INSERT INTO public.users (id, full_name, avatar_url)
VALUES 
  ('d1111111-1111-1111-1111-111111111111', 'Alex Rivera', NULL),
  ('d2222222-2222-2222-2222-222222222222', 'Jordan Chen', NULL)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
