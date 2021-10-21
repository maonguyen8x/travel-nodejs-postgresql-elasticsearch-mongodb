CREATE TABLE IF NOT EXISTS public.amenity (
	id serial NOT NULL,
	name text NOT NULL,
	keyword text NOT NULL,
	amenitycategoryid int4 NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	icon text NULL,
	CONSTRAINT amenity_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS amenity_keyword_idx ON public.amenity USING btree (keyword);
