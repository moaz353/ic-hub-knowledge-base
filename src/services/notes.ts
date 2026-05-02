import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes' as any)
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Note[];
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase
    .from('notes' as any)
    .insert(note as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Note;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const { error } = await supabase.from('notes' as any).update(updates as any).eq('id', id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes' as any).delete().eq('id', id);
  if (error) throw error;
}
