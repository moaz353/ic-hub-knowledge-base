import { supabase } from '@/integrations/supabase/client';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCadence = 'once' | 'daily' | 'weekly';

export interface Task {
  id: string;
  name: string;
  course_id: string | null;
  context_label: string;
  due_date: string | null;
  cadence: TaskCadence;
  status: TaskStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks' as any)
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []) as unknown as Task[];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks' as any)
    .insert(task as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks' as any).update(updates as any).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks' as any).delete().eq('id', id);
  if (error) throw error;
}
