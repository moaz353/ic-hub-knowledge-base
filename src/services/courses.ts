import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  name: string;
  description: string;
  provider: string;
  progress: number;
  status: string;
  estimated_hours: number;
  last_activity: string | null;
  thumbnail: string;
  instructor_id: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  section_id: string | null;
  kind: 'lesson' | 'lab';
  title: string;
  completed: boolean;
  sort_order: number;
  bookmarked: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CourseLink {
  id: string;
  course_id: string;
  name: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface CourseSession {
  id: string;
  course_id: string;
  session_date: string;
  duration_minutes: number;
  created_at: string;
}

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Course[];
}

export async function fetchCourse(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as unknown as Course;
}

export async function createCourse(course: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert(course as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Course;
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchLessons(courseId: string): Promise<CourseLesson[]> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as CourseLesson[];
}

export async function addLesson(
  courseId: string,
  title: string,
  sortOrder: number,
  sectionId: string | null = null,
  kind: 'lesson' | 'lab' = 'lesson',
): Promise<CourseLesson> {
  const { data, error } = await supabase
    .from('course_lessons')
    .insert({ course_id: courseId, title, sort_order: sortOrder, section_id: sectionId, kind } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CourseLesson;
}

export async function updateLesson(id: string, updates: Partial<CourseLesson>): Promise<void> {
  const { error } = await supabase
    .from('course_lessons')
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from('course_lessons').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchSessions(courseId: string): Promise<CourseSession[]> {
  const { data, error } = await supabase
    .from('course_sessions')
    .select('*')
    .eq('course_id', courseId)
    .order('session_date', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as CourseSession[];
}

export async function logSession(courseId: string, durationMinutes: number): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .insert({ course_id: courseId, duration_minutes: durationMinutes } as any);
  if (error) throw error;
}

export async function recalculateProgress(courseId: string): Promise<number> {
  const lessons = await fetchLessons(courseId);
  if (lessons.length === 0) return 0;
  const completed = lessons.filter(l => l.completed).length;
  const progress = Math.round((completed / lessons.length) * 100);
  const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
  await updateCourse(courseId, { progress, status, last_activity: new Date().toISOString() } as any);
  return progress;
}

// ============ Sections ============
export async function fetchSections(courseId: string): Promise<CourseSection[]> {
  const { data, error } = await supabase
    .from('course_sections' as any)
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as CourseSection[];
}

export async function addSection(courseId: string, name: string, sortOrder: number): Promise<CourseSection> {
  const { data, error } = await supabase
    .from('course_sections' as any)
    .insert({ course_id: courseId, name, sort_order: sortOrder } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CourseSection;
}

export async function deleteSection(id: string): Promise<void> {
  // Detach lessons in this section (set section_id to null) so they aren't lost
  await supabase.from('course_lessons').update({ section_id: null } as any).eq('section_id', id);
  const { error } = await supabase.from('course_sections' as any).delete().eq('id', id);
  if (error) throw error;
}

// ============ Shared Links ============
export async function fetchCourseLinks(courseId: string): Promise<CourseLink[]> {
  const { data, error } = await supabase
    .from('course_links' as any)
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as CourseLink[];
}

export async function addCourseLink(courseId: string, name: string, url: string, sortOrder: number): Promise<CourseLink> {
  const { data, error } = await supabase
    .from('course_links' as any)
    .insert({ course_id: courseId, name, url, sort_order: sortOrder } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CourseLink;
}

export async function deleteCourseLink(id: string): Promise<void> {
  const { error } = await supabase.from('course_links' as any).delete().eq('id', id);
  if (error) throw error;
}
