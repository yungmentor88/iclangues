-- =====================================================================
-- IClangues — Supabase schema
-- Run this in: Supabase dashboard → SQL Editor → New query → paste → Run
-- =====================================================================

-- ---------- Profiles (one row per user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  level text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Courses (your CMS) ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  lang text not null check (lang in ('kr','en','fr','es','pt')),
  level text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  title text not null,
  description text not null,
  duration text not null default '8 weeks',
  format text not null default 'Group',
  price text not null default '€99',
  sort int not null default 0,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;
create policy "Courses are public to read" on public.courses for select using (true);
-- (Editing is done from the Supabase dashboard / service role — no public write policy.)

-- ---------- Leads (contact form submissions) ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  language text,
  message text,
  created_at timestamptz default now()
);

alter table public.leads enable row level security;
create policy "Anyone can submit a lead" on public.leads for insert with check (true);
-- (Reading leads is restricted to the dashboard / service role.)

-- ---------- Seed the 13 starter courses ----------
insert into public.courses (lang, level, title, description, duration, format, price, sort) values
('kr','A1','Kriolu pa kuriosos','Your first words in the language of Cabo Verde — greetings, music and everyday chat.','8 weeks','Group','€89',1),
('kr','B1','Konbersu di Rua','Hold real conversations with locals. Slang, expressions and island stories.','10 weeks','Group','€129',2),
('kr','B2','Kriolu Terra Terra','Deep, traditional Kriolu from the countryside — the most preserved form.','10 weeks','Group','€139',3),
('kr','C1','Mestre di Kriolu','Advanced fluency through morna lyrics, films and literature.','12 weeks','Private','€249',4),
('en','A2','Everyday English','Travel, ordering, directions and small talk — confidently.','8 weeks','Group','€99',5),
('en','B2','Business English','Emails, meetings and presentations for global professionals.','10 weeks','Private','€199',6),
('en','C2','Mastery & Idioms','Native-level expression, idioms, debate and writing.','12 weeks','Self-paced','€149',7),
('fr','A1','Bonjour Français','A friendly intro to French sounds, greetings and survival phrases.','8 weeks','Group','€99',8),
('fr','B1','Conversation Quotidienne','Express opinions, share stories, navigate cultural moments.','10 weeks','Group','€129',9),
('es','A1','Hola, Español','Your first steps in Spanish — greetings, food, travel and music.','8 weeks','Group','€99',10),
('es','B1','Conversación Diaria','Lively conversations on culture, work and travel across Spain & Latin America.','10 weeks','Group','€129',11),
('pt','A2','Português do Dia-a-Dia','From café orders to phone calls — get fluent in daily Portuguese.','8 weeks','Group','€99',12),
('pt','B2','Português Profissional','For work, study or moving to a Lusophone country.','10 weeks','Private','€199',13)
on conflict do nothing;
