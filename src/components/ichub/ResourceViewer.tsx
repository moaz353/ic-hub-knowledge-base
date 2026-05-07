import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import {
  FileText, Image as ImageIcon, Video, Code2, Link2, Plus,
  X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { fetchResources, deleteResource, updateResourceOrder, type LessonResource, type ResourceType } from '@/services/resources';
import AddResourceModal from './AddResourceModal';
import AnimatedTabs from './AnimatedTabs';
import ResourceCard from './ResourceCard';
import { toast } from 'sonner';

interface Props {
  lessonId: string;
}

const TYPE_META: Record<ResourceType, { label: string; icon: any; dot: string }> = {
  pdf: { label: 'PDFs', icon: FileText, dot: 'bg-rose-400' },
  image: { label: 'Images', icon: ImageIcon, dot: 'bg-emerald-400' },
  video: { label: 'Videos', icon: Video, dot: 'bg-amber-400' },
  code: { label: 'Code', icon: Code2, dot: 'bg-sky-400' },
  link: { label: 'Links', icon: Link2, dot: 'bg-violet-400' },
};

export default function ResourceViewer({ lessonId }: Props) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: LessonResource[]; index: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchResources(lessonId)
      .then(r => { if (!cancelled) setResources(r); })
      .catch(() => { if (!cancelled) setResources([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lessonId]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight') setLightbox(l => l && { ...l, index: (l.index + 1) % l.items.length });
      else if (e.key === 'ArrowLeft') setLightbox(l => l && { ...l, index: (l.index - 1 + l.items.length) % l.items.length });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  async function handleDelete(r: LessonResource) {
    if (!confirm(`Delete "${r.name}"?`)) return;
    try {
      await deleteResource(r.id, r.storage_path);
      setResources(rs => rs.filter(x => x.id !== r.id));
      toast.success('Resource deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const grouped: Record<ResourceType, LessonResource[]> = {
    pdf: [], image: [], video: [], code: [], link: [],
  };
  resources.forEach(r => grouped[r.type]?.push(r));

  async function reorderType(type: ResourceType, newOrder: LessonResource[]) {
    setResources(prev => {
      const others = prev.filter(r => r.type !== type);
      return [...others, ...newOrder.map((r, i) => ({ ...r, sort_order: i }))];
    });
    try {
      await Promise.all(newOrder.map((r, i) => updateResourceOrder(r.id, i)));
    } catch {
      const fresh = await fetchResources(lessonId);
      setResources(fresh);
    }
  }

  const TYPE_ORDER: ResourceType[] = ['code', 'link', 'image', 'video', 'pdf'];
  const availableTypes = TYPE_ORDER.filter(t => grouped[t].length > 0);
  const [activeTab, setActiveTab] = useState<ResourceType | null>(null);

  useEffect(() => {
    if (!activeTab && availableTypes.length > 0) setActiveTab(availableTypes[0]);
    if (activeTab && !availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0] || null);
    }
  }, [availableTypes.join(','), activeTab]);

  const items = activeTab ? grouped[activeTab] : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resources</h3>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} /> Add Resource
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">Loading resources…</div>
      ) : resources.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mb-2 text-3xl opacity-40">📚</div>
          <div className="text-sm text-muted-foreground">No resources yet. Click "+ Add Resource" to get started.</div>
        </div>
      ) : (
        <>
          <AnimatedTabs
            tabs={availableTypes.map(t => {
              const Ic = ({ pdf: FileText, image: ImageIcon, video: Video, code: Code2, link: Link2 } as any)[t];
              const label = ({ pdf: 'PDFs', image: 'Images', video: 'Videos', code: 'Code', link: 'Links' } as any)[t];
              return { value: t, label, count: grouped[t].length, icon: <Ic size={13} /> };
            })}
            value={activeTab || ''}
            onChange={(v) => setActiveTab(v as ResourceType)}
            className="mb-5"
          />

          <div key={activeTab} className="animate-fade-in">
            {activeTab && (
              <Reorder.Group
                axis="y"
                values={items}
                onReorder={(o) => reorderType(activeTab, o)}
                className="space-y-2"
              >
                {items.map((r, i) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onDelete={() => handleDelete(r)}
                    onFullscreenImage={r.type === 'image' ? () => setLightbox({ items: grouped.image, index: grouped.image.indexOf(r) }) : undefined}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
        </>
      )}

      <AddResourceModal
        open={addOpen}
        onOpenChange={setAddOpen}
        lessonId={lessonId}
        onAdded={(r) => setResources(rs => [...rs, r])}
      />

      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          {lightbox.items.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(l => l && { ...l, index: (l.index - 1 + l.items.length) % l.items.length }); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(l => l && { ...l, index: (l.index + 1) % l.items.length }); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <div className="max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.items[lightbox.index].url || ''}
              alt={lightbox.items[lightbox.index].name}
              className="max-h-[88vh] max-w-[88vw] object-contain"
            />
            <div className="mt-2 text-center text-sm text-white/90">{lightbox.items[lightbox.index].name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

