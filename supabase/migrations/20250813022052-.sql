-- Security hardening migration
-- 1) Purchases table for authorization
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug text NOT NULL,
  edition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_slug, edition)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS: own rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='purchases' AND policyname='Users can view their own purchases'
  ) THEN
    CREATE POLICY "Users can view their own purchases"
    ON public.purchases
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='purchases' AND policyname='Users can create their own purchases'
  ) THEN
    CREATE POLICY "Users can create their own purchases"
    ON public.purchases
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin elevated access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='purchases' AND policyname='Admins can view all purchases'
  ) THEN
    CREATE POLICY "Admins can view all purchases"
    ON public.purchases
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='purchases' AND policyname='Admins can manage purchases'
  ) THEN
    CREATE POLICY "Admins can manage purchases"
    ON public.purchases
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 2) Enforce one-time demo claims per user/game
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'demo_claims_user_game_unique'
  ) THEN
    CREATE UNIQUE INDEX demo_claims_user_game_unique ON public.demo_claims (user_id, game_slug);
  END IF;
END $$;

-- 3) Triggers to auto-assign auth.uid() where applicable
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_games_created_by_tr') THEN
    CREATE TRIGGER set_games_created_by_tr
    BEFORE INSERT ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_game_downloads_created_by_tr') THEN
    CREATE TRIGGER set_game_downloads_created_by_tr
    BEFORE INSERT ON public.game_downloads
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_uploads_user_id_tr') THEN
    CREATE TRIGGER set_uploads_user_id_tr
    BEFORE INSERT ON public.uploads
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_demo_claims_user_id_tr') THEN
    CREATE TRIGGER set_demo_claims_user_id_tr
    BEFORE INSERT ON public.demo_claims
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id();
  END IF;
END $$;

-- 4) Lock down public SELECT on sensitive tables
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_downloads' AND policyname='Public can view downloads'
  ) THEN
    DROP POLICY "Public can view downloads" ON public.game_downloads;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='game_downloads' AND policyname='Owners or admins can view downloads'
  ) THEN
    CREATE POLICY "Owners or admins can view downloads"
    ON public.game_downloads
    FOR SELECT
    USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='uploads' AND policyname='Public can view uploads'
  ) THEN
    DROP POLICY "Public can view uploads" ON public.uploads;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='uploads' AND policyname='Owners or admins can view uploads'
  ) THEN
    CREATE POLICY "Owners or admins can view uploads"
    ON public.uploads
    FOR SELECT
    USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 5) Private storage bucket for binaries
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-binaries', 'game-binaries', false)
ON CONFLICT (id) DO NOTHING;

-- Admin-only management of bucket objects; no public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can manage game-binaries'
  ) THEN
    CREATE POLICY "Admins can manage game-binaries"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'game-binaries' AND has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (bucket_id = 'game-binaries' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 6) Add storage_path mapping to game_downloads for signed URL resolution
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='game_downloads' AND column_name='storage_path'
  ) THEN
    ALTER TABLE public.game_downloads ADD COLUMN storage_path text;
  END IF;
END $$;