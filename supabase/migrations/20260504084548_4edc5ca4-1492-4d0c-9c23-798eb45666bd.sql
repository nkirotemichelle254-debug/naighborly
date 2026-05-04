-- Trust tier enum
CREATE TYPE public.trust_tier AS ENUM ('new', 'verified', 'active', 'trusted', 'pillar');

-- Add tier + counters to profiles
ALTER TABLE public.profiles
  ADD COLUMN trust_tier public.trust_tier NOT NULL DEFAULT 'new',
  ADD COLUMN asanti_received integer NOT NULL DEFAULT 0;

-- Asanti (kudos) table
CREATE TABLE public.asanti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  thread_id uuid NOT NULL,
  message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asanti_no_self CHECK (giver_id <> receiver_id),
  CONSTRAINT asanti_unique_per_thread UNIQUE (giver_id, receiver_id, thread_id)
);

ALTER TABLE public.asanti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can view asanti"
  ON public.asanti FOR SELECT TO authenticated USING (true);

CREATE POLICY "Givers create their own asanti"
  ON public.asanti FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = giver_id AND public.is_thread_participant(thread_id, auth.uid()));

CREATE POLICY "Givers can withdraw their asanti"
  ON public.asanti FOR DELETE TO authenticated
  USING (auth.uid() = giver_id);

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  post_id uuid,
  reason text NOT NULL,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_target_check CHECK (reported_user_id IS NOT NULL OR post_id IS NOT NULL)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters view their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can file reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Recompute trust tier for a single user
CREATE OR REPLACE FUNCTION public.recompute_trust_tier(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_avatar boolean;
  has_bio boolean;
  has_neighborhood boolean;
  email_confirmed boolean;
  thanks_count integer;
  distinct_thanks integer;
  posts_count integer;
  threads_count integer;
  open_reports integer;
  account_age_days integer;
  new_tier public.trust_tier;
BEGIN
  SELECT
    COALESCE(LENGTH(TRIM(p.avatar_url)) > 0, false),
    COALESCE(LENGTH(TRIM(p.bio)) > 0, false),
    COALESCE(LENGTH(TRIM(p.neighborhood)) > 0, false),
    EXTRACT(DAY FROM (now() - p.created_at))::int
  INTO has_avatar, has_bio, has_neighborhood, account_age_days
  FROM public.profiles p WHERE p.id = _user_id;

  SELECT (u.email_confirmed_at IS NOT NULL) INTO email_confirmed
  FROM auth.users u WHERE u.id = _user_id;

  SELECT COUNT(*), COUNT(DISTINCT giver_id) INTO thanks_count, distinct_thanks
  FROM public.asanti WHERE receiver_id = _user_id;

  SELECT COUNT(*) INTO posts_count FROM public.posts WHERE owner_id = _user_id;

  SELECT COUNT(*) INTO threads_count
  FROM public.threads WHERE user_a = _user_id OR user_b = _user_id;

  SELECT COUNT(*) INTO open_reports
  FROM public.reports WHERE reported_user_id = _user_id AND status = 'open';

  IF distinct_thanks >= 20 AND account_age_days >= 60 AND open_reports = 0 THEN
    new_tier := 'pillar';
  ELSIF distinct_thanks >= 5 AND open_reports = 0 AND has_avatar AND email_confirmed THEN
    new_tier := 'trusted';
  ELSIF has_avatar AND has_bio AND has_neighborhood AND email_confirmed
        AND (posts_count >= 3 OR threads_count >= 5) AND account_age_days >= 14 THEN
    new_tier := 'active';
  ELSIF has_avatar AND has_bio AND has_neighborhood AND email_confirmed THEN
    new_tier := 'verified';
  ELSE
    new_tier := 'new';
  END IF;

  UPDATE public.profiles
  SET trust_tier = new_tier,
      asanti_received = thanks_count
  WHERE id = _user_id;
END;
$$;

-- Trigger fns
CREATE OR REPLACE FUNCTION public.on_asanti_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_trust_tier(OLD.receiver_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_trust_tier(NEW.receiver_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER asanti_recompute
AFTER INSERT OR DELETE ON public.asanti
FOR EACH ROW EXECUTE FUNCTION public.on_asanti_change();

CREATE OR REPLACE FUNCTION public.on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recompute when fields that affect tier change
  IF (NEW.avatar_url IS DISTINCT FROM OLD.avatar_url)
     OR (NEW.bio IS DISTINCT FROM OLD.bio)
     OR (NEW.neighborhood IS DISTINCT FROM OLD.neighborhood) THEN
    PERFORM public.recompute_trust_tier(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_recompute
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_profile_change();

CREATE OR REPLACE FUNCTION public.on_report_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reported_user_id IS NOT NULL THEN
    PERFORM public.recompute_trust_tier(NEW.reported_user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER report_recompute
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.on_report_change();

-- Indexes
CREATE INDEX idx_asanti_receiver ON public.asanti(receiver_id);
CREATE INDEX idx_asanti_thread ON public.asanti(thread_id);
CREATE INDEX idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX idx_reports_post ON public.reports(post_id);