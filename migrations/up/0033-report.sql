CREATE TABLE IF NOT EXISTS public.report (
	id serial NOT NULL,
	"content" text NULL,
	reasontype text NOT NULL DEFAULT 'OTHER'::text,
	feedback text NULL,
	reporttype text NULL,
	reportstatus text NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	userid int4 NULL,
	targetuserid int4 NULL,
	targetpostid int4 NULL,
	targetrankingid int4 NULL,
	targetlocationid int4 NULL,
	targetpageid int4 NULL,
	targetactivityid int4 NULL,
	CONSTRAINT report_pkey PRIMARY KEY (id)
);