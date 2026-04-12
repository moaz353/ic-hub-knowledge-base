import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { readAllTopics } from '@/services/github';
import { Search, ArrowUpAZ, TrendingUp, Hash } from 'lucide-react';

interface TagInfo {
  tag: string;
  count: number;
  topics: { id: string; name: string; color: string }[];
  items: { id: string; title: string; topicId: string; topicColor: string; type: string }[];
}

type SortMode = 'count' | 'az';

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('count');

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
      setTags(Array.from(tagMap.values()));
    } catch { /* ignore */ }
    setLoading(false);
  }

  const filteredTags = useMemo(() => {
    let result = [...tags];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.tag.toLowerCase().includes(q));
    }
    if (sort === 'count') result.sort((a, b) => b.count - a.count);
    else result.sort((a, b) => a.tag.localeCompare(b.tag));
    return result;
  }, [tags, search, sort]);

  const selectedTagInfo = selectedTag ? tags.find(t => t.tag.toLowerCase() === selectedTag.toLowerCase()) : null;
  const maxCount = tags.length ? Math.max(...tags.map(t => t.count)) : 1;

  function tagHue(tag: string) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tags</h1>

      {/* Search & Sort Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setSort('count')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sort === 'count' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <TrendingUp size={14} /> Most Used
          </button>
          <button
            onClick={() => setSort('az')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sort === 'az' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ArrowUpAZ size={14} /> A-Z
          </button>
        </div>
      </div>

      {tags.length === 0 ? (
        <div className="py-20 text-center">
          <Hash size={48} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No tags found. Add items with tags to see them here.</p>
        </div>
      ) : (
        <>
          {/* Tag Pills Grid */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredTags.map(t => {
              const hue = tagHue(t.tag);
              const isActive = selectedTag.toLowerCase() === t.tag.toLowerCase();
              const intensity = Math.min(1, t.count / maxCount);
              return (
                <button
                  key={t.tag}
                  onClick={() => setSelectedTag(isActive ? '' : t.tag)}
                  className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5'
                  }`}
                >
                  <div
                    className="absolute inset-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.1]"
                    style={{ background: `linear-gradient(135deg, hsl(${hue}, 70%, 60%), transparent)` }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `hsl(${hue}, 60%, 55%)`, opacity: 0.4 + intensity * 0.6 }}
                      />
                      <span className={`font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{t.tag}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t.count} item{t.count !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-muted-foreground">{t.topics.length} topic{t.topics.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Tag Details - Show ALL items */}
          {selectedTagInfo && (
            <div className="animate-fade-in">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                Items tagged "{selectedTagInfo.tag}" <span className="text-muted-foreground">({selectedTagInfo.count})</span>
              </h2>

              {/* Group items by topic */}
              {selectedTagInfo.topics.map(topic => {
                const topicItems = selectedTagInfo.items.filter(item => item.topicId === topic.id);
                return (
                  <div key={topic.id} className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: topic.color }} />
                      <Link to={`/topic?topic=${topic.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {topic.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">({topicItems.length})</span>
                    </div>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                      {topicItems.map((item, i) => (
                        <Link
                          key={`${item.id}-${i}`}
                          to={`/topic?topic=${item.topicId}`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                        >
                          <span className="flex-1 truncate text-sm text-foreground">{item.title}</span>
                          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground capitalize">{item.type}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
