INSERT INTO public.useremail
(email, ispublic, userid)
VALUES('superadmin@jgooooo.com', true, (select id from public.users where name = 'Super Admin'));

-- INSERT INTO public.useremail
-- (email, ispublic, userid)
-- VALUES('admin@jgooooo.com', true, (select id from public.users where name = 'Admin'));

-- INSERT INTO public.useremail
-- (email, ispublic, userid)
-- VALUES('moderator@jgooooo.com', true, (select id from public.users where name = 'Moderator'));
