begin;

create table private.identity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_session_id uuid unique,
  verification_url text,
  status text not null default 'creating' check(status in ('creating','pending','in_review','verified','needs_review','declined','expired','test_only','failed','withdrawn')),
  consent_version text not null check(consent_version='2026-09-20'),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_event_at timestamptz,
  refresh_after timestamptz not null default now(),
  revoked_at timestamptz
);
create index identity_sessions_user_time on private.identity_sessions(user_id,created_at desc);
create index identity_sessions_created on private.identity_sessions(created_at);
alter table private.identity_sessions enable row level security;
revoke all on private.identity_sessions from public,anon,authenticated;
create table private.identity_events (
  event_id text primary key,
  session_id uuid not null references private.identity_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.identity_events enable row level security;
revoke all on private.identity_events from public,anon,authenticated;

create function public.reserve_identity_session(target_user uuid, consent_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.identity_sessions;
begin
  if target_user is null or consent_version is distinct from '2026-09-20' then raise exception 'consent_required'; end if;
  -- Serialize the free allowance as well as per-account requests.
  perform pg_advisory_xact_lock(64891237);
  if exists(select 1 from private.blocked_users where user_id=target_user) then raise exception 'account_unavailable'; end if;
  if exists(select 1 from private.verifications where user_id=target_user and expires_at>now()) then raise exception 'already_verified'; end if;
  select * into s from private.identity_sessions where user_id=target_user order by created_at desc limit 1 for update;
  if s.id is not null and s.revoked_at is null and s.created_at>now()-interval '24 hours'
    and s.status in ('pending','in_review') then return to_jsonb(s); end if;
  if s.id is not null and s.created_at>now()-interval '2 minutes' then raise exception 'rate_limited'; end if;
  if (select count(*) from private.identity_sessions where user_id=target_user and created_at>now()-interval '24 hours')>=3 then raise exception 'rate_limited'; end if;
  if (select count(*) from private.identity_sessions where created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC')>=450 then raise exception 'monthly_limit'; end if;
  insert into private.identity_sessions(user_id,consent_version) values(target_user,consent_version) returning * into s;
  return to_jsonb(s);
end;
$$;
revoke all on function public.reserve_identity_session(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_identity_session(uuid,text) to service_role;

create function public.attach_identity_session(attempt_id uuid, provider_id uuid, session_url text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if session_url !~ '^https://verify[.]didit[.]me/([a-z]{2}(-[A-Za-z]{2})?/)?session/[A-Za-z0-9_-]+$' then raise exception 'invalid_provider_url'; end if;
  update private.identity_sessions set provider_session_id=provider_id,verification_url=session_url,status='pending',updated_at=now()
    where id=attempt_id and provider_session_id is null and revoked_at is null and status='creating';
  if not found then raise exception 'attempt_unavailable'; end if;
end;
$$;
revoke all on function public.attach_identity_session(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.attach_identity_session(uuid,uuid,text) to service_role;

create function public.get_identity_session(target_user uuid default null, provider_id uuid default null, claim_refresh boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s private.identity_sessions;
begin
  if (target_user is null)=(provider_id is null) then raise exception 'invalid_lookup'; end if;
  select * into s from private.identity_sessions
    where (target_user is not null and user_id=target_user) or (provider_id is not null and provider_session_id=provider_id)
    order by created_at desc limit 1 for update;
  if s.id is null then return null; end if;
  if claim_refresh then
    if s.refresh_after>now() then raise exception 'rate_limited'; end if;
    update private.identity_sessions set refresh_after=now()+interval '15 seconds' where id=s.id;
  end if;
  return to_jsonb(s);
end;
$$;
revoke all on function public.get_identity_session(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.get_identity_session(uuid,uuid,boolean) to service_role;

create function public.finish_identity_session(
  attempt_id uuid, provider_id uuid, event_key text, event_at timestamptz,
  outcome text, codes text[], subject_hash text, valid_until timestamptz
) returns void language plpgsql security definer set search_path='' as $$
declare s private.identity_sessions; latest uuid;
begin
  if outcome is null or outcome not in ('pending','in_review','verified','needs_review','declined','expired','test_only')
    or event_at is null or event_at>now()+interval '5 minutes' or event_key is null or char_length(event_key)>120 then raise exception 'invalid_result'; end if;
  select * into s from private.identity_sessions where id=attempt_id for update;
  if s.id is null or s.provider_session_id is distinct from provider_id then raise exception 'session_mismatch'; end if;
  -- Profile row lock also serializes withdrawal and attempts for this account.
  perform id from public.profiles where id=s.user_id for update;
  select id into latest from private.identity_sessions where user_id=s.user_id order by created_at desc limit 1;
  if s.revoked_at is not null or latest<>s.id then return; end if;
  if exists(select 1 from private.identity_events where event_id=event_key) then return; end if;
  if s.last_event_at is not null and event_at<s.last_event_at then return; end if;
  if outcome='verified' then
    if subject_hash is null or subject_hash !~ '^[a-f0-9]{64}$' or valid_until is null
      or valid_until<=now() or codes is null or cardinality(codes)<>1 or codes[1] is null or codes[1]!~'^[A-Z]{2}$'
      then raise exception 'invalid_verified_result'; end if;
    begin
      perform public.record_identity_verification(s.user_id,'didit',subject_hash,codes,now(),s.consent_at,valid_until);
    exception when unique_violation then outcome:='needs_review';
    end;
  end if;
  if outcome<>'verified' then delete from private.verifications where user_id=s.user_id and provider='didit'; end if;
  update private.identity_sessions set status=outcome,last_event_at=event_at,updated_at=now(),
    verification_url=case when outcome in ('pending','in_review') then verification_url else null end where id=s.id;
  insert into private.identity_events(event_id,session_id) values(event_key,s.id) on conflict do nothing;
end;
$$;
revoke all on function public.finish_identity_session(uuid,uuid,text,timestamptz,text,text[],text,timestamptz) from public,anon,authenticated;
grant execute on function public.finish_identity_session(uuid,uuid,text,timestamptz,text,text[],text,timestamptz) to service_role;

create function public.get_my_identity_status()
returns table(status text, updated_at timestamptz, nationality_codes text[]) language sql stable security definer set search_path='' as $$
  select case when s.status='verified' and not public.is_verified_participant() then 'expired' else s.status end,
    s.updated_at, coalesce(v.nationality_codes,'{}'::text[])
  from private.identity_sessions s left join private.verifications v on v.user_id=s.user_id and v.expires_at>now()
  where s.user_id=(select auth.uid()) order by s.created_at desc limit 1;
$$;
revoke all on function public.get_my_identity_status() from public,anon;
grant execute on function public.get_my_identity_status() to authenticated;

alter table public.comments drop constraint comments_author_nationality_codes_check;
alter table public.comments add constraint comments_author_nationality_codes_check check(
  cardinality(author_nationality_codes) between 1 and 5 or (status='hidden' and cardinality(author_nationality_codes)=0));
create function public.withdraw_identity_consent()
returns void language plpgsql security definer set search_path='' as $$
declare caller uuid:=(select auth.uid());
begin
  if caller is null then raise exception 'authentication_required'; end if;
  -- Keep lock order consistent with finish_identity_session.
  perform id from private.identity_sessions where user_id=caller order by created_at desc for update;
  perform id from public.profiles where id=caller for update;
  update private.identity_sessions set revoked_at=now(),verification_url=null,status='withdrawn',updated_at=now() where user_id=caller;
  delete from private.verifications where user_id=caller;
  update public.comments set status='hidden',author_nationality_codes='{}' where author_id=caller;
end;
$$;
revoke all on function public.withdraw_identity_consent() from public,anon;
grant execute on function public.withdraw_identity_consent() to authenticated;
commit;
