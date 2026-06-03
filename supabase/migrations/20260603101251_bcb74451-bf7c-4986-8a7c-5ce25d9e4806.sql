CREATE OR REPLACE FUNCTION public.recompute_trust_tier(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  has_avatar boolean;
  has_bio boolean;
  has_neighborhood boolean;
  email_confirmed boolean;
  thanks_count integer;
  distinct_thanks integer;
  posts_count integer;
  resolved_count integer;
  threads_count integer;
  responded_threads integer;
  open_reports integer;
  account_age_days integer;
  resolution_rate numeric;
  response_rate numeric;
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

  SELECT COUNT(*), COUNT(*) FILTER (WHERE resolved)
  INTO posts_count, resolved_count
  FROM public.posts WHERE owner_id = _user_id;

  SELECT COUNT(*) INTO threads_count
  FROM public.threads WHERE user_a = _user_id OR user_b = _user_id;

  -- Threads where this user has sent at least one message
  SELECT COUNT(DISTINCT t.id) INTO responded_threads
  FROM public.threads t
  WHERE (t.user_a = _user_id OR t.user_b = _user_id)
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.thread_id = t.id AND m.sender_id = _user_id
    );

  SELECT COUNT(*) INTO open_reports
  FROM public.reports WHERE reported_user_id = _user_id AND status = 'open';

  resolution_rate := CASE WHEN posts_count > 0 THEN resolved_count::numeric / posts_count ELSE 1 END;
  response_rate := CASE WHEN threads_count > 0 THEN responded_threads::numeric / threads_count ELSE 1 END;

  IF distinct_thanks >= 20 AND account_age_days >= 60 AND open_reports = 0 AND response_rate >= 0.6 THEN
    new_tier := 'pillar';
  ELSIF distinct_thanks >= 5 AND open_reports = 0 AND has_avatar AND email_confirmed AND response_rate >= 0.5 THEN
    new_tier := 'trusted';
  ELSIF has_avatar AND has_bio AND has_neighborhood AND email_confirmed
        AND (posts_count >= 3 OR threads_count >= 5)
        AND account_age_days >= 14
        AND (posts_count < 3 OR resolution_rate >= 0.3)
        AND (threads_count < 5 OR response_rate >= 0.4) THEN
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
$function$;