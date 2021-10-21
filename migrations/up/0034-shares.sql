CREATE TABLE IF NOT EXISTS public.shares (
	id serial NOT NULL,
	createdat timestamptz,
	updatedat timestamptz,
	userid int4 NULL,
	postid int4 NULL,
	postshareid int4 NULL,
	"content" text NULL,
	deletedat timestamptz NULL,
	CONSTRAINT shares_pkey PRIMARY KEY (id)
);