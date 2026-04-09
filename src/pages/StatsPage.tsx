import { useEffect, useState } from 'react';
import { readAllTopics } from '@/services/github';
import type { TopicData, ItemType } from '@/types/ichub';
import { capitalize, getAllItemTypes } from '@/types/ichub';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

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

function getStreak(): number {
  try {
    const state = JSON.parse(localStorage.getItem('ichub_daily_review') || 'null');
    return state?.streak || 0;
  } catch { return 0; }
}

function getWeeklyData(topics: TopicData[]) {
  const allItems = topics.flatMap(t => t.items);
  const weekMap: Record<string, number> = {};

  allItems.forEach(item => {
    if (!item.date) return;
    const d = new Date(item.date);
    // Get Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const key = monday.toISOString().slice(0, 10);
    weekMap[key] = (weekMap[key] || 0) + 1;
  });

  return Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // last 12 weeks
    .map(([week, count]) => ({
      week: `${new Date(week).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
      count,
    }));
}

function getTopicProgress(topics: TopicData[]) {
  // Use rating > 0 as a proxy for "reviewed/completed"
  return topics
    .filter(t => t.items.length > 0)
    .map(t => {
      const reviewed = t.items.filter(i => i.rating > 0).length;
      const pct = Math.round((reviewed / t.items.length) * 100);
      return { name: t.name, color: t.color, pct, reviewed, total: t.items.length };
    })
    .sort((a, b) => b.pct - a.pct);
}

export default function StatsPage() {
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readAllTopics().then(setTopics).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const allItems = topics.flatMap(t => t.items);
  const total = allItems.length;
  const dynamicTypes = getAllItemTypes();
  const typeCounts = dynamicTypes.reduce((acc, type) => {
    const c = allItems.filter(i => i.type === type).length;
    if (c > 0) acc.push({ name: capitalize(type), value: c, type });
    return acc;
  }, [] as { name: string; value: number; type: string }[]);
  typeCounts.sort((a, b) => b.value - a.value);

  const weeklyData = getWeeklyData(topics);
  const topicProgress = getTopicProgress(topics);
  const streak = getStreak();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Stats</h1>

      {/* Top row: total + streak */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Items</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{total}</div>
          <div className="mt-1 text-xs text-muted-foreground">{topics.length} topics</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Streak</div>
          <div className="mt-1 text-3xl font-bold text-foreground">
            🔥 {streak} <span className="text-lg font-normal text-muted-foreground">days</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Rated Items</div>
          <div className="mt-1 text-3xl font-bold text-foreground">
            {allItems.filter(i => i.rating > 0).length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {total > 0 ? Math.round((allItems.filter(i => i.rating > 0).length / total) * 100) : 0}% of total
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Donut chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items by Type</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={typeCounts}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {typeCounts.map((entry) => (
                  <Cell key={entry.type} fill={getColor(entry.type)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  color: 'hsl(var(--foreground))',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {typeCounts.map(e => (
              <div key={e.type} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getColor(e.type) }} />
                <span className="text-muted-foreground">{e.name}</span>
                <span className="font-medium text-foreground">{e.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly bar chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items Added per Week</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--foreground))',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No date data available</p>
          )}
        </div>
      </div>

      {/* Topic progress */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Review Completion by Topic</h2>
        <div className="space-y-3">
          {topicProgress.map(tp => (
            <div key={tp.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{tp.name}</span>
                <span className="text-muted-foreground">{tp.reviewed}/{tp.total} ({tp.pct}%)</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${tp.pct}%`, backgroundColor: tp.color }}
                />
              </div>
            </div>
          ))}
          {topicProgress.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No topics found</p>
          )}
        </div>
      </div>
    </div>
  );
}
