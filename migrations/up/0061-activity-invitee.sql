CREATE TABLE IF NOT EXISTS public.activityinvitee (
	id serial NOT NULL,
  activityid int4 NOT NULL,
  userid int4 NOT NULL,
  status text NOT NULL DEFAULT 'INVITED'::text,
  createdat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  CONSTRAINT activityinvitee_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS activity_invitee_id_idx ON public.activityinvitee USING btree (activityid, userid);