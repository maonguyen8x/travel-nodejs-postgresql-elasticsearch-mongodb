CREATE TABLE IF NOT EXISTS public.monitoring (
	id serial NOT NULL,
	zabbixurl text NULL,
	zabbixid text NULL,
	zabbixpassword text NULL,
	grafanaurl text NULL,
	grafanaid text NULL,
	grafanapassword text NULL,
	sustainmenturl text NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT integration_pkey PRIMARY KEY (id)
);