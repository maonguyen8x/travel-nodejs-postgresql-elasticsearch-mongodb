ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS  fk_plan;
ALTER TABLE public.posts ADD CONSTRAINT fk_plan FOREIGN KEY (planid) REFERENCES plan(id) ON DELETE SET NULL;