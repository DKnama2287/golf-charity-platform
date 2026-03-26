create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.subscription_plan as enum ('monthly', 'yearly');
create type public.subscription_status as enum (
  'active',
  'inactive',
  'cancelled',
  'past_due',
  'expired'
);
create type public.draw_mode as enum ('random', 'algorithm');
create type public.draw_status as enum ('draft', 'simulated', 'published', 'closed');
create type public.match_tier as enum ('match_3', 'match_4', 'match_5');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.verification_status as enum ('pending', 'approved', 'rejected');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'user',
  handicap numeric(5, 2),
  country_code varchar(2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text,
  website_url text,
  image_url text,
  country_code varchar(2),
  impact_metric text,
  upcoming_event text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_charity_selection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete restrict,
  contribution_percent numeric(5, 2) not null,
  is_active boolean not null default true,
  selected_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint chk_charity_contribution_percent
    check (contribution_percent >= 10 and contribution_percent <= 100)
);

create unique index ux_user_charity_selection_active
  on public.user_charity_selection(user_id)
  where is_active = true;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  amount numeric(10, 2) not null,
  currency varchar(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_subscription_amount check (amount >= 0)
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);
create index idx_subscriptions_period_end on public.subscriptions(current_period_end);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  stripe_payment_intent_id text unique,
  stripe_invoice_id text unique,
  amount numeric(10, 2) not null,
  currency varchar(3) not null default 'USD',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_payment_amount check (amount >= 0)
);

create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_subscription_id on public.payments(subscription_id);
create index idx_payments_status on public.payments(status);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score integer not null,
  played_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_score_range check (score between 1 and 45)
);

create index idx_scores_user_played_at_desc
  on public.scores(user_id, played_at desc, created_at desc);

create index idx_scores_user_created_at_desc
  on public.scores(user_id, created_at desc);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null,
  mode public.draw_mode not null,
  status public.draw_status not null default 'draft',
  generated_numbers integer[] not null,
  generated_from text,
  algorithm_version text,
  seed_value text,
  active_subscriber_count integer not null default 0,
  gross_subscription_amount numeric(12, 2) not null default 0,
  charity_contribution_amount numeric(12, 2) not null default 0,
  prize_pool_amount numeric(12, 2) not null default 0,
  rollover_from_previous numeric(12, 2) not null default 0,
  total_5_match_pool numeric(12, 2) not null default 0,
  total_4_match_pool numeric(12, 2) not null default 0,
  total_3_match_pool numeric(12, 2) not null default 0,
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ux_draw_month unique (draw_month),
  constraint chk_generated_numbers_length check (cardinality(generated_numbers) = 5),
  constraint chk_draw_amounts_non_negative check (
    gross_subscription_amount >= 0 and
    charity_contribution_amount >= 0 and
    prize_pool_amount >= 0 and
    rollover_from_previous >= 0 and
    total_5_match_pool >= 0 and
    total_4_match_pool >= 0 and
    total_3_match_pool >= 0
  )
);

create index idx_draws_status on public.draws(status);
create index idx_draws_draw_month on public.draws(draw_month);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  matched_scores integer[] not null default '{}',
  match_count integer not null,
  eligible boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ux_draw_results_draw_user unique (draw_id, user_id),
  constraint chk_match_count check (match_count between 0 and 5)
);

create index idx_draw_results_draw_id on public.draw_results(draw_id);
create index idx_draw_results_user_id on public.draw_results(user_id);
create index idx_draw_results_match_count on public.draw_results(match_count);

create table public.winnings (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  draw_result_id uuid not null references public.draw_results(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tier public.match_tier not null,
  gross_amount numeric(12, 2) not null,
  rollover_amount numeric(12, 2) not null default 0,
  is_split boolean not null default false,
  payment_status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_winnings_amount check (gross_amount >= 0 and rollover_amount >= 0)
);

create unique index ux_winnings_draw_result on public.winnings(draw_result_id);
create index idx_winnings_user_id on public.winnings(user_id);
create index idx_winnings_draw_id on public.winnings(draw_id);
create index idx_winnings_tier on public.winnings(tier);
create index idx_winnings_payment_status on public.winnings(payment_status);

create table public.winner_verification (
  id uuid primary key default gen_random_uuid(),
  winning_id uuid not null unique references public.winnings(id) on delete cascade,
  submitted_by uuid not null references public.users(id) on delete cascade,
  proof_file_url text,
  notes text,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_winner_verification_status
  on public.winner_verification(status);

create or replace function public.enforce_last_5_scores()
returns trigger
language plpgsql
as $$
begin
  delete from public.scores
  where id in (
    select id
    from public.scores
    where user_id = new.user_id
    order by played_at desc, created_at desc
    offset 5
  );

  return new;
end;
$$;

create trigger trg_enforce_last_5_scores
after insert on public.scores
for each row
execute function public.enforce_last_5_scores();

create or replace function public.add_score_and_get_latest_five(
  p_user_id uuid,
  p_score integer,
  p_played_at date
)
returns table (
  score_id uuid,
  user_id uuid,
  score_value integer,
  played_at date,
  created_at timestamptz
)
language plpgsql
as $$
begin
  if p_score < 1 or p_score > 45 then
    raise exception 'Score must be between 1 and 45';
  end if;

  insert into public.scores (user_id, score, played_at)
  values (p_user_id, p_score, p_played_at);

  delete from public.scores
  where id in (
    select id
    from public.scores
    where user_id = p_user_id
    order by played_at desc, created_at desc
    offset 5
  );

  return query
  select
    s.id as score_id,
    s.user_id,
    s.score as score_value,
    s.played_at,
    s.created_at
  from public.scores s
  where s.user_id = p_user_id
  order by s.played_at desc, s.created_at desc
  limit 5;
end;
$$;

create or replace view public.v_draw_prize_pool_summary as
select
  d.id as draw_id,
  d.draw_month,
  d.active_subscriber_count,
  d.gross_subscription_amount,
  d.charity_contribution_amount,
  d.prize_pool_amount,
  d.rollover_from_previous,
  d.total_5_match_pool,
  d.total_4_match_pool,
  d.total_3_match_pool
from public.draws d;
