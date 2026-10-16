-- Transactional customer return intake. Only the trusted server service role may call this.
create or replace function public.create_customer_return_request(p_order_id text,p_reason text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_updated int;
begin
 if length(trim(coalesce(p_reason,'')))<10 or length(p_reason)>2000 then
  raise exception 'A return reason between 10 and 2000 characters is required';
 end if;
 update public.orders set status='RETURN_REQUESTED',updated_at=now()
 where id=upper(p_order_id) and status in ('DISPATCHED','DELIVERED');
 get diagnostics v_updated=row_count;
 if v_updated<>1 then return false; end if;
 insert into public.workflow_records(kind,reference_id,category,note,checklist)
 values('order',upper(p_order_id),'return',trim(p_reason),'{"customerRequested":true}'::jsonb);
 return true;
end; $$;
revoke execute on function public.create_customer_return_request(text,text) from public,anon,authenticated;
grant execute on function public.create_customer_return_request(text,text) to service_role;