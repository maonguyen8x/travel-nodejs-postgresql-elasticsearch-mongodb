CREATE TABLE IF NOT EXISTS public.town (
	id serial NOT NULL,
  "name" text,
  "type" text,
  slug text,
  name_with_type text,
  path text,
  path_with_type text,
  provinceid int4,
  createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
  CONSTRAINT town_pkey PRIMARY KEY (id)
);

