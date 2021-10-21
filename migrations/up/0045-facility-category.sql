CREATE TABLE IF NOT EXISTS public.facilitycategory (
	id serial NOT NULL,
	name text NOT NULL,
	keyword text NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT facilitycategory_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS facility_category_keyword_idx ON public.facilitycategory USING btree (keyword);
