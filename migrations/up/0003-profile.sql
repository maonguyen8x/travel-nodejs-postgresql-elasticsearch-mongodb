CREATE TABLE IF NOT EXISTS public.profiles (
	id serial NOT NULL,
	education text NULL,
	bio text NULL DEFAULT 'One of the proudest moment in a lifetime is the first step into unknown land.'::text,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz DEFAULT NULL,
	userid int4 NOT NULL,
	CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles USING btree (userid);