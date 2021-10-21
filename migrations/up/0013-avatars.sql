CREATE TABLE IF NOT EXISTS public.avatars (
	id serial NOT NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	profileid int4 NULL,
	mediacontentid int4 NULL,
	CONSTRAINT avatars_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS avatars_profile_id_idx ON public.avatars USING btree (profileid);