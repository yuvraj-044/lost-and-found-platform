-- ============================================================
-- Lost & Found Platform — Initial Database Schema (Idempotent)
-- Safe to run multiple times in Supabase SQL Editor.
-- ============================================================

-- ─── 1. Custom ENUM Types (Safe Check) ───────────────────────

DO $$ BEGIN
    CREATE TYPE item_type AS ENUM ('LOST', 'FOUND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ─── 2. Tables ───────────────────────────────────────────────

-- Public user profiles (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost and Found item reports
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type item_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status item_status DEFAULT 'ACTIVE' NOT NULL,
    category TEXT,
    location TEXT,
    date_of_incident DATE,
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim requests on items
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status claim_status DEFAULT 'PENDING' NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── 3. Indexes ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_items_status ON public.items (status);
CREATE INDEX IF NOT EXISTS idx_items_type ON public.items (type);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items (category);
CREATE INDEX IF NOT EXISTS idx_items_reporter_id ON public.items (reporter_id);
CREATE INDEX IF NOT EXISTS idx_claims_item_id ON public.claims (item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON public.claims (claimant_id);


-- ─── 4. Row Level Security ───────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Users Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Items Policies
DROP POLICY IF EXISTS "Active items are viewable by everyone" ON public.items;
CREATE POLICY "Active items are viewable by everyone"
ON public.items FOR SELECT
USING (status = 'ACTIVE');

DROP POLICY IF EXISTS "Reporters can view their own items regardless of status" ON public.items;
CREATE POLICY "Reporters can view their own items regardless of status"
ON public.items FOR SELECT
USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Authenticated users can create items" ON public.items;
CREATE POLICY "Authenticated users can create items"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.items;
CREATE POLICY "Users can update own items"
ON public.items FOR UPDATE
USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can delete own items" ON public.items;
CREATE POLICY "Users can delete own items"
ON public.items FOR DELETE
USING (auth.uid() = reporter_id);

-- Claims Policies
DROP POLICY IF EXISTS "Authenticated users can create claims" ON public.claims;
CREATE POLICY "Authenticated users can create claims"
ON public.claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = claimant_id);

DROP POLICY IF EXISTS "Users can view related claims" ON public.claims;
CREATE POLICY "Users can view related claims"
ON public.claims FOR SELECT
USING (
  auth.uid() = claimant_id
  OR
  auth.uid() = (SELECT reporter_id FROM public.items WHERE items.id = claims.item_id)
);

DROP POLICY IF EXISTS "Item owners can update claim status" ON public.claims;
CREATE POLICY "Item owners can update claim status"
ON public.claims FOR UPDATE
USING (
  auth.uid() = (SELECT reporter_id FROM public.items WHERE items.id = claims.item_id)
);


-- ─── 5. Auto-create profile on signup (trigger) ─────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Anonymous'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 6. Updated_at auto-refresh triggers ─────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_items_updated_at ON public.items;
CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_claims_updated_at ON public.claims;
CREATE TRIGGER set_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
