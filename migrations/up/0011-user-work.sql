CREATE TABLE IF NOT EXISTS public.userwork (
	id serial NOT NULL,
	"work" text NULL,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT userwork_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS userwork_profile_id_idx ON public.userwork USING btree (profileid);