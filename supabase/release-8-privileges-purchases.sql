-- Release 8: privileged RPCs must only be callable via the server-side service role.
DO $$
DECLARE f record;
BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE n.nspname='public' AND p.prosecdef
 LOOP
   EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
   EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS stock_purchases_one_per_lead
  ON public.stock_purchases(lead_id) WHERE lead_id IS NOT NULL;
ALTER FUNCTION public.is_admin() SET search_path = '';
