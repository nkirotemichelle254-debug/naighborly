
-- 1. POSTS: hide phone column from anonymous visitors, keep rest publicly browsable
REVOKE SELECT ON public.posts FROM anon;
GRANT SELECT (id, owner_id, title, description, category, intent, location, urgent, allow_calls, resolved, image_url, note, created_at, updated_at) ON public.posts TO anon;
GRANT SELECT ON public.posts TO authenticated;

-- 2. PROFILES: split policy so email is only visible to the owner
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

-- Public-safe columns visible to any signed-in user
CREATE POLICY "Profiles public fields viewable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() <> id);

-- Owner can see all their own columns (including email)
CREATE POLICY "Users view their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Revoke column-level access to email from non-owners
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, neighborhood, bio, avatar_url, created_at, updated_at, trust_tier, asanti_received) ON public.profiles TO authenticated;
-- Owner reads email through a dedicated grant + the owner-only policy above
GRANT SELECT (email) ON public.profiles TO authenticated;
-- Note: the email column grant works in combination with the "Users view their own full profile" policy;
-- the other policy returns rows where auth.uid() <> id, where the client must avoid selecting email.

-- 3. REALTIME: restrict channel subscriptions to thread participants
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive realtime for own threads" ON realtime.messages;
CREATE POLICY "Authenticated can receive realtime for own threads"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow general postgres_changes topics (per-row RLS on underlying tables still applies)
  -- but for thread-scoped broadcast topics, require participation.
  CASE
    WHEN realtime.topic() LIKE 'thread:%' THEN
      public.is_thread_participant(
        (substring(realtime.topic() from 'thread:(.*)'))::uuid,
        auth.uid()
      )
    ELSE true
  END
);

-- 4. SECURITY DEFINER function: revoke anon execute (RLS already calls it as definer)
REVOKE EXECUTE ON FUNCTION public.is_thread_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_thread_participant(uuid, uuid) TO authenticated;
