CREATE TABLE IF NOT EXISTS public.useremail (
	id serial NOT NULL,
	email text NOT NULL,
	identityApple text NULL,
	ispublic bool NOT NULL DEFAULT false,
	userid int4 NOT NULL,
	CONSTRAINT useremail_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS useremail_email_idx ON public.useremail USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS useremail_user_id_idx ON public.useremail USING btree (userid);