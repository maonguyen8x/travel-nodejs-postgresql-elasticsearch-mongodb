CREATE TABLE IF NOT EXISTS public.timetoorganizetour (
	id serial NOT NULL,
	startdate timestamptz NOT NULL,
	enddate timestamptz NOT NULL,
	tourtype text NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	tourid int4 NOT NULL,
	CONSTRAINT timetoorganizetour_pkey PRIMARY KEY (id)
);
