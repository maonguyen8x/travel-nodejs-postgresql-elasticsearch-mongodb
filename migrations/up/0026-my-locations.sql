CREATE TABLE IF NOT EXISTS public.mylocations (
	id serial NOT NULL,
	mymaptype text NULL,
	representativepostid int4 NULL,
	accesstype text NULL DEFAULT 'PUBLIC'::text,
	targettype text NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	locationid int4 NOT NULL,
	userid int4 NOT NULL,
	CONSTRAINT mylocations_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS mylocations_location_user_idx ON public.mylocations USING btree (locationid, userid);
CREATE INDEX IF NOT EXISTS mylocations_user_id_idx ON public.mylocations USING btree (userid);
