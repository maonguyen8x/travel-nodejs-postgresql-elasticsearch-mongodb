CREATE TABLE IF NOT EXISTS public.usergender (
	id serial NOT NULL,
	gender text NULL DEFAULT 'UNSPECIFIED'::text,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT usergender_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS usergender_profile_id_idx ON public.usergender USING btree (profileid);