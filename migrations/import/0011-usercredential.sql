-- INSERT INTO public.usercredentials
-- ("password", usersid)
-- VALUES('$2a$10$JZ5D.TY4qnOa78d0aHCgGe8cRRWkdflPUwHqWPqg80Ei/1o0G2dva', (select id from public.users where name = 'Admin'));

INSERT INTO public.usercredentials
("password", usersid)
VALUES('$2a$10$JZ5D.TY4qnOa78d0aHCgGe8cRRWkdflPUwHqWPqg80Ei/1o0G2dva', (select id from public.users where name = 'Super Admin'));

-- INSERT INTO public.usercredentials
-- ("password", usersid)
-- VALUES('$2a$10$JZ5D.TY4qnOa78d0aHCgGe8cRRWkdflPUwHqWPqg80Ei/1o0G2dva', (select id from public.users where name = 'Moderator'));
