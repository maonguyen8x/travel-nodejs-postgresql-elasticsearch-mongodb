CREATE TABLE IF NOT EXISTS public.activityparticipant (
	id serial NOT NULL,
  activityid int4 NOT NULL,
  userid int4 NOT NULL,
  status text NOT NULL DEFAULT 'JOIN'::text,
  createdat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  CONSTRAINT activityparticipant_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS activity_participant_id_idx ON public.activityparticipant USING btree (activityid, userid);