import { useEffect, useState } from 'react';
import { getActivityHeatmap, type DayActivity } from '@/services/activityLog';

const LEVELS = ['bg-[hsl(var(--secondary))]', 'bg-[#0e4429]', 'bg-[#006d32]', 'bg-[#26a641]', 'bg-[#39d353]'];

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function generateDayGrid(activities: DayActivity[]) {
  const map: Record<string, number> = {};
  activities.forEach(a => { map[a.date] = a.count; });

  const today = new Date();
  const days: { date: string; count: number }[] = [];

  // Go back ~52 weeks from today
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: map[key] || 0 });
  }

  return days;
}

export default function ContributionHeatmap() {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityHeatmap(365).then(setActivities).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-32 animate-pulse rounded-lg bg-secondary" />;
  }

  const days = generateDayGrid(activities);
  const max = Math.max(...days.map(d => d.count), 1);
  const totalActivities = activities.reduce((s, a) => s + a.count, 0);

  // Group by weeks (columns)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </h2>
        <span className="text-xs text-muted-foreground">
          {totalActivities} activities in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5">
          {/* Month labels */}
          <div className="flex gap-0.5 pl-8">
            {weeks.map((week, wi) => {
              const firstDay = week[0];
              if (!firstDay) return null;
              const d = new Date(firstDay.date);
              const showMonth = d.getDate() <= 7;
              return (
                <div key={wi} className="h-3 w-[11px] text-center">
                  {showMonth && (
                    <span className="text-[9px] text-muted-foreground">{months[d.getMonth()]}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day rows */}
          {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
            <div key={dayOfWeek} className="flex items-center gap-0.5">
              <span className="w-7 text-right text-[9px] text-muted-foreground pr-1">
                {dayOfWeek === 1 ? 'Mon' : dayOfWeek === 3 ? 'Wed' : dayOfWeek === 5 ? 'Fri' : ''}
              </span>
              {weeks.map((week, wi) => {
                const day = week[dayOfWeek];
                if (!day) return <div key={wi} className="h-[11px] w-[11px]" />;
                const level = getLevel(day.count, max);
                return (
                  <div
                    key={wi}
                    className={`h-[11px] w-[11px] rounded-[2px] ${LEVELS[level]} transition-colors`}
                    title={`${day.date}: ${day.count} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
        <span>Less</span>
        {LEVELS.map((cls, i) => (
          <div key={i} className={`h-[11px] w-[11px] rounded-[2px] ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
