CREATE TABLE IF NOT EXISTS public.stayspecialdayprice (
	id serial NOT NULL,
	price DECIMAL(19, 4) NOT NULL,
	date timestamptz NOT NULL,
	serviceid int4 NOT NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT stay_special_day_price_pkey PRIMARY KEY (id),
  CONSTRAINT fk_stay_special_price_service FOREIGN KEY (serviceid) REFERENCES service (id),
	CONSTRAINT uique_service_date_special_price UNIQUE (serviceid, date)
);