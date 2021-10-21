CREATE TABLE IF NOT EXISTS public.staticpage( 
  id serial NOT NULL,
  alias text NOT NULL,
  content text NOT NULL,
  createdat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
  deletedat timestamptz NULL,
  CONSTRAINT staticpage_pkey PRIMARY KEY (id),
  CONSTRAINT uique_alias_page UNIQUE (alias)
);