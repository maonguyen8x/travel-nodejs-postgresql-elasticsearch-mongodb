CREATE TABLE IF NOT EXISTS public.backgrounds (
	id serial NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	mediacontentid int4 NOT NULL,
	profileid int4 NOT NULL,
	CONSTRAINT backgrounds_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS backgrounds_profile_id_idx ON public.backgrounds USING btree (profileid);
