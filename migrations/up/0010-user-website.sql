CREATE TABLE IF NOT EXISTS public.userwebsite (
	id serial NOT NULL,
	website text NULL,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT userwebsite_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS userwebsite_profile_id_idx ON public.userwebsite USING btree (profileid);