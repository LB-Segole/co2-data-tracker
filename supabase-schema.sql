create table if not exists co2_listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  company_name text not null,
  industry text not null,
  country text not null,
  region text not null,
  postal_code text,
  co2_volume_tpy numeric not null,
  co2_purity text,
  notes text,
  contact_email text not null,
  status text default 'pending'
);

alter table co2_listings enable row level security;

create policy "public read"
  on co2_listings for select
  using (status = 'verified' or status = 'pending');

create policy "anyone can submit"
  on co2_listings for insert
  with check (status = 'pending');
