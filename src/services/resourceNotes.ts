import { supabase } from '@/integrations/supabase/client';
import { currentUserId } from './currentUser';

export interface ResourceNote {
  id: string;
  resource_id: string;
  title: string;
  body: string;
  rating: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchResourceNotes(resourceId: string): Promise<ResourceNote[]> {
  const { data, error } = await supabase
    .from('resource_notes' as any)
    .select('*')
    .eq('resource_id', resourceId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as ResourceNote[];
}

export async function addResourceNote(resourceId: string, sort_order: number): Promise<ResourceNote> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('resource_notes' as any)
    .insert({ resource_id: resourceId, title: 'New note', body: '', rating: 0, sort_order, user_id } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ResourceNote;
}

export async function updateResourceNote(id: string, updates: Partial<ResourceNote>): Promise<void> {
  const { error } = await supabase.from('resource_notes' as any).update(updates as any).eq('id', id);
  if (error) throw error;
}

export async function deleteResourceNote(id: string): Promise<void> {
  const { error } = await supabase.from('resource_notes' as any).delete().eq('id', id);
  if (error) throw error;
}
