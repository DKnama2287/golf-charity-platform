insert into public.charities (
  name,
  slug,
  category,
  description,
  website_url,
  country_code,
  impact_metric,
  upcoming_event,
  is_featured,
  is_active
)
values
  (
    'First Swing Futures',
    'first-swing-futures',
    'Youth Access',
    'Funding junior coaching, transport, and community golf access.',
    'https://example.org/first-swing-futures',
    'GB',
    '118 young golfers funded this quarter',
    'April Charity Pro-Am in Leeds',
    true,
    true
  ),
  (
    'Fairways For Recovery',
    'fairways-for-recovery',
    'Mental Health',
    'Outdoor golf-based recovery and mental wellbeing programmes.',
    'https://example.org/fairways-for-recovery',
    'IE',
    '72 therapy rounds sponsored this season',
    'May wellbeing scramble in Dublin',
    true,
    true
  ),
  (
    'Green Grants Alliance',
    'green-grants-alliance',
    'Club Sustainability',
    'Supports water-conscious and eco-friendly grassroots club upgrades.',
    'https://example.org/green-grants-alliance',
    'EU',
    '14 eco-grants distributed this year',
    'June sustainability showcase',
    false,
    true
  )
on conflict (slug) do nothing;
