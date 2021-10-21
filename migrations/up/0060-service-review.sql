CREATE TABLE IF NOT EXISTS public.servicereview (
	id serial NOT NULL,
	isactive bool NOT NULL DEFAULT true,
	createdbyid int4 NOT NULL,
	serviceid int4 NOT NULL,
	bookingid int4 NOT NULL,
  point int4 NOT NULL,
  postid int4 NOT NULL,
	createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	deletedat timestamptz NULL,
	CONSTRAINT servicereview_pkey PRIMARY KEY (id),
	CONSTRAINT uique_service_review_bookingid UNIQUE (bookingid),
  CONSTRAINT fk_service_review_created_by_id FOREIGN KEY (createdbyid) REFERENCES users (id),
  CONSTRAINT fk_service_review_service_id FOREIGN KEY (serviceid) REFERENCES service (id),
  CONSTRAINT fk_service_review_booking_id FOREIGN KEY (bookingid) REFERENCES booking (id),
  CONSTRAINT fk_service_review_post_id FOREIGN KEY (postid) REFERENCES posts (id)
);