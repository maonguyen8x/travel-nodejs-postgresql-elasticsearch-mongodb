CREATE TABLE IF NOT EXISTS public.comments (
	id serial NOT NULL,
	"content" text NULL,
	totallike int4 NULL DEFAULT 0,
	totalreply int4 NULL DEFAULT 0,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	userid int4 NOT NULL,
	postid int4 NOT NULL,
	CONSTRAINT comments_pkey PRIMARY KEY (id)
);
