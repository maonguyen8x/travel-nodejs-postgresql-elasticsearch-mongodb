CREATE TABLE IF NOT EXISTS public.childcomment (
	id serial NOT NULL,
	"content" text NULL,
	totallike int4 NULL DEFAULT 0,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	commentid int4 NOT NULL,
	userid int4 NOT NULL,
	CONSTRAINT childcomment_pkey PRIMARY KEY (id)
);
