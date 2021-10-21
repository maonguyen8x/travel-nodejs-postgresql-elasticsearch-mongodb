CREATE TABLE IF NOT EXISTS public.pageverification (
	id serial NOT NULL,
	status text NULL DEFAULT 'WAITING_FOR_PROCESSING'::text,
	personalMediaIds text NULL,
	enterpriseMediaIds text NULL,
	enterprisename text NULL,
	pageid int4 NOT NULL,
	identityCode text NULL,
	identityType text NULL,
	fullName text NOT NULL,
	nationality text NULL,
	reason text NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT pageverification_pkey PRIMARY KEY (id)
);
