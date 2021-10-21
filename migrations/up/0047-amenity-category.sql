CREATE TABLE IF NOT EXISTS public.amenitycategory (
	id serial NOT NULL,
	name text NOT NULL,
	keyword text NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT amenitycategory_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS amenity_category_keyword_idx ON public.amenitycategory USING btree (keyword);