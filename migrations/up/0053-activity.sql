CREATE TABLE IF NOT EXISTS public.activity (
	id serial NOT NULL,
  "name" text NOT NULL,
  "from" timestamptz NOT NULL,
  "to" timestamptz NULL,
  price DECIMAL(19, 4) NULL default 0,
  status text NULL default 'DRAFT'::text,
  locationid int4 NOT NULL,
  postid int4 NOT NULL,
  createdbyid int4 NOT NULL,
  currencyid int4 NULL,
  createdat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  blockedat timestamptz NULL,
  blockmessage text DEFAULT NULL,
  CONSTRAINT activity_pkey PRIMARY KEY (id)
);
