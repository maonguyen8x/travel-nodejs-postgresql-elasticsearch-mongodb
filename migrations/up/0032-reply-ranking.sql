CREATE TABLE IF NOT EXISTS public.replyranking (
	id serial NOT NULL,
	"content" text NULL,
	totallike int4 NULL DEFAULT 0,
	userid int4 NULL,
	rankingid int4 NULL,
	createdat timestamptz DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT replyranking_pkey PRIMARY KEY (id)
);