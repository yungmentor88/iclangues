-- =====================================================================
-- 0005 — Fix the is_admin escalation guard
--
-- BUG in 0001: prevent_admin_escalation() raised on ANY change to
-- is_admin, regardless of who made it. The intent was to stop a user
-- escalating themselves through PostgREST (anon / authenticated roles),
-- but as written it also blocked the legitimate grant from the SQL
-- Editor and from service-role connections — making it impossible to
-- create the first admin at all.
--
-- Fix: only block the change when it arrives over the API. PostgREST
-- connects as `anon` or `authenticated`; the SQL Editor connects as
-- `postgres`, and server-side admin tasks use `service_role`. Those
-- privileged paths are exactly the ones a hijacked browser session
-- cannot reach, so letting them through does not weaken the guard.
-- =====================================================================

create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    -- Roles PostgREST uses for browser/API traffic. Anything reaching the
    -- database through these has, at most, a user's own session — never
    -- enough to grant admin.
    if current_user in ('anon', 'authenticated') then
      raise exception 'is_admin cannot be modified through the API'
        using hint = 'Grant admin from the Supabase SQL Editor or with the service role.';
    end if;
  end if;
  return new;
end;
$$;

comment on function public.prevent_admin_escalation() is
  'Blocks is_admin changes arriving via PostgREST (anon/authenticated). '
  'Privileged connections (postgres, service_role) may still grant admin.';
