CREATE TABLE IF NOT EXISTS public.userintroduce (
	id serial NOT NULL,
	introduce text NULL,
	ispublic bool NULL DEFAULT false,
	profileid int4 NOT NULL,
	CONSTRAINT userintroduce_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS userintroduce_profile_id_idx ON public.userintroduce USING btree (profileid);