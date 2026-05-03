
-- Global instructors table
CREATE TABLE public.instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read instructors" ON public.instructors FOR SELECT USING (true);
CREATE POLICY "Public insert instructors" ON public.instructors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update instructors" ON public.instructors FOR UPDATE USING (true);
CREATE POLICY "Public delete instructors" ON public.instructors FOR DELETE USING (true);

CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add course fields: instructor_id, start_date, end_date
ALTER TABLE public.courses
  ADD COLUMN instructor_id UUID,
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE;
