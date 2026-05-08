// Topic + item storage backed by Lovable Cloud (Supabase).
// Signatures preserved for backward compatibility — `token` args are now ignored.
import { supabase } from '@/integrations/supabase/client';
import type { TopicData, TopicIndex, ICItem } from '@/types/ichub';
import { currentUserId } from './currentUser';

function rowToItem(r: any): ICItem {
  return {
    id: r.id,
    type: r.type,
    title: r.title || '',
    description: r.description || '',
    thumbnail: r.thumbnail || '',
    file: r.file || '',
    tags: r.tags || [],
    source: r.source || '',
    date: r.date || '',
    favorite: !!r.favorite,
    pinned: !!r.pinned,
    rating: r.rating || 0,
    annotation: r.annotation || '',
  };
}

function rowToTopic(r: any, items: ICItem[]): TopicData {
  return {
    id: r.id,
    name: r.name,
    fullName: r.full_name || '',
    description: r.description || '',
    color: r.color || '',
    icon: r.icon || '',
    items,
  };
}

export async function readIndex(): Promise<TopicIndex> {
  const { data, error } = await supabase.from('topics').select('id').order('sort_order');
  if (error) throw error;
  return { topics: (data || []).map((r: any) => r.id) };
}

export async function readTopic(topicId: string): Promise<{ data: TopicData; sha: string }> {
  const { data: t, error } = await supabase.from('topics').select('*').eq('id', topicId).maybeSingle();
  if (error) throw error;
  if (!t) throw new Error(`Topic not found: ${topicId}`);
  const { data: items } = await supabase
    .from('items').select('*').eq('topic_id', topicId).order('created_at');
  return { data: rowToTopic(t, (items || []).map(rowToItem)), sha: 'cloud' };
}

export async function readAllTopics(): Promise<TopicData[]> {
  const { data: topics, error } = await supabase.from('topics').select('*').order('sort_order');
  if (error) throw error;
  const { data: items } = await supabase.from('items').select('*');
  const byTopic: Record<string, ICItem[]> = {};
  (items || []).forEach((r: any) => {
    (byTopic[r.topic_id] = byTopic[r.topic_id] || []).push(rowToItem(r));
  });
  return (topics || []).map((t: any) => rowToTopic(t, byTopic[t.id] || []));
}

// Internal: keep topics/items in sync. writeTopic gets a full TopicData; we diff items.
export async function writeTopic(
  topicId: string,
  data: TopicData,
  _sha: string,
  _message: string,
  _token?: string,
): Promise<string> {
  const user_id = await currentUserId();
  await supabase.from('topics').update({
    name: data.name, full_name: data.fullName, description: data.description,
    color: data.color, icon: data.icon,
  }).eq('id', topicId);

  const { data: existing } = await supabase.from('items').select('id').eq('topic_id', topicId);
  const existingIds = new Set((existing || []).map((r: any) => r.id));
  const newIds = new Set(data.items.map(i => i.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) {
    await supabase.from('items').delete().in('id', toDelete);
  }
  for (const it of data.items) {
    const row = {
      user_id, id: it.id, topic_id: topicId,
      type: it.type, title: it.title, description: it.description,
      file: it.file || '', thumbnail: it.thumbnail || '',
      tags: it.tags || [], source: it.source || '',
      date: it.date || null, rating: it.rating || 0,
      annotation: it.annotation || '',
      favorite: !!it.favorite, pinned: !!it.pinned,
    };
    await supabase.from('items').upsert(row, { onConflict: 'user_id,id' });
  }
  return 'ok';
}

export async function addItem(topicId: string, item: ICItem, _token?: string): Promise<string> {
  const user_id = await currentUserId();
  const { error } = await supabase.from('items').insert({
    user_id, id: item.id, topic_id: topicId,
    type: item.type, title: item.title, description: item.description,
    file: item.file || '', thumbnail: item.thumbnail || '',
    tags: item.tags || [], source: item.source || '',
    date: item.date || null, rating: item.rating || 0,
    annotation: item.annotation || '',
    favorite: !!item.favorite, pinned: !!item.pinned,
  });
  if (error) throw error;
  return 'ok';
}

export async function editItem(
  _topicId: string, itemId: string, updates: Partial<ICItem>, _token?: string,
): Promise<string> {
  const patch: any = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.file !== undefined) patch.file = updates.file;
  if (updates.thumbnail !== undefined) patch.thumbnail = updates.thumbnail;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.source !== undefined) patch.source = updates.source;
  if (updates.date !== undefined) patch.date = updates.date || null;
  if (updates.rating !== undefined) patch.rating = updates.rating;
  if (updates.annotation !== undefined) patch.annotation = updates.annotation;
  if (updates.favorite !== undefined) patch.favorite = updates.favorite;
  if (updates.pinned !== undefined) patch.pinned = updates.pinned;
  const { error } = await supabase.from('items').update(patch).eq('id', itemId);
  if (error) throw error;
  return 'ok';
}

export async function deleteItem(_topicId: string, itemId: string, _token?: string): Promise<string> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  if (error) throw error;
  return 'ok';
}

export async function createTopic(t: TopicData, _token?: string): Promise<string> {
  const user_id = await currentUserId();
  const { data: maxRow } = await supabase
    .from('topics').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const sort_order = (maxRow?.sort_order ?? -1) + 1;
  const { error } = await supabase.from('topics').insert({
    user_id, id: t.id, name: t.name, full_name: t.fullName,
    description: t.description, color: t.color, icon: t.icon, sort_order,
  });
  if (error) throw error;
  return 'ok';
}

export async function editTopic(
  topicId: string,
  updates: Partial<Omit<TopicData, 'id' | 'items'>>,
  _token?: string,
): Promise<string> {
  const patch: any = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.fullName !== undefined) patch.full_name = updates.fullName;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.color !== undefined) patch.color = updates.color;
  if (updates.icon !== undefined) patch.icon = updates.icon;
  const { error } = await supabase.from('topics').update(patch).eq('id', topicId);
  if (error) throw error;
  return 'ok';
}

export async function deleteTopic(topicId: string, _token?: string): Promise<string> {
  const { error } = await supabase.from('topics').delete().eq('id', topicId);
  if (error) throw error;
  return 'ok';
}
