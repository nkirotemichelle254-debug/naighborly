
-- BLOCKS
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own blocks" ON public.blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can create their own blocks" ON public.blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete their own blocks" ON public.blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- PUSH SUBSCRIPTIONS
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions select" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own subscriptions insert" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own subscriptions delete" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WEB PUSH CONFIG (VAPID keys; backend only)
CREATE TABLE public.web_push_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  public_key text NOT NULL,
  private_key text NOT NULL,
  subject text NOT NULL DEFAULT 'mailto:notify@naighborly.app',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.web_push_config TO service_role;
ALTER TABLE public.web_push_config ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role can access (RLS denies all authenticated/anon access).

-- Seed VAPID keys generated for this project
INSERT INTO public.web_push_config (public_key, private_key) VALUES (
  'BFMaEuWjG8RENHXLTVshTLoktggyvE9MemvFMUZmIBobfxVhLmDn4GleSop6hHr0K-XRXM7apEq4vJwxBPTnP3o',
  'oWEg3CbuDGneR1No1690558liMm68UZe6PakERDgw8U'
);
