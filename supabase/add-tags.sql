-- Run once in Supabase → SQL Editor
alter table public.items add column if not exists tag text;
