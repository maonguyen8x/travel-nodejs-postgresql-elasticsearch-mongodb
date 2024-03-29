CREATE TABLE IF NOT EXISTS public.locationrequests (
	id serial NOT NULL,
	coordinates text NOT NULL,
	"name" text NOT NULL,
	formatedaddress text NOT NULL,
	address text NOT NULL,
	country text NULL,
	arealevel1 text NULL,
	arealevel2 text NULL,
	arealevel3 text NULL,
	arealevel4 text NULL,
	arealevel5 text NULL,
	locationtype text NOT NULL,
	refusingreason text NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	status text NULL,
	userid int4 NOT NULL,
	locationid int4 NOT NULL,
	CONSTRAINT locationrequests_pkey PRIMARY KEY (id)
);