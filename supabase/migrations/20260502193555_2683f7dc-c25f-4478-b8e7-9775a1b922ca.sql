-- ===== Lesson/Lab Resources =====
CREATE TABLE public.lesson_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'pdf' | 'image' | 'video' | 'code' | 'link'
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  -- Type-specific payload
  url TEXT, -- for pdf/image (storage URL), video (yt/mp4), link
  storage_path TEXT, -- for uploaded files (pdf/image) so we can delete from storage
  file_size INTEGER, -- bytes (pdf/image)
  page_count INTEGER, -- pdf
  language TEXT, -- code: verilog/systemverilog/tcl/python
  code_content TEXT, -- code body
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lesson_resources_lesson ON public.lesson_resources(lesson_id);

ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lesson_resources" ON public.lesson_resources FOR SELECT USING (true);
CREATE POLICY "Public insert lesson_resources" ON public.lesson_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update lesson_resources" ON public.lesson_resources FOR UPDATE USING (true);
CREATE POLICY "Public delete lesson_resources" ON public.lesson_resources FOR DELETE USING (true);

CREATE TRIGGER update_lesson_resources_updated_at
BEFORE UPDATE ON public.lesson_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Standalone Notes =====
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Public insert notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notes" ON public.notes FOR UPDATE USING (true);
CREATE POLICY "Public delete notes" ON public.notes FOR DELETE USING (true);

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Tasks =====
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_id UUID, -- optional link to course
  context_label TEXT NOT NULL DEFAULT '', -- free text fallback (e.g. "Daily")
  due_date DATE,
  cadence TEXT NOT NULL DEFAULT 'once', -- 'once' | 'daily' | 'weekly'
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo' | 'in_progress' | 'done'
  progress INTEGER NOT NULL DEFAULT 0, -- 0..100
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_due ON public.tasks(due_date);
CREATE INDEX idx_tasks_course ON public.tasks(course_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Public delete tasks" ON public.tasks FOR DELETE USING (true);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();