CREATE TABLE IF NOT EXISTS public.userphone (
	id serial NOT NULL,
	phone text NULL,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT userphone_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS userphone_profile_id_idx ON public.userphone USING btree (profileid);