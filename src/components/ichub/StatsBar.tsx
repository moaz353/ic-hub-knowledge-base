import type { ItemType } from '@/types/ichub';
import { capitalize } from '@/types/ichub';

const TYPE_COLORS: Record<string, string> = {
  linkedin: '#378ADD',
  resource: '#1D9E75',
  note: '#7F77DD',
  slide: '#f59e0b',
  book: '#f78166',
  video: '#ff7b72',
  tool: '#79c0ff',
  project: '#e3b341',
  cheatsheet: '#d2a8ff',
};

function getColor(type: string): string {
  return TYPE_COLORS[type] || '#58a6ff';
}

interface Props {
  typeCounts: Record<ItemType, number>;
  total: number;
}

export default function StatsBar({ typeCounts, total }: Props) {
  const entries = Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (total === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-border bg-[hsl(var(--card))] p-4">
      <div className="flex items-center gap-4">
        {/* Total count */}
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-[22px] font-bold leading-none text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">total items</span>
        </div>
        <div className="h-8 w-px shrink-0 bg-border" />
        {/* Stacked bar */}
        <div className="min-w-0 flex-1">
          <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
            {entries.map(([type, count]) => (
              <div
                key={type}
                className="rounded-full transition-all duration-200"
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: getColor(type),
                  minWidth: 6,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="stats-legend mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([type, count]) => (
          <div
            key={type}
            className="stats-legend-item flex items-center gap-1.5 text-xs transition-all duration-200"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: getColor(type) }}
            />
            <span className="text-muted-foreground">{capitalize(type)}</span>
            <span className="font-medium text-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
