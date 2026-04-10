
-- SM-2 Spaced Repetition cards
CREATE TABLE public.review_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date DATE,
  last_quality INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id)
);

ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read review_cards" ON public.review_cards FOR SELECT USING (true);
CREATE POLICY "Public insert review_cards" ON public.review_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update review_cards" ON public.review_cards FOR UPDATE USING (true);
CREATE POLICY "Public delete review_cards" ON public.review_cards FOR DELETE USING (true);

-- Activity log for heatmap
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_type TEXT NOT NULL,
  item_id TEXT,
  topic_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read activity_log" ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "Public insert activity_log" ON public.activity_log FOR INSERT WITH CHECK (true);

CREATE INDEX idx_activity_log_date ON public.activity_log(activity_date);

-- Rich notes per item
CREATE TABLE public.rich_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'markdown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id)
);

ALTER TABLE public.rich_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read rich_notes" ON public.rich_notes FOR SELECT USING (true);
CREATE POLICY "Public insert rich_notes" ON public.rich_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rich_notes" ON public.rich_notes FOR UPDATE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_review_cards_updated_at BEFORE UPDATE ON public.review_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rich_notes_updated_at BEFORE UPDATE ON public.rich_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
