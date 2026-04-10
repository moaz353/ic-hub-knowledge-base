import { supabase } from '@/integrations/supabase/client';

export interface RichNote {
  id: string;
  item_id: string;
  content: string;
  format: string;
  updated_at: string;
}

export async function getNote(itemId: string): Promise<RichNote | null> {
  const { data } = await supabase
    .from('rich_notes')
    .select('*')
    .eq('item_id', itemId)
    .maybeSingle();
  return data as RichNote | null;
}

export async function saveNote(itemId: string, content: string): Promise<void> {
  const existing = await getNote(itemId);
  if (existing) {
    await supabase
      .from('rich_notes')
      .update({ content })
      .eq('item_id', itemId);
  } else {
    await supabase
      .from('rich_notes')
      .insert({ item_id: itemId, content, format: 'markdown' });
  }
}
