CREATE TABLE IF NOT EXISTS public.plan (
	id serial NOT NULL,
	planname text NOT NULL,
	startdate timestamptz NULL,
	note text NULL,
	accesstype text NULL DEFAULT 'PUBLIC'::text,
	status text NULL DEFAULT 'DRAFT'::text,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	userid int4 NOT NULL,
	enddate timestamptz NULL,

	CONSTRAINT plan_pkey PRIMARY KEY (id)
);
