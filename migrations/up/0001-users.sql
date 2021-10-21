CREATE TABLE IF NOT EXISTS public.users (
	id serial NOT NULL,
	"name" text NOT NULL,
	username text NOT NULL,
	isactive bool NULL DEFAULT false,
	usertypeaccess text NULL DEFAULT 'NORMAL'::text,
	blockmessage text NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	blockedat timestamptz DEFAULT NULL,
	totalfollowing int4 NULL DEFAULT 0,
	totalfollower int4 NULL DEFAULT 0,
	roles text NULL,
	scopes text NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id)
);
