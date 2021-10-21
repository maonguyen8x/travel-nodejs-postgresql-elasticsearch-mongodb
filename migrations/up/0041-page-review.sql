CREATE TABLE IF NOT EXISTS public.pagereview (
	id serial NOT NULL,
	isactive bool NULL DEFAULT true,
	point int4 NOT NULL,
	createdbyid int4 NOT NULL,
	pageid int4 NOT NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	postid int4 NOT NULL,
	CONSTRAINT pagereview_pkey PRIMARY KEY (id),
	CONSTRAINT fk_page_review_created_by_id FOREIGN KEY (createdbyid) REFERENCES users (id),
  CONSTRAINT fk_page_review_page_id FOREIGN KEY (pageid) REFERENCES page (id),
  CONSTRAINT fk_service_review_post_id FOREIGN KEY (postid) REFERENCES posts (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uique_page_review_pageid_createdbyid on public.pagereview (pageid, createdbyid) WHERE deletedat IS NULL;