import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { readTopic, addItem, editItem, deleteItem, readAllTopics } from '@/services/github';
import type { TopicData, ICItem, ItemType } from '@/types/ichub';
import { ITEM_TYPES } from '@/types/ichub';
import ItemCard from '@/components/ichub/ItemCard';
import AddEditModal from '@/components/ichub/AddEditModal';
import { useAuth } from '@/components/ichub/AuthProvider';
import { toast } from 'sonner';
import { exportMarkdown, exportPDF } from '@/services/utils';

type SortKey = 'date' | 'alpha' | 'type' | 'rating';

export default function TopicPage() {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topic') || '';
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ItemType>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [tagFilter, setTagFilter] = useState('');
  const [showFavs, setShowFavs] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<{ item: ICItem; topic: TopicData }[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const { requireToken } = useAuth();

  useEffect(() => {
    if (!topicId) return;
    loadTopic();
    loadRelated();
  }, [topicId]);

  async function loadTopic() {
    setLoading(true);
    try {
      const { data } = await readTopic(topicId);
      setTopic(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelated() {
    try {
      const allTopics = await readAllTopics();
      const currentTopic = allTopics.find(t => t.id === topicId);
      if (!currentTopic) return;
      const currentTags = new Set(currentTopic.items.flatMap(i => i.tags.map(t => t.toLowerCase())));
      const related: { item: ICItem; topic: TopicData }[] = [];
      allTopics.forEach(t => {
        if (t.id === topicId) return;
        t.items.forEach(item => {
          if (item.tags.some(tag => currentTags.has(tag.toLowerCase()))) {
            related.push({ item, topic: t });
          }
        });
      });
      setRelatedItems(related.slice(0, 8));
    } catch { /* ignore */ }
  }

  const filteredItems = useMemo(() => {
    if (!topic) return [];
    let items = [...topic.items];

    if (activeTab !== 'all') items = items.filter(i => i.type === activeTab);
    if (tagFilter) items = items.filter(i => i.tags.some(t => t.toLowerCase() === tagFilter.toLowerCase()));
    if (showPinned) items = items.filter(i => i.pinned);

    items.sort((a, b) => {
      switch (sortBy) {
        case 'alpha': return a.title.localeCompare(b.title);
        case 'type': return a.type.localeCompare(b.type);
        case 'rating': return b.rating - a.rating;
        default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
    return items;
  }, [topic, activeTab, sortBy, tagFilter, showFavs, showPinned]);

  const tabCounts = useMemo(() => {
    if (!topic) return {};
    const counts: Record<string, number> = { all: topic.items.length };
    ITEM_TYPES.forEach(t => {
      const c = topic.items.filter(i => i.type === t).length;
      if (c > 0) counts[t] = c;
    });
    return counts;
  }, [topic]);

  const handleAddItem = async (formData: Omit<ICItem, 'id'> & { id?: string }) => {
    const token = await requireToken();
    if (!token) return;
    try {
      const newItem: ICItem = {
        ...formData,
        id: `${topicId}-${Date.now()}`,
      } as ICItem;
      const sha = await addItem(topicId, newItem, token);
      toast.success(`Committed to GitHub — ${sha}`);
      setAddOpen(false);
      loadTopic();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleEditItem = async (formData: Omit<ICItem, 'id'> & { id?: string }) => {
    const token = await requireToken();
    if (!token || !formData.id) return;
    try {
      const sha = await editItem(topicId, formData.id, formData, token);
      toast.success(`Committed to GitHub — ${sha}`);
      setEditingItem(null);
      loadTopic();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleDeleteItem = async (item: ICItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const token = await requireToken();
    if (!token) return;
    try {
      const sha = await deleteItem(topicId, item.id, token);
      toast.success(`Committed to GitHub — ${sha}`);
      loadTopic();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handlePinToggle = async (item: ICItem) => {
    const token = await requireToken();
    if (!token) return;
    try {
      const sha = await editItem(topicId, item.id, { pinned: !item.pinned }, token);
      toast.success(`Committed to GitHub — ${sha}`);
      loadTopic();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{error || 'Topic not found'}</p>
      </div>
    );
  }

  const color = topic.color;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="no-print mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>→</span>
        <span className="text-foreground">{topic.name}</span>
      </nav>

      {/* Topic header */}
      <div className="mb-6 rounded-lg border border-border bg-card p-5" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl" style={{ color }}>{topic.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-foreground">{topic.name}</h1>
            <div className="font-mono text-sm" style={{ color }}>{topic.fullName}</div>
          </div>
          <span className="ml-auto rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: `${color}20`, color }}>
            {topic.items.length} items
          </span>
        </div>
        {topic.description && <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>}

        {/* Export */}
        <div className="no-print mt-3 flex gap-2">
          <div className="relative">
            <button onClick={() => setExportOpen(!exportOpen)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary">
              Export ▾
            </button>
            {exportOpen && (
              <div className="absolute left-0 top-9 z-10 rounded-md border border-border bg-card py-1 shadow-lg">
                <button onClick={() => { exportMarkdown(topic); setExportOpen(false); }} className="w-full whitespace-nowrap px-4 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                  Export as Markdown
                </button>
                <button onClick={() => { exportPDF(); setExportOpen(false); }} className="w-full whitespace-nowrap px-4 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print mb-4 flex flex-wrap gap-1">
        {(['all', ...ITEM_TYPES] as const).map(tab => {
          const count = tabCounts[tab];
          if (tab !== 'all' && !count) return null;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab} {count !== undefined && <span className="ml-1 opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Sort & Filters */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground"
        >
          <option value="date">Date added</option>
          <option value="alpha">Alphabetical</option>
          <option value="type">Type</option>
          <option value="rating">Rating</option>
        </select>

        {tagFilter && (
          <button
            onClick={() => setTagFilter('')}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ backgroundColor: `${color}20`, color }}
          >
            {tagFilter} ✕
          </button>
        )}

        <button
          onClick={() => setShowPinned(!showPinned)}
          className={`rounded-md px-3 py-1.5 text-xs ${showPinned ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
        >
          ⊡ Pinned
        </button>

        <button
          onClick={() => setAddOpen(true)}
          className="ml-auto rounded-md px-4 py-1.5 text-xs font-medium text-primary-foreground"
          style={{ backgroundColor: color }}
        >
          + Add Item
        </button>
      </div>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-2 text-3xl text-muted-foreground">∅</div>
          <p className="text-sm text-muted-foreground">No items found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              topicColor={color}
              topicId={topicId}
              onEdit={(i) => setEditingItem(i)}
              onDelete={handleDeleteItem}
              onTagClick={setTagFilter}
              onPinToggle={handlePinToggle}
            />
          ))}
        </div>
      )}

      {/* Related items */}
      {relatedItems.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Related across topics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {relatedItems.map(({ item, topic: t }) => (
              <ItemCard key={item.id} item={item} topicColor={t.color} topicId={t.id} />
            ))}
          </div>
        </section>
      )}

      {/* Add Modal */}
      <AddEditModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddItem}
        topicId={topicId}
      />

      {/* Edit Modal */}
      {editingItem && (
        <AddEditModal
          open={true}
          onClose={() => setEditingItem(null)}
          onSubmit={handleEditItem}
          topicId={topicId}
          editItem={editingItem}
        />
      )}
    </div>
  );
}
