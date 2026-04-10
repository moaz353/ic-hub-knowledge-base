import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, RefreshCw, ExternalLink } from 'lucide-react';
import type { ICItem } from '@/types/ichub';
import { getDailyReview, markReview, getDaysSinceOpened } from '@/services/dailyReview';
import { reviewCard, getDueCount } from '@/services/sm2';
import { logActivity } from '@/services/activityLog';
import { setLastOpened } from '@/services/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ItemCard from './ItemCard';

interface Props {
  allItems: { item: ICItem; topicId: string; topicName: string; topicColor: string }[];
}

const QUALITY_BUTTONS = [
  { label: 'Again', quality: 0, color: '#ef4444' },
  { label: 'Hard', quality: 2, color: '#f59e0b' },
  { label: 'Good', quality: 4, color: '#22c55e' },
  { label: 'Easy', quality: 5, color: '#3b82f6' },
];

export default function DailyReview({ allItems }: Props) {
  const [review, setReview] = useState(() => getDailyReview(allItems));
  const [streak, setStreak] = useState(review?.streak || 0);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardOrigin, setCardOrigin] = useState('top left');
  const [sm2Mode, setSm2Mode] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDueCount().then(setDueCount).catch(() => {});
  }, []);

  if (!review) return null;

  const isDone = review.status !== 'pending';

  const handleGotIt = () => {
    const s = markReview('got_it');
    setStreak(s);
    setReview(prev => prev ? { ...prev, status: 'got_it' } : null);
    logActivity('review', review.item.id, review.topicId);
  };

  const handleLater = () => {
    const s = markReview('later');
    setStreak(s);
    setReview(prev => prev ? { ...prev, status: 'later' } : null);
  };

  const handleSm2 = async (quality: number) => {
    try {
      await reviewCard(review.item.id, review.topicId, quality);
      logActivity('review', review.item.id, review.topicId);
    } catch (e) {
      console.error('SM-2 review failed:', e);
    }
    handleGotIt();
    setSm2Mode(false);
  };

  const handleOpen = () => {
    setLastOpened(review.item.id);
    logActivity('open_item', review.item.id, review.topicId);
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
          {dueCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground">📚 {dueCount} due</span>
            </>
          )}
        </div>
      ) : (
        <div className="daily-review-pill group/pill mx-auto flex flex-wrap items-center gap-3 rounded-[40px] border border-border bg-[hsl(var(--card))] px-4 py-2 transition-all duration-[220ms] ease-in-out hover:scale-[1.04] hover:border-accent hover:bg-[hsl(var(--secondary))]">
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

          {sm2Mode ? (
            <div className="flex shrink-0 items-center gap-1">
              {QUALITY_BUTTONS.map(btn => (
                <button
                  key={btn.label}
                  onClick={() => handleSm2(btn.quality)}
                  title={btn.label}
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-[220ms] hover:scale-[1.1]"
                  style={{ backgroundColor: `${btn.color}20`, color: btn.color }}
                >
                  {btn.label}
                </button>
              ))}
              <button
                onClick={() => setSm2Mode(false)}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setSm2Mode(true)}
                title="Rate recall (SM-2)"
                className="flex h-7 items-center gap-1 rounded-full bg-[#3b82f620] px-2 text-[11px] font-medium text-[#3b82f6] transition-all duration-[220ms] ease-in-out hover:scale-[1.18] hover:bg-[#3b82f630]"
              >
                Rate
              </button>
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
          )}

          {dueCount > 0 && (
            <>
              <div className="h-4 w-px shrink-0 bg-border" />
              <span className="text-xs text-muted-foreground">📚 {dueCount} due</span>
            </>
          )}
        </div>
      )}

      {/* Item Card Modal */}
      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent className="max-w-sm p-0 border-none bg-transparent shadow-none [&>button]:hidden">
          <div ref={cardRef} style={{ transformOrigin: cardOrigin }}>
            <ItemCard
              item={review.item}
              topicColor={allItems.find(a => a.item.id === review.item.id)?.topicColor || '#58a6ff'}
              topicId={allItems.find(a => a.item.id === review.item.id)?.topicId || ''}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
