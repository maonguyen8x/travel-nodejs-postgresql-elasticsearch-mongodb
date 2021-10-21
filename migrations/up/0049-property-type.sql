CREATE TABLE IF NOT EXISTS public.propertytype (
	id serial NOT NULL,
  "name" text NOT NULL,
  keyword text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE'::text,
  createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
  CONSTRAINT propertytype_pkey PRIMARY KEY (id)
);
