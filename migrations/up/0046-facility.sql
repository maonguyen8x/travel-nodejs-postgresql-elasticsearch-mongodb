CREATE TABLE IF NOT EXISTS public.facility (
	id serial NOT NULL,
	name text NOT NULL,
	keyword text NOT NULL,
	facilitycategoryid int4 NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT facility_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS facility_keyword_idx ON public.facility USING btree (keyword);