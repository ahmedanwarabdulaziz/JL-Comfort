-- Run this AFTER you've created the admin user in the Supabase Dashboard
-- (Authentication -> Users -> Add user). Copy that user's UUID from the
-- dashboard and paste it below, then run this in the SQL editor.
--
-- Recommended: use a fresh email/password rather than reusing the committed
-- a@a.com / 5550555 Firebase credentials (scripts/setup-admin-user.js) -- that
-- password is exposed in git history.

insert into admin_users (user_id) values ('PASTE-YOUR-ADMIN-USER-UUID-HERE');
