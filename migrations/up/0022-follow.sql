CREATE TABLE IF NOT EXISTS public.follow (
	id serial NOT NULL,
	followstatus text NULL DEFAULT 'REQUESTED'::text,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	userid int4 NOT NULL,
	followingid int4 NOT NULL,
	CONSTRAINT follow_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS follow_user_id_idx ON public.follow USING btree (userid);
CREATE INDEX IF NOT EXISTS follow_following_id_idx ON public.follow USING btree (followingid);
CREATE UNIQUE INDEX IF NOT EXISTS follow_following_user_idx ON public.follow USING btree (followingid, userid);