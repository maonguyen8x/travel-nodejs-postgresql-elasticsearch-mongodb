CREATE TABLE IF NOT EXISTS public.service (
	id serial NOT NULL,
	"name" text NULL,
	"type" text NOT NULL,
	flag int4 NULL DEFAULT 0,
	status text NULL DEFAULT 'PUBLIC'::text,
	price DECIMAL(19, 4) NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	pageid int4 NULL,
	currencyid int4 NULL,
	postid int4 NULL,
	CONSTRAINT service_pkey PRIMARY KEY (id)
);