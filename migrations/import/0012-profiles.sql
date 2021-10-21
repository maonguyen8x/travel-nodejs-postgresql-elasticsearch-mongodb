INSERT INTO public.profiles
(education, userid, bio)
VALUES(NULL, (select id from public.users where name = 'Super Admin'), 'One of the proudest moment in a lifetime is the first step into unknown land.');

-- INSERT INTO public.profiles
-- (education, userid, bio)
-- VALUES(NULL, (select id from public.users where name = 'Admin'), 'One of the proudest moment in a lifetime is the first step into unknown land.');

-- INSERT INTO public.profiles
-- (education, userid, bio)
-- VALUES(NULL, (select id from public.users where name = 'Moderator'), 'One of the proudest moment in a lifetime is the first step into unknown land.');
