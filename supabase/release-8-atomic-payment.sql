CREATE OR REPLACE FUNCTION public.finalize_paid_order(p_order_id text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_provider text;
  v_intent text;
  v_expected integer;
  v_changed integer;
BEGIN
  SELECT status::text, payment_provider::text, payment_intent_id
    INTO v_status,v_provider,v_intent
    FROM public.orders WHERE id=upper(p_order_id) FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_status='PAID' THEN RETURN false; END IF;
  IF v_status<>'PENDING_PAYMENT' THEN RETURN false; END IF;
  IF v_provider='stripe' AND (v_intent IS NULL OR v_intent='') THEN
    RAISE EXCEPTION 'Payment intent required';
  END IF;
  SELECT count(DISTINCT sku) INTO v_expected
    FROM public.order_items WHERE order_id=upper(p_order_id);
  IF v_expected = 0 THEN RAISE EXCEPTION 'Order has no items'; END IF;
  UPDATE public.inventory_items ii
    SET status='SOLD',sold_at=now(),updated_at=now()
    WHERE ii.sku IN (SELECT sku FROM public.order_items WHERE order_id=upper(p_order_id))
      AND ii.status='RESERVED'
      AND (ii.checkout_hold_order_id=upper(p_order_id) OR ii.checkout_hold_order_id IS NULL);
  GET DIAGNOSTICS v_changed=ROW_COUNT;
  IF v_changed <> v_expected THEN
    RAISE EXCEPTION 'Order stock reservation is no longer complete';
  END IF;
  UPDATE public.orders SET status='PAID',updated_at=now()
    WHERE id=upper(p_order_id) AND status='PENDING_PAYMENT';
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.finalize_paid_order(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(text) TO service_role;