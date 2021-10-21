CREATE TABLE IF NOT EXISTS public.bookmark (
	id serial NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	userid int4 NULL,
	postid int4 NULL,
	CONSTRAINT bookmark_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS bookmark_post_user_idx ON public.bookmark USING btree (postid, userid);