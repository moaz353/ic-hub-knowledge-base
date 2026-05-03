import { supabase } from '@/integrations/supabase/client';

export type ResourceType = 'pdf' | 'image' | 'video' | 'code' | 'link';
export type CodeLanguage = 'verilog' | 'systemverilog' | 'tcl' | 'python';

export interface LessonResource {
  id: string;
  lesson_id: string;
  type: ResourceType;
  name: string;
  description: string;
  url: string | null;
  storage_path: string | null;
  file_size: number | null;
  page_count: number | null;
  language: CodeLanguage | null;
  code_content: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchResources(lessonId: string): Promise<LessonResource[]> {
  const { data, error } = await supabase
    .from('lesson_resources' as any)
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as LessonResource[];
}

export async function addResource(
  lessonId: string,
  payload: Partial<LessonResource> & { type: ResourceType; name: string },
): Promise<LessonResource> {
  const { data, error } = await supabase
    .from('lesson_resources' as any)
    .insert({ lesson_id: lessonId, ...payload } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as LessonResource;
}

export async function deleteResource(id: string, storagePath?: string | null): Promise<void> {
  if (storagePath) {
    await supabase.storage.from('item-files').remove([storagePath]);
  }
  const { error } = await supabase.from('lesson_resources' as any).delete().eq('id', id);
  if (error) throw error;
}

export async function updateResourceOrder(id: string, sort_order: number): Promise<void> {
  const { error } = await supabase
    .from('lesson_resources' as any)
    .update({ sort_order } as any)
    .eq('id', id);
  if (error) throw error;
}

export async function uploadResourceFile(file: File, lessonId: string) {
  const ext = file.name.split('.').pop() || 'bin';
  const safeName = `lesson-resources/${lessonId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('item-files').upload(safeName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('item-files').getPublicUrl(safeName);
  return { url: data.publicUrl, path: safeName, size: file.size };
}
