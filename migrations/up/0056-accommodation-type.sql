CREATE TABLE IF NOT EXISTS public.accommodationtype (
	id serial NOT NULL,
  name text NOT NULL,
  pageid int4 NOT NULL,
  createdat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  CONSTRAINT accommodationtype_pkey PRIMARY KEY (id)
);