CREATE TABLE public.resource_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resource_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read resource_notes" ON public.resource_notes FOR SELECT USING (true);
CREATE POLICY "Public insert resource_notes" ON public.resource_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update resource_notes" ON public.resource_notes FOR UPDATE USING (true);
CREATE POLICY "Public delete resource_notes" ON public.resource_notes FOR DELETE USING (true);
CREATE INDEX idx_resource_notes_resource_id ON public.resource_notes(resource_id);
CREATE TRIGGER update_resource_notes_updated_at
BEFORE UPDATE ON public.resource_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();