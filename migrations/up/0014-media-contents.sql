CREATE TABLE IF NOT EXISTS public.mediacontents (
	id serial NOT NULL,
	url text NOT NULL,
	urlblur text NULL,
	urltiny text NULL,
	urloptimize text NULL,
	urlbackground text NULL,
	metadata text NULL,
	publicid text NULL,
	format text NULL,
	mediatype text NULL DEFAULT 'UPLOAD'::text,
	resourcetype text NULL,
	filename text NULL,
	"path" text NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	postid int4 NULL,
	userid int4 NULL,
	CONSTRAINT mediacontents_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS mediacontents_post_id_idx ON public.mediacontents USING btree (postid);