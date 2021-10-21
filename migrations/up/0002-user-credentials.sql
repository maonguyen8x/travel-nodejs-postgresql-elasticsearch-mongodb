CREATE TABLE IF NOT EXISTS public.usercredentials (
	id serial NOT NULL,
	"password" text NOT NULL,
	usersid int4 NOT NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	CONSTRAINT usercredentials_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS usercredentials_id_idx ON public.usercredentials USING btree (usersid);