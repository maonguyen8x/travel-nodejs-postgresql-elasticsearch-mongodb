CREATE TABLE IF NOT EXISTS public.usersblock ( 
  id serial NOT NULL,
  creatorId int4 NOT NULL REFERENCES users(id),
  userId int4 NOT NULL REFERENCES users(id),
  createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  CHECK (userId != creatorId),
  CONSTRAINT users_block_pkey PRIMARY KEY (id),
  CONSTRAINT uique_creator_user UNIQUE (creatorId, userId)
);
