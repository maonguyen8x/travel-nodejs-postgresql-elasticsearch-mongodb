CREATE TABLE IF NOT EXISTS public.importlogs (
	id serial NOT NULL,
	filename text NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT import_logs_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS import_logs_idx ON public.importlogs USING btree (filename);