CREATE TABLE IF NOT EXISTS public.task (
	id serial NOT NULL,
	tasktype text NOT NULL,
	status text NULL DEFAULT 'INCOMPLETE'::text,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	planid int4 NULL,
	locationid int4 NULL,
	index int4 NULL,
	taskdate text NULL,
	CONSTRAINT task_pkey PRIMARY KEY (id)
);