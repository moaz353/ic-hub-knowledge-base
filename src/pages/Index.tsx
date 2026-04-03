import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { readAllTopics, createTopic, editTopic as editTopicApi, deleteTopic as deleteTopicApi } from '@/services/github';
import type { TopicData, ICItem, ItemType } from '@/types/ichub';
import { TOPIC_ICONS, TOPIC_COLORS, TOPIC_FULLNAMES, TOPIC_DESCRIPTIONS, TYPE_SYMBOLS, getAllItemTypes, capitalize } from '@/types/ichub';
import ItemCard from '@/components/ichub/ItemCard';
import NewTopicModal from '@/components/ichub/NewTopicModal';
import { useAuth } from '@/components/ichub/AuthProvider';
import { toast } from 'sonner';

export default function HomePage() {
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicData | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { requireToken } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await readAllTopics();
      setTopics(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Stats
  const allItems = topics.flatMap(t => t.items);
  const typeCounts = ITEM_TYPES.reduce((acc, type) => {
    acc[type] = allItems.filter(i => i.type === type).length;
    return acc;
  }, {} as Record<ItemType, number>);

  // Pinned items
  const pinnedItems = topics.flatMap(t =>
    t.items.filter(i => i.pinned).map(i => ({ item: i, topicId: t.id, topicColor: t.color }))
  );

  // Recent items
  const recentItems = topics
    .flatMap(t => t.items.map(i => ({ item: i, topic: t })))
    .sort((a, b) => new Date(b.item.date).getTime() - new Date(a.item.date).getTime())
    .slice(0, 10);

  // Search results
  const searchResults = searchQuery
    ? topics.flatMap(t =>
        t.items
          .filter(i => {
            const q = searchQuery.toLowerCase();
            return i.title.toLowerCase().includes(q)
              || i.description.toLowerCase().includes(q)
              || i.tags.some(tag => tag.toLowerCase().includes(q))
              || i.source.toLowerCase().includes(q);
          })
          .map(i => ({ item: i, topic: t }))
      )
    : [];

  const handleNewTopic = async (topicData: { id: string; name: string; fullName: string; description: string; icon: string; color: string }) => {
    const token = await requireToken();
    if (!token) return;
    try {
      const newTopic: TopicData = {
        id: topicData.id,
        name: topicData.name,
        fullName: topicData.fullName,
        description: topicData.description,
        icon: topicData.icon,
        color: topicData.color,
        items: [],
      };
      const sha = await createTopic(newTopic, token);
      toast.success(`Topic created — ${sha}`);
      setNewTopicOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleEditTopic = async (topicData: { id: string; name: string; fullName: string; description: string; icon: string; color: string }) => {
    const token = await requireToken();
    if (!token) return;
    try {
      const sha = await editTopicApi(topicData.id, {
        name: topicData.name,
        fullName: topicData.fullName,
        description: topicData.description,
        icon: topicData.icon,
        color: topicData.color,
      }, token);
      toast.success(`Topic updated — ${sha}`);
      setEditingTopic(null);
      loadData();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleDeleteTopic = async (topic: TopicData) => {
    if (!confirm(`Delete topic "${topic.name}" and all its ${topic.items.length} items? This cannot be undone.`)) return;
    const token = await requireToken();
    if (!token) return;
    try {
      await deleteTopicApi(topic.id, token);
      toast.success(`Topic "${topic.name}" deleted`);
      loadData();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading knowledge base...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mb-4 text-4xl">⚠</div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Could not load data</h2>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <p className="text-xs text-muted-foreground">
          Make sure <code className="font-mono text-primary">src/config.ts</code> has your GitHub username and repo name, and that <code className="font-mono text-primary">data/index.json</code> exists in the repo.
        </p>
      </div>
    );
  }

  // Search view
  if (searchQuery) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Search results for "{searchQuery}" <span className="text-muted-foreground">({searchResults.length})</span>
        </h2>
        {searchResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map(({ item, topic }) => (
              <ItemCard key={item.id} item={item} topicColor={topic.color} topicId={topic.id} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Quick Stats */}
      <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-6">
          <div className="shrink-0">
            <span className="text-2xl font-bold text-foreground">{allItems.length}</span>
            <span className="ml-2 text-sm text-muted-foreground">Total Items</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {ITEM_TYPES.map(type => typeCounts[type] > 0 && (
              <div key={type} className="flex shrink-0 items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">{TYPE_SYMBOLS[type]}</span>
                <span className="text-foreground">{typeCounts[type]}</span>
                <span className="capitalize text-muted-foreground">{type}s</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <span>⊡</span> Pinned
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {pinnedItems.map(({ item, topicId, topicColor }) => (
              <div key={item.id} className="w-64 shrink-0">
                <ItemCard item={item} topicColor={topicColor} topicId={topicId} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {recentItems.map(({ item, topic }) => (
              <Link
                key={item.id}
                to={`/topic?topic=${topic.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary"
              >
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
                >
                  {topic.name}
                </span>
                <span className="flex-1 truncate text-sm text-foreground">{item.title}</span>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{item.type}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.date}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Topic Cards Grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Topics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topics.map(topic => {
            const color = topic.color || TOPIC_COLORS[topic.id] || '#58a6ff';
            const icon = topic.icon || TOPIC_ICONS[topic.id] || '◈';
            const fullName = topic.fullName || TOPIC_FULLNAMES[topic.id] || '';
            const desc = topic.description || TOPIC_DESCRIPTIONS[topic.id] || '';
            const lastDate = topic.items.length
              ? topic.items.reduce((latest, i) => i.date > latest ? i.date : latest, '')
              : '';

            return (
              <div
                key={topic.id}
                className="card-hover group relative overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="h-1" style={{ backgroundColor: color }} />
                <Link to={`/topic?topic=${topic.id}`} className="block p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl" style={{ color }}>{icon}</span>
                    <span className="font-semibold text-foreground">{topic.name}</span>
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {topic.items.length}
                    </span>
                  </div>
                  {fullName && (
                    <div className="mb-1 font-mono text-xs" style={{ color }}>{fullName}</div>
                  )}
                  {desc && (
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  )}
                  {lastDate && (
                    <p className="mt-2 text-xs text-muted-foreground">Updated: {lastDate}</p>
                  )}
                </Link>
                {/* Topic management buttons */}
                <div className="absolute right-2 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.preventDefault(); setEditingTopic(topic); }}
                    className="rounded p-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                    title="Edit topic"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDeleteTopic(topic); }}
                    className="rounded p-1 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive"
                    title="Delete topic"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {/* New Topic card */}
          <button
            onClick={() => setNewTopicOpen(true)}
            className="card-hover flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-8 text-muted-foreground hover:border-primary hover:text-primary"
          >
            <span className="text-2xl">+</span>
            <span className="text-sm font-medium">New Topic</span>
          </button>
        </div>
      </section>

      {/* New Topic Modal */}
      <NewTopicModal
        open={newTopicOpen}
        onClose={() => setNewTopicOpen(false)}
        onSubmit={handleNewTopic}
      />

      {/* Edit Topic Modal */}
      <NewTopicModal
        open={!!editingTopic}
        onClose={() => setEditingTopic(null)}
        onSubmit={handleEditTopic}
        editTopic={editingTopic ? {
          id: editingTopic.id,
          name: editingTopic.name,
          fullName: editingTopic.fullName,
          description: editingTopic.description,
          icon: editingTopic.icon,
          color: editingTopic.color,
        } : null}
      />
    </div>
  );
}
