CREATE TABLE IF NOT EXISTS public.rankings (
	id serial NOT NULL,
	point int4 NULL,
	totallike int4 NULL DEFAULT 0,
	totalreply int4 NULL DEFAULT 0,
	review text NULL,
	rankingtype text NULL,
	rankingaccesstype text NULL,
	pageid int4 NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	userid int4 NOT NULL,
	locationid int4 NULL,
	postid int4 NULL,
	CONSTRAINT rankings_pkey PRIMARY KEY (id)
);