CREATE TABLE IF NOT EXISTS public.userbirthday (
	id serial NOT NULL,
	birthday timestamptz NULL,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT userbirthday_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS userbirthday_profile_id_idx ON public.userbirthday USING btree (profileid);