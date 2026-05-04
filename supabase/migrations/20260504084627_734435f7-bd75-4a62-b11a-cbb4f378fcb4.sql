REVOKE EXECUTE ON FUNCTION public.recompute_trust_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_asanti_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_report_change() FROM PUBLIC, anon, authenticated;

-- Seed tiers for existing users
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_trust_tier(r.id);
  END LOOP;
END $$;