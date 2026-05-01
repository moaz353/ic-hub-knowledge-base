
-- Sections (groups of lessons/labs within a course)
CREATE TABLE public.course_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read course_sections" ON public.course_sections FOR SELECT USING (true);
CREATE POLICY "Public insert course_sections" ON public.course_sections FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update course_sections" ON public.course_sections FOR UPDATE USING (true);
CREATE POLICY "Public delete course_sections" ON public.course_sections FOR DELETE USING (true);

-- Add section_id and kind (lesson|lab) to course_lessons
ALTER TABLE public.course_lessons
  ADD COLUMN section_id UUID,
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'lesson';

-- Shared links per course
CREATE TABLE public.course_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read course_links" ON public.course_links FOR SELECT USING (true);
CREATE POLICY "Public insert course_links" ON public.course_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update course_links" ON public.course_links FOR UPDATE USING (true);
CREATE POLICY "Public delete course_links" ON public.course_links FOR DELETE USING (true);
