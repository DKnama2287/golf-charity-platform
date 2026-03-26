-- Replace the email below with the email address of the user
-- who signed up through the app and should become an admin.

update public.users
set role = 'admin',
    updated_at = now()
where email = 'your-admin-email@example.com';

-- Verify the result:
select id, email, role
from public.users
where email = 'your-admin-email@example.com';
