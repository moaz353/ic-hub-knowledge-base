import { supabase } from '@/integrations/supabase/client';

export interface ReviewCard {
  id: string;
  item_id: string;
  topic_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_review_date: string | null;
  last_quality: number | null;
}

/**
 * SM-2 Algorithm
 * quality: 0-5 (0=complete blackout, 5=perfect recall)
 * Simplified to 4 buttons: Again(0), Hard(2), Good(4), Easy(5)
 */
function sm2(card: ReviewCard, quality: number): Partial<ReviewCard> {
  let { ease_factor, interval, repetitions } = card;

  if (quality < 3) {
    // Reset
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions += 1;
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + (interval || 1));

  return {
    ease_factor,
    interval,
    repetitions,
    last_quality: quality,
    last_review_date: today.toISOString().slice(0, 10),
    next_review_date: nextDate.toISOString().slice(0, 10),
  };
}

export async function getOrCreateCard(itemId: string, topicId: string): Promise<ReviewCard> {
  const { data, error } = await supabase
    .from('review_cards')
    .select('*')
    .eq('item_id', itemId)
    .maybeSingle();

  if (data) return data as ReviewCard;

  const newCard = {
    item_id: itemId,
    topic_id: topicId,
    ease_factor: 2.5,
    interval: 0,
    repetitions: 0,
    next_review_date: new Date().toISOString().slice(0, 10),
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('review_cards')
    .insert(newCard)
    .select()
    .single();

  if (insertErr) throw insertErr;
  return inserted as ReviewCard;
}

export async function reviewCard(itemId: string, topicId: string, quality: number): Promise<ReviewCard> {
  const card = await getOrCreateCard(itemId, topicId);
  const updates = sm2(card, quality);

  const { data, error } = await supabase
    .from('review_cards')
    .update(updates)
    .eq('item_id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as ReviewCard;
}

export async function getDueCards(): Promise<ReviewCard[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('review_cards')
    .select('*')
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true });

  if (error) throw error;
  return (data || []) as ReviewCard[];
}

export async function getDueCount(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from('review_cards')
    .select('*', { count: 'exact', head: true })
    .lte('next_review_date', today);

  if (error) return 0;
  return count || 0;
}
