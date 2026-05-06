import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface AnimatedTab {
  value: string;
  label: ReactNode;
  count?: number;
  icon?: ReactNode;
}

interface Props {
  tabs: AnimatedTab[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

/**
 * Tabs with a sliding underline indicator.
 * Pure CSS transitions — no animation libs.
 */
export default function AnimatedTabs({ tabs, value, onChange, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[value];
    const c = containerRef.current;
    if (el && c) {
      const elRect = el.getBoundingClientRect();
      const cRect = c.getBoundingClientRect();
      setIndicator({ left: elRect.left - cRect.left, width: elRect.width });
    }
  }, [value, tabs.length]);

  // Recompute on resize
  useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[value];
      const c = containerRef.current;
      if (el && c) {
        const elRect = el.getBoundingClientRect();
        const cRect = c.getBoundingClientRect();
        setIndicator({ left: elRect.left - cRect.left, width: elRect.width });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [value]);

  return (
    <div ref={containerRef} className={`relative flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map(t => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={el => (tabRefs.current[t.value] = el)}
            onClick={() => onChange(t.value)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.icon}
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${active ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
      <span
        className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-primary"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}
