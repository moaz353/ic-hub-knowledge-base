import { useState } from 'react';
import { Check, RefreshCw, ExternalLink } from 'lucide-react';
import type { ICItem } from '@/types/ichub';
import { getDailyReview, markReview, getDaysSinceOpened } from '@/services/dailyReview';
import { setLastOpened } from '@/services/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ItemCard from './ItemCard';

interface Props {
  allItems: { item: ICItem; topicId: string; topicName: string; topicColor: string }[];
}

export default function DailyReview({ allItems }: Props) {
  const [review, setReview] = useState(() => getDailyReview(allItems));
  const [streak, setStreak] = useState(review?.streak || 0);
  const [cardOpen, setCardOpen] = useState(false);

  if (!review) return null;

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
    <section className="mb-5">
      {isDone ? (
        <div className="daily-review-pill mx-auto flex items-center gap-3 rounded-[40px] border border-border bg-[hsl(var(--card))] px-4 py-2 transition-all duration-[220ms] ease-in-out hover:scale-[1.04] hover:border-accent hover:bg-[hsl(var(--secondary))]">
          <span className="shrink-0 rounded-full bg-[#22c55e18] px-2.5 py-0.5 text-[11px] font-semibold text-[#22c55e]">
            Daily Review
          </span>
          <span className="text-sm text-muted-foreground">See you tomorrow!</span>
          {streak > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground">🔥 {streak} day streak</span>
            </>
          )}
        </div>
      ) : (
        <div className="daily-review-pill group/pill mx-auto flex items-center gap-3 rounded-[40px] border border-border bg-[hsl(var(--card))] px-4 py-2 transition-all duration-[220ms] ease-in-out hover:scale-[1.04] hover:border-accent hover:bg-[hsl(var(--secondary))]">
          <span className="shrink-0 rounded-full bg-[#22c55e18] px-2.5 py-0.5 text-[11px] font-semibold text-[#22c55e]">
            Daily Review
          </span>
          <button
            onClick={() => setCardOpen(true)}
            className="min-w-0 truncate text-[13px] text-foreground transition-all duration-[220ms] group-hover/pill:text-[15px] group-hover/pill:text-white hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            {review.item.title}
          </button>
          <div className="h-4 w-px shrink-0 bg-border" />
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handleGotIt}
              title="Got it"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22c55e20] text-[#22c55e] transition-all duration-[220ms] ease-in-out hover:scale-[1.18] hover:bg-[#22c55e30] group-hover/pill:h-[30px] group-hover/pill:w-[30px]"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleLater}
              title="Review later"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f59e0b20] text-[#f59e0b] transition-all duration-[220ms] ease-in-out hover:scale-[1.18] hover:bg-[#f59e0b30] group-hover/pill:h-[30px] group-hover/pill:w-[30px]"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleOpen}
              title="Open"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-[220ms] ease-in-out hover:scale-[1.18] hover:bg-secondary hover:text-foreground group-hover/pill:h-[30px] group-hover/pill:w-[30px]"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
