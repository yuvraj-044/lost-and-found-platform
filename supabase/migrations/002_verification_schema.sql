-- 002_verification_schema.sql
-- Migration to add private ownership details, verification fields, and admin role

-- 1. Add private_details column to items (JSONB) – stores array of secret details
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS private_details jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Add verification_status and verification_answers to claims
ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS verification_answers jsonb;

-- Check constraint for verification_status
DO $$ BEGIN
  ALTER TABLE public.claims
    ADD CONSTRAINT chk_verification_status CHECK (verification_status IN ('pending', 'passed', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add is_admin column to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

