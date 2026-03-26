# Live Setup

## Login / Signup Pages

- `http://localhost:3000/login`
- `http://localhost:3000/signup`

They are also linked in the main header now.

## 1. Configure Environment

Edit [.env.local](/home/durgesh/Desktop/Assessment%20/golf-charity-platform/.env.local) and replace all placeholder values with your real keys.

Required values:

```env
NEXT_PUBLIC_APP_NAME=BirdieFund
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

## 2. Run SQL In Supabase

Run these files in the Supabase SQL editor in this order:

1. [schema.sql](/home/durgesh/Desktop/Assessment%20/golf-charity-platform/supabase/schema.sql)
2. [seed.sql](/home/durgesh/Desktop/Assessment%20/golf-charity-platform/supabase/seed.sql)

## 3. Create An Admin User

1. Sign up through the app at `/signup`
2. Open the Supabase SQL editor
3. Run [admin-setup.sql](/home/durgesh/Desktop/Assessment%20/golf-charity-platform/supabase/admin-setup.sql) after replacing the placeholder email

## 4. Start The App

```bash
npm run dev
```

Then visit:

- `/login`
- `/signup`
- `/dashboard`
- `/admin`

## Important Note

This workspace cannot directly execute changes in your real Supabase project without your live credentials and project access. The files above are ready for you to apply in Supabase immediately.
