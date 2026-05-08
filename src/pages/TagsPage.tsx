import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { readAllTopics } from '@/services/github';
import { Search, ArrowUpAZ, TrendingUp, Hash, X, ArrowLeft } from 'lucide-react';
import type { ICItem } from '@/types/ichub';
import ItemCard from '@/components/ichub/ItemCard';

interface TagItem {
  item: ICItem;
  topicId: string;
  topicName: string;
  topicColor: string;
}

interface TagInfo {
  tag: string;
  count: number;
  topics: { id: string; name: string; color: string }[];
  items: TagItem[];
}

type SortMode = 'count' | 'az';

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedItem, setSelectedItem] = useState<TagItem | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('count');

  useEffect(() => { loadTags(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedItem) setSelectedItem(null);
        else setSelectedTag('');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedItem]);

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
            info.items.push({ item, topicId: t.id, topicName: t.name, topicColor: t.color });
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

  function closePanel() {
    setSelectedTag('');
    setSelectedItem(null);
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
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredTags.map(t => {
            const hue = tagHue(t.tag);
            const isActive = selectedTag.toLowerCase() === t.tag.toLowerCase();
            const intensity = Math.min(1, t.count / maxCount);
            return (
              <button
                key={t.tag}
                onClick={() => { setSelectedItem(null); setSelectedTag(isActive ? '' : t.tag); }}
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
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${selectedTagInfo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closePanel}
        aria-hidden={!selectedTagInfo}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <aside
          onClick={e => e.stopPropagation()}
          className={`absolute right-0 top-0 h-full w-full sm:w-[460px] bg-[#1a1b2e] border-l border-white/[0.08] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${selectedTagInfo ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {selectedTagInfo && (
            <>
              <div className="flex items-start justify-between gap-3 p-6 border-b border-white/[0.06]">
                <div className="min-w-0 flex items-center gap-2">
                  {selectedItem && (
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                      aria-label="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: `hsl(${tagHue(selectedTagInfo.tag)}, 60%, 55%)` }}
                      />
                      <h2 className="truncate text-xl font-bold text-foreground">
                        {selectedItem ? selectedItem.item.title : selectedTagInfo.tag}
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedItem
                        ? `in ${selectedItem.topicName}`
                        : `${selectedTagInfo.count} item${selectedTagInfo.count !== 1 ? 's' : ''} · ${selectedTagInfo.topics.length} topic${selectedTagInfo.topics.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sliding container: list <-> detail */}
              <div className="flex-1 overflow-hidden relative">
                {/* Items list */}
                <div
                  className={`absolute inset-0 overflow-y-auto p-4 space-y-4 transition-all duration-300 ease-out ${selectedItem ? '-translate-x-4 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
                >
                  {selectedTagInfo.topics.map(topic => {
                    const topicItems = selectedTagInfo.items.filter(ti => ti.topicId === topic.id);
                    return (
                      <div key={topic.id}>
                        <div className="mb-2 flex items-center gap-2 px-1">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: topic.color }} />
                          <span className="text-sm font-medium text-foreground">{topic.name}</span>
                          <span className="text-xs text-muted-foreground">({topicItems.length})</span>
                        </div>
                        <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] bg-[#1a1b2e] overflow-hidden">
                          {topicItems.map((ti, i) => (
                            <button
                              key={`${ti.item.id}-${i}`}
                              onClick={() => setSelectedItem(ti)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                            >
                              <span className="flex-1 truncate text-sm text-foreground">{ti.item.title}</span>
                              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground capitalize">{ti.item.type}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Item detail */}
                <div
                  className={`absolute inset-0 overflow-y-auto p-4 transition-all duration-300 ease-out ${selectedItem ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'}`}
                >
                  {selectedItem && (
                    <div className="space-y-3 animate-fade-in">
                      <ItemCard
                        item={selectedItem.item}
                        topicColor={selectedItem.topicColor}
                        topicId={selectedItem.topicId}
                      />
                      <Link
                        to={`/topic?topic=${selectedItem.topicId}`}
                        onClick={closePanel}
                        className="block w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                      >
                        Go to {selectedItem.topicName} topic page →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
