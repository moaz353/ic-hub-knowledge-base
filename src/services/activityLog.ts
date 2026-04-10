import { supabase } from '@/integrations/supabase/client';

export type ActionType = 'review' | 'add_item' | 'edit_item' | 'open_item' | 'note_saved';

export async function logActivity(
  actionType: ActionType,
  itemId?: string,
  topicId?: string
): Promise<void> {
  await supabase.from('activity_log').insert({
    action_type: actionType,
    item_id: itemId || null,
    topic_id: topicId || null,
    activity_date: new Date().toISOString().slice(0, 10),
  });
}

export interface DayActivity {
  date: string;
  count: number;
}

export async function getActivityHeatmap(days: number = 365): Promise<DayActivity[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('activity_log')
    .select('activity_date')
    .gte('activity_date', sinceStr)
    .order('activity_date', { ascending: true });

  if (error || !data) return [];

  const map: Record<string, number> = {};
  data.forEach((row: any) => {
    const d = row.activity_date;
    map[d] = (map[d] || 0) + 1;
  });

  return Object.entries(map).map(([date, count]) => ({ date, count }));
}
