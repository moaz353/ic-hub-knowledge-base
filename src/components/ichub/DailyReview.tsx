import { useState } from 'react';
import type { ICItem } from '@/types/ichub';
import { getDailyReview, markReview, getDaysSinceOpened } from '@/services/dailyReview';
import { setLastOpened } from '@/services/utils';

interface Props {
  allItems: { item: ICItem; topicId: string; topicName: string; topicColor: string }[];
}

export default function DailyReview({ allItems }: Props) {
  const [review, setReview] = useState(() => getDailyReview(allItems));
  const [streak, setStreak] = useState(review?.streak || 0);

  if (!review) return null;

  const daysSince = getDaysSinceOpened(review.item.id);
  const isDone = review.status !== 'pending';

  const handleGotIt = () => {
    const s = markReview('got_it');
    setStreak(s);
    setReview(prev => prev ? { ...prev, status: 'got_it' } : null);
  };

  const handleLater = () => {
    const s = markReview('later');
    setStreak(s);
    setReview(prev => prev ? { ...prev, status: 'later' } : null);
  };

  const handleOpen = () => {
    setLastOpened(review.item.id);
    window.open(review.item.file, '_blank');
  };

  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <span>📖</span> Daily Review
      </h2>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isDone ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <span className="text-2xl">✓</span>
            <p className="text-sm text-foreground">See you tomorrow!</p>
            {streak > 0 && (
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${review.topicColor}20`, color: review.topicColor }}>
                🔥 {streak} day streak
              </span>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-3 flex items-start gap-3">
              <span className="mt-0.5 text-xl" style={{ color: review.topicColor }}>📖</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{review.item.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${review.topicColor}20`, color: review.topicColor }}>
                    {review.topicName}
                  </span>
                  {daysSince !== null && (
                    <span className="text-xs text-muted-foreground">
                      Last opened {daysSince === 0 ? 'today' : `${daysSince}d ago`}
                    </span>
                  )}
                  {daysSince === null && (
                    <span className="text-xs text-muted-foreground">Never opened</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGotIt}
                className="flex-1 rounded-md py-1.5 text-xs font-medium text-primary-foreground transition-colors"
                style={{ backgroundColor: '#22c55e' }}
              >
                ✓ Got it
              </button>
              <button
                onClick={handleLater}
                className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors"
                style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
              >
                ↻ Review later
              </button>
              <button
                onClick={handleOpen}
                className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Open
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
