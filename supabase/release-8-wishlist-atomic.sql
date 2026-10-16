-- Merge duplicate wishlists without dropping saved items.
WITH ranked AS (
  SELECT id, profile_id,
         first_value(id) OVER (PARTITION BY profile_id ORDER BY id) AS canonical_id
  FROM public.wishlists
)
INSERT INTO public.wishlist_items(wishlist_id,sku)
SELECT DISTINCT r.canonical_id, i.sku FROM ranked r
JOIN public.wishlist_items i ON i.wishlist_id=r.id
ON CONFLICT (wishlist_id,sku) DO NOTHING;

WITH ranked AS (
 SELECT id, row_number() OVER (PARTITION BY profile_id ORDER BY id) AS rn
 FROM public.wishlists
)
DELETE FROM public.wishlists w USING ranked r
WHERE w.id=r.id AND r.rn>1;

CREATE UNIQUE INDEX IF NOT EXISTS wishlists_one_per_customer_idx
ON public.wishlists(profile_id);

CREATE OR REPLACE FUNCTION public.sync_current_wishlist(p_skus text[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE v_profile_id uuid; v_wishlist_id uuid;
BEGIN
  v_profile_id := auth.uid();
  IF v_profile_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF coalesce(array_length(p_skus,1),0)>200 THEN RAISE EXCEPTION 'Wishlist limit exceeded'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_profile_id::text));
  INSERT INTO public.wishlists(profile_id) VALUES(v_profile_id)
    ON CONFLICT (profile_id) DO NOTHING;
  SELECT id INTO v_wishlist_id FROM public.wishlists WHERE profile_id=v_profile_id;
  IF v_wishlist_id IS NULL THEN RAISE EXCEPTION 'Wishlist unavailable'; END IF;
  DELETE FROM public.wishlist_items WHERE wishlist_id=v_wishlist_id
    AND NOT (sku = ANY(coalesce(p_skus,ARRAY[]::text[])));
  INSERT INTO public.wishlist_items(wishlist_id,sku)
    SELECT v_wishlist_id, val FROM unnest(coalesce(p_skus,ARRAY[]::text[])) AS val
    WHERE length(val)>0
    ON CONFLICT (wishlist_id,sku) DO NOTHING;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_current_wishlist(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_current_wishlist(text[]) TO authenticated;