CREATE TABLE IF NOT EXISTS public.stayoffday (
	id serial NOT NULL,
	date timestamptz NOT NULL,
	serviceid int4 NOT NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT stay_off_day_pkey PRIMARY KEY (id),
  CONSTRAINT fk_stay_off_day_service FOREIGN KEY (serviceid) REFERENCES service (id),
	CONSTRAINT uique_service_date UNIQUE (serviceid, date)
);