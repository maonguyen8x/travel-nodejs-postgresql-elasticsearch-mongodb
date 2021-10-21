CREATE TABLE IF NOT EXISTS public.useraddress (
	id serial NOT NULL,
	address text NULL,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT useraddress_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS useraddress_profile_id_idx ON public.useraddress USING btree (profileid);