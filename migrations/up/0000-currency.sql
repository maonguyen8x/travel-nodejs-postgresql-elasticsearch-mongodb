
CREATE TABLE IF NOT EXISTS public.currency (
	id serial NOT NULL,
	code text NULL,
	symbol text NULL,
	"text" text NULL,
	CONSTRAINT currency_pkey PRIMARY KEY (id)
);