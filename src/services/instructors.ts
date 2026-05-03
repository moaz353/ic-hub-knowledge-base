import { supabase } from '@/integrations/supabase/client';

export interface Instructor {
  id: string;
  name: string;
  title: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const INSTRUCTOR_COLORS = [
  'violet', 'pink', 'sky', 'emerald', 'amber', 'rose', 'indigo', 'teal',
] as const;

export const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  violet:  { bg: 'bg-violet-500',  text: 'text-violet-100',  ring: 'ring-violet-400' },
  pink:    { bg: 'bg-pink-500',    text: 'text-pink-100',    ring: 'ring-pink-400' },
  sky:     { bg: 'bg-sky-500',     text: 'text-sky-100',     ring: 'ring-sky-400' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-100', ring: 'ring-emerald-400' },
  amber:   { bg: 'bg-amber-500',   text: 'text-amber-100',   ring: 'ring-amber-400' },
  rose:    { bg: 'bg-rose-500',    text: 'text-rose-100',    ring: 'ring-rose-400' },
  indigo:  { bg: 'bg-indigo-500',  text: 'text-indigo-100',  ring: 'ring-indigo-400' },
  teal:    { bg: 'bg-teal-500',    text: 'text-teal-100',    ring: 'ring-teal-400' },
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function fetchInstructors(): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from('instructors' as any)
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as Instructor[];
}

export async function createInstructor(payload: Partial<Instructor>): Promise<Instructor> {
  const { data, error } = await supabase
    .from('instructors' as any)
    .insert(payload as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Instructor;
}
