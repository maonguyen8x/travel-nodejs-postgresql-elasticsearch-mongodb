CREATE TABLE IF NOT EXISTS public.bookmarklocation (
	id serial NOT NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	locationid int4 NOT NULL,
	userid int4 NOT NULL,
	status text NULL,
	CONSTRAINT bookmarkplace_pkey PRIMARY KEY (id)
);