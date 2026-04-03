import type { ICItem } from '@/types/ichub';
import { getLastOpened } from './utils';

interface ReviewState {
  date: string; // YYYY-MM-DD
  itemId: string;
  topicId: string;
  status: 'pending' | 'got_it' | 'later';
  streak: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getReviewState(): ReviewState | null {
  try {
    return JSON.parse(localStorage.getItem('ichub_daily_review') || 'null');
  } catch { return null; }
}

function setReviewState(state: ReviewState): void {
  localStorage.setItem('ichub_daily_review', JSON.stringify(state));
}

export function getDailyReview(
  allItems: { item: ICItem; topicId: string; topicName: string; topicColor: string }[]
): { item: ICItem; topicId: string; topicName: string; topicColor: string; status: 'pending' | 'got_it' | 'later'; streak: number } | null {
  if (allItems.length === 0) return null;

  const today = todayKey();
  const state = getReviewState();

  // Already have today's review
  if (state && state.date === today) {
    const match = allItems.find(x => x.item.id === state.itemId);
    if (match) {
      return { ...match, status: state.status, streak: state.streak };
    }
  }

  // Pick new item — avoid yesterday's
  const yesterdayState = state;
  const candidates = yesterdayState
    ? allItems.filter(x => x.item.id !== yesterdayState.itemId)
    : allItems;

  const pool = candidates.length > 0 ? candidates : allItems;

  // Seed based on date for deterministic daily pick
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const picked = pool[seed % pool.length];

  // Compute streak
  let streak = 0;
  if (state && state.status === 'got_it') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    if (state.date === yKey) {
      streak = state.streak;
    }
  }

  const newState: ReviewState = {
    date: today,
    itemId: picked.item.id,
    topicId: picked.topicId,
    status: 'pending',
    streak,
  };
  setReviewState(newState);

  return { ...picked, status: 'pending', streak };
}

export function markReview(action: 'got_it' | 'later'): number {
  const state = getReviewState();
  if (!state) return 0;
  const newStreak = action === 'got_it' ? state.streak + 1 : 0;
  setReviewState({ ...state, status: action, streak: newStreak });
  return newStreak;
}

export function getDaysSinceOpened(itemId: string): number | null {
  const last = getLastOpened(itemId);
  if (!last) return null;
  const diff = Date.now() - new Date(last).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
