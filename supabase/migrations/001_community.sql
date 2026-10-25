-- Apply to a Supabase project. Verification records are populated only by a
-- trusted provider adapter after signature, session binding, and consent checks.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '여행자' check (char_length(btrim(display_name)) between 2 and 30),
  nationality_codes text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select using (true);
create policy profiles_edit_own_name on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values(new.id);
  return new;
end;
$$;
revoke all on function private.create_profile() from public;
create trigger has_new_user after insert on auth.users for each row execute function private.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;

create table private.verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null,
  -- Store a server-side HMAC of the stable provider identity, never raw ID numbers.
  subject_hash text not null unique,
  identity_verified_at timestamptz not null,
  nationality_verified_at timestamptz not null,
  nationality_codes text[] not null check (cardinality(nationality_codes) between 1 and 5),
  nationality_display_consent_at timestamptz not null,
  expires_at timestamptz not null,
  check (expires_at > identity_verified_at and expires_at > nationality_verified_at)
);
alter table private.verifications enable row level security;
revoke all on private.verifications from public, anon, authenticated;

create table private.blocked_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null, created_at timestamptz not null default now()
);
alter table private.blocked_users enable row level security;
revoke all on private.blocked_users from public, anon, authenticated;

-- Copy only the confirmed nationality codes to the public profile.
create function private.publish_verified_nationalities() returns trigger language plpgsql security definer set search_path = '' as $$
declare code text;
begin
  if tg_op = 'DELETE' then
    update public.profiles set nationality_codes = '{}' where id = old.user_id;
    return old;
  end if;
  foreach code in array new.nationality_codes loop
    if code is null or code !~ '^[A-Z]{2}$' then raise exception 'Expected provider-validated ISO 3166-1 alpha-2 nationality'; end if;
  end loop;
  update public.profiles set nationality_codes = new.nationality_codes where id = new.user_id;
  return new;
end;
$$;
revoke all on function private.publish_verified_nationalities() from public;
create trigger has_publish_nationalities after insert or update or delete on private.verifications for each row execute function private.publish_verified_nationalities();

-- Only a server holding the service-role credential may record provider results.
-- The provider-specific adapter MUST verify signed webhook payloads and bind them
-- to its server-created verification session before calling this function.
create function public.record_identity_verification(
  target_user uuid, verified_provider text, verified_subject_hash text,
  verified_nationalities text[], verified_at timestamptz,
  display_consent_at timestamptz, valid_until timestamptz
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if verified_at > now() or display_consent_at > now() or valid_until <= now()
    or char_length(verified_subject_hash) < 32 or char_length(verified_provider) < 2 then
    raise exception 'Invalid verified identity result';
  end if;
  insert into private.verifications(user_id,provider,subject_hash,identity_verified_at,nationality_verified_at,nationality_codes,nationality_display_consent_at,expires_at)
  values(target_user,verified_provider,verified_subject_hash,verified_at,verified_at,verified_nationalities,display_consent_at,valid_until)
  on conflict(user_id) do update set provider=excluded.provider,subject_hash=excluded.subject_hash,
    identity_verified_at=excluded.identity_verified_at,nationality_verified_at=excluded.nationality_verified_at,
    nationality_codes=excluded.nationality_codes,nationality_display_consent_at=excluded.nationality_display_consent_at,expires_at=excluded.expires_at;
end;
$$;
revoke all on function public.record_identity_verification(uuid,text,text,text[],timestamptz,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.record_identity_verification(uuid,text,text,text[],timestamptz,timestamptz,timestamptz) to service_role;

create function public.is_verified_participant() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.verifications v
    where v.user_id = (select auth.uid()) and v.expires_at > now()
      and v.identity_verified_at <= now() and v.nationality_verified_at <= now()
      and v.nationality_display_consent_at <= now()
      and not exists (select 1 from private.blocked_users b where b.user_id = v.user_id)
  );
$$;
revoke all on function public.is_verified_participant() from public, anon;
grant execute on function public.is_verified_participant() to authenticated;

create function public.get_my_verification() returns table(identity_verified boolean, nationality_verified boolean, can_comment boolean)
language sql stable security definer set search_path = '' as $$
  select
    exists(select 1 from private.verifications where user_id=(select auth.uid()) and identity_verified_at<=now() and expires_at>now()),
    exists(select 1 from private.verifications where user_id=(select auth.uid()) and nationality_verified_at<=now() and expires_at>now()),
    public.is_verified_participant();
$$;
revoke all on function public.get_my_verification() from public, anon;
grant execute on function public.get_my_verification() to authenticated;

create table public.films (id text primary key);
insert into public.films(id) values ('about-time'),('taxi-driver'),('red-cliff'),('troy'),('pearl-harbor'),('taegukgi'),('pianist'),('odyssey');
alter table public.films enable row level security;
revoke all on public.films from anon, authenticated;
grant select on public.films to anon, authenticated;
create policy films_read on public.films for select using (true);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  film_id text not null references public.films(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_nationality_codes text[] not null check(cardinality(author_nationality_codes) between 1 and 5),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  source_url text check (source_url is null or (char_length(source_url)<=2048 and source_url ~ '^https?://[^[:space:]]+$')),
  spoiler boolean not null default false,
  status text not null default 'visible' check(status in ('visible','hidden')),
  created_at timestamptz not null default now()
);
create index comments_film_time on public.comments(film_id, created_at desc);
create index comments_author_time on public.comments(author_id, created_at desc);
alter table public.comments enable row level security;
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert(film_id, author_id, body, source_url, spoiler), delete on public.comments to authenticated;
create policy comments_read_visible on public.comments for select using (status = 'visible' or author_id = (select auth.uid()));
create policy comments_insert_verified on public.comments for insert to authenticated with check (author_id = (select auth.uid()) and (select public.is_verified_participant()));
create policy comments_delete_own on public.comments for delete to authenticated using (author_id = (select auth.uid()));

create function private.limit_comment_rate() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select nationality_codes into new.author_nationality_codes from private.verifications where user_id=new.author_id;
  -- Serialize concurrent inserts by author, so racing requests cannot bypass it.
  perform id from public.profiles where id = new.author_id for update;
  if exists(select 1 from public.comments where author_id=new.author_id and created_at>now()-interval '30 seconds') then
    raise exception 'Please wait 30 seconds before posting another comment';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_comment_rate() from public;
create trigger has_comment_rate before insert on public.comments for each row execute function private.limit_comment_rate();

create table public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check(char_length(btrim(reason)) between 5 and 500),
  created_at timestamptz not null default now(),
  unique(comment_id, reporter_id)
);
alter table public.comment_reports enable row level security;
revoke all on public.comment_reports from anon, authenticated;
grant insert(comment_id, reporter_id, reason) on public.comment_reports to authenticated;
grant select on public.comment_reports to authenticated;
create policy reports_read_own on public.comment_reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy reports_insert_verified on public.comment_reports for insert to authenticated with check(
  reporter_id=(select auth.uid()) and (select public.is_verified_participant())
  and exists(select 1 from public.comments c where c.id=comment_id and c.status='visible' and c.author_id<>(select auth.uid()))
);

commit;
