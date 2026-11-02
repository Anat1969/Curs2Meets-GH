-- סכמת הגלריה, כפי שהוגדרה בפרויקט Lovable Cloud (tnvwpjcilwmtigfxhomx, מיגרציה 20260308195412).
-- לתיעוד בלבד: הטבלאות כבר קיימות. RLS: קריאה לכולם, כתיבה ומחיקה לבעלים.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

create table public.student_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  topic_id text not null,
  description text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);
alter table public.student_submissions enable row level security;
create policy "Submissions viewable by everyone" on public.student_submissions for select using (true);
create policy "Users can insert own submissions" on public.student_submissions for insert with check (auth.uid() = user_id);
create policy "Users can delete own submissions" on public.student_submissions for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('submissions', 'submissions', true);
create policy "Submission images publicly accessible" on storage.objects for select using (bucket_id = 'submissions');
create policy "Users can upload submission images" on storage.objects for insert with check (bucket_id = 'submissions' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own submission images" on storage.objects for delete using (bucket_id = 'submissions' and auth.uid()::text = (storage.foldername(name))[1]);
