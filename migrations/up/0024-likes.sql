CREATE TABLE IF NOT EXISTS public.likes (
	id serial NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	userid int4 NOT NULL,
	postid int4 NULL,
	commentid int4 NULL,
	childcommentid int4 NULL,
	rankingid int4 NULL,
	replyrankingid int4 NULL,
	CONSTRAINT likes_pkey PRIMARY KEY (id)
);
