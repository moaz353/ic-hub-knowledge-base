import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readAllTopics } from '@/services/github';
import type { TopicData } from '@/types/ichub';

interface TagInfo {
  tag: string;
  count: number;
  topics: { id: string; name: string; color: string }[];
  items: { id: string; title: string; topicId: string; topicColor: string; type: string }[];
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    try {
      const topics = await readAllTopics();
      const tagMap = new Map<string, TagInfo>();
      topics.forEach(t => {
        t.items.forEach(item => {
          item.tags.forEach(tag => {
            const key = tag.toLowerCase();
            if (!tagMap.has(key)) {
              tagMap.set(key, { tag, count: 0, topics: [], items: [] });
            }
            const info = tagMap.get(key)!;
            info.count++;
            if (!info.topics.some(tp => tp.id === t.id)) {
              info.topics.push({ id: t.id, name: t.name, color: t.color });
            }
            info.items.push({ id: item.id, title: item.title, topicId: t.id, topicColor: t.color, type: item.type });
          });
        });
      });
      setTags(Array.from(tagMap.values()).sort((a, b) => b.count - a.count));
    } catch { /* ignore */ }
    setLoading(false);
  }

  const maxCount = tags.length ? Math.max(...tags.map(t => t.count)) : 1;
  const selectedTagInfo = selectedTag ? tags.find(t => t.tag.toLowerCase() === selectedTag.toLowerCase()) : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>→</span>
        <span className="text-foreground">Tags</span>
      </nav>

      <h1 className="mb-6 text-xl font-bold text-foreground">All Tags</h1>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags found. Add items with tags to see them here.</p>
      ) : (
        <>
          {/* Tag cloud */}
          <div className="mb-8 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-6">
            {tags.map(t => {
              const size = 0.75 + (t.count / maxCount) * 1;
              const isActive = selectedTag.toLowerCase() === t.tag.toLowerCase();
              return (
                <button
                  key={t.tag}
                  onClick={() => setSelectedTag(isActive ? '' : t.tag)}
                  className={`rounded-md border px-3 py-1 transition-colors ${
                    isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                  }`}
                  style={{ fontSize: `${size}rem` }}
                >
                  {t.tag} <span className="ml-1 text-xs opacity-60">{t.count}</span>
                </button>
              );
            })}
          </div>

          {/* Selected tag results */}
          {selectedTagInfo && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                Items tagged "{selectedTagInfo.tag}" <span className="text-muted-foreground">({selectedTagInfo.count})</span>
              </h2>
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {selectedTagInfo.items.map((item, i) => (
                  <Link
                    key={`${item.id}-${i}`}
                    to={`/topic?topic=${item.topicId}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary"
                  >
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${item.topicColor}20`, color: item.topicColor }}>
                      {item.topicId}
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">{item.title}</span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{item.type}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
