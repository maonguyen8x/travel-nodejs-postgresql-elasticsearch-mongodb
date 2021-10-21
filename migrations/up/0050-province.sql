CREATE TABLE IF NOT EXISTS public.province (
	id serial NOT NULL,
  "name" text,
  "type" text,
  slug text,
  name_with_type text,
  createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
  CONSTRAINT province_pkey PRIMARY KEY (id)
);
