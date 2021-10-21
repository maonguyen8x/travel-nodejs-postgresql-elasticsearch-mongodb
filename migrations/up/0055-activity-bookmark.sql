CREATE TABLE IF NOT EXISTS public.activitybookmark (
	id serial NOT NULL,
  activityid int4 NOT NULL,
  userid int4 NOT NULL,
  createdat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  CONSTRAINT activitybookmark_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS activity_bookmark_user_id_idx ON public.activitybookmark USING btree (activityid, userid);