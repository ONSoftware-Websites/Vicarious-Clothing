alter table public.stock_purchases
 add column if not exists payment_reference text;

create or replace function public.confirm_stock_purchase_payment(p_purchase_id text,p_reference text,p_actor_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_lead_id text; v_status text; v_lead_status text; v_checks jsonb; v_items integer;
begin
 if length(trim(coalesce(p_reference,'')))<4 or length(p_reference)>120 then
  raise exception 'A payment reference of 4 to 120 characters is required';
 end if;
 select lead_id,status::text into v_lead_id,v_status
 from public.stock_purchases where id=p_purchase_id for update;
 if not found then return false; end if;
 if v_status='PAID' then return true; end if;
 if v_status<>'AGREED' then raise exception 'Purchase cannot be paid in this state'; end if;
 if v_lead_id is not null then
   select status::text into v_lead_status from public.purchase_leads where id=v_lead_id for update;
   if v_lead_status<>'INSPECTED' then raise exception 'Seller item must be inspected first'; end if;
   select checklist into v_checks from public.workflow_records
    where kind='lead' and reference_id=v_lead_id and category='inspection'
    order by created_at desc limit 1;
   if not (coalesce(v_checks->>'conditionVerified','false')='true' and
           coalesce(v_checks->>'photosChecked','false')='true' and
           coalesce(v_checks->>'discrepanciesResolved','false')='true')
      then raise exception 'Inspection checklist is incomplete'; end if;
   select checklist into v_checks from public.workflow_records
    where kind='lead' and reference_id=v_lead_id and category='intake'
    order by created_at desc limit 1;
   if not (coalesce(v_checks->>'received','false')='true' and
           coalesce(v_checks->>'labelled','false')='true' and
           coalesce(v_checks->>'stockLinked','false')='true')
      then raise exception 'Stock intake checklist is incomplete'; end if;
   select count(*) into v_items from public.stock_purchase_items where purchase_id=p_purchase_id;
   if v_items=0 then raise exception 'Link the acquired stock before recording payment'; end if;
 end if;
 update public.stock_purchases
 set status='PAID',paid_at=now(),payment_reference=trim(p_reference)
 where id=p_purchase_id and status='AGREED';
 if v_lead_id is not null then
   update public.purchase_leads set status='PAID' where id=v_lead_id and status='INSPECTED';
 end if;
 insert into public.workflow_records(kind,reference_id,category,note,actor_id)
 values('lead',coalesce(v_lead_id,'purchase:'||p_purchase_id),'note',
        'Seller payment confirmed externally; reference: '||trim(p_reference),p_actor_id);
 return true;
end;
$$;
revoke execute on function public.confirm_stock_purchase_payment(text,text,uuid) from public,anon,authenticated;
grant execute on function public.confirm_stock_purchase_payment(text,text,uuid) to service_role;
