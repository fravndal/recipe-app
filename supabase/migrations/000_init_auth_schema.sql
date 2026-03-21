-- 000_init_auth_schema.sql
-- Bootstrap auth schema so app migrations (001+) can run before or after GoTrue starts.
-- Matches Supabase Auth init schema; GoTrue uses CREATE TABLE IF NOT EXISTS so this is safe.

begin;

create schema if not exists auth;

-- auth.users (required by 001_init_recipes and all user_id FK references)
create table if not exists auth.users (
  instance_id uuid null,
  id uuid not null unique,
  aud varchar(255) null,
  role varchar(255) null,
  email varchar(255) null unique,
  encrypted_password varchar(255) null,
  confirmed_at timestamptz null,
  invited_at timestamptz null,
  confirmation_token varchar(255) null,
  confirmation_sent_at timestamptz null,
  recovery_token varchar(255) null,
  recovery_sent_at timestamptz null,
  email_change_token varchar(255) null,
  email_change varchar(255) null,
  email_change_sent_at timestamptz null,
  last_sign_in_at timestamptz null,
  raw_app_meta_data jsonb null,
  raw_user_meta_data jsonb null,
  is_super_admin bool null,
  created_at timestamptz null,
  updated_at timestamptz null,
  constraint users_pkey primary key (id)
);
create index if not exists users_instance_id_email_idx on auth.users using btree (instance_id, email);
create index if not exists users_instance_id_idx on auth.users using btree (instance_id);

-- auth.refresh_tokens (GoTrue expects this)
create table if not exists auth.refresh_tokens (
  instance_id uuid null,
  id bigserial not null,
  token varchar(255) null,
  user_id varchar(255) null,
  revoked bool null,
  created_at timestamptz null,
  updated_at timestamptz null,
  constraint refresh_tokens_pkey primary key (id)
);
create index if not exists refresh_tokens_instance_id_idx on auth.refresh_tokens using btree (instance_id);
create index if not exists refresh_tokens_instance_id_user_id_idx on auth.refresh_tokens using btree (instance_id, user_id);
create index if not exists refresh_tokens_token_idx on auth.refresh_tokens using btree (token);

-- auth.instances (GoTrue expects this)
create table if not exists auth.instances (
  id uuid not null,
  uuid uuid null,
  raw_base_config text null,
  created_at timestamptz null,
  updated_at timestamptz null,
  constraint instances_pkey primary key (id)
);

-- auth.audit_log_entries (GoTrue expects this)
create table if not exists auth.audit_log_entries (
  instance_id uuid null,
  id uuid not null,
  payload json null,
  created_at timestamptz null,
  constraint audit_log_entries_pkey primary key (id)
);
create index if not exists audit_logs_instance_id_idx on auth.audit_log_entries using btree (instance_id);

-- auth.schema_migrations (GoTrue tracks migrations here)
create table if not exists auth.schema_migrations (
  version varchar(255) not null,
  constraint schema_migrations_pkey primary key (version)
);

-- auth.uid() and auth.role() used by RLS and triggers
-- Uses request.jwt.claims (JSON) since PGRST_DB_USE_LEGACY_GUCS=false
create or replace function auth.uid() returns uuid as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub',
    nullif(current_setting('request.jwt.claim.sub', true), '')
  )::uuid;
$$ language sql stable;

create or replace function auth.role() returns text as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role',
    nullif(current_setting('request.jwt.claim.role', true), '')
  )::text;
$$ language sql stable;

commit;
