CREATE TABLE IF NOT EXISTS public.interesting (
	id serial NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	userid int4 NOT NULL,
	locationid int4 NOT NULL,
	CONSTRAINT interesting_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS interesting_user_id_idx ON public.interesting USING btree (userid);
