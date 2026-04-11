
-- Courses table
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT '',
  progress real NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  estimated_hours real NOT NULL DEFAULT 0,
  last_activity timestamp with time zone,
  thumbnail text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public insert courses" ON public.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update courses" ON public.courses FOR UPDATE USING (true);
CREATE POLICY "Public delete courses" ON public.courses FOR DELETE USING (true);

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Course lessons table
CREATE TABLE public.course_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  bookmarked boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read course_lessons" ON public.course_lessons FOR SELECT USING (true);
CREATE POLICY "Public insert course_lessons" ON public.course_lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update course_lessons" ON public.course_lessons FOR UPDATE USING (true);
CREATE POLICY "Public delete course_lessons" ON public.course_lessons FOR DELETE USING (true);

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Course sessions table (for heatmap & stats)
CREATE TABLE public.course_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read course_sessions" ON public.course_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert course_sessions" ON public.course_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update course_sessions" ON public.course_sessions FOR UPDATE USING (true);
CREATE POLICY "Public delete course_sessions" ON public.course_sessions FOR DELETE USING (true);
