CREATE TABLE IF NOT EXISTS public.backgroundpost (
	id serial NOT NULL,
	color text NULL,
	backgroundpost text NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	isactive bool NULL DEFAULT true,
	CONSTRAINT backgroundpost_pkey PRIMARY KEY (id)
);