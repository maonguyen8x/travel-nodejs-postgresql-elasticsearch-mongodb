CREATE TABLE IF NOT EXISTS public.ward (
	id serial NOT NULL,
  "name" text,
  "type" text,
  slug text,
  name_with_type text,
  path text,
  path_with_type text,
  townid int4,
  createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
  CONSTRAINT ward_pkey PRIMARY KEY (id)
);
