import { useEffect, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  FileText, Image as ImageIcon, Video, Code2, Link2, Plus,
  Download, Eye, Trash2, ExternalLink, Maximize2, Play, X, ChevronLeft, ChevronRight,
  GripVertical,
} from 'lucide-react';
import { fetchResources, deleteResource, updateResourceOrder, type LessonResource, type ResourceType } from '@/services/resources';
import AddResourceModal from './AddResourceModal';
import CodeBlock from './CodeBlock';
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

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ items: LessonResource[]; index: number } | null>(null);
  const [pdfPreview, setPdfPreview] = useState<LessonResource | null>(null);
  const [videoFs, setVideoFs] = useState<LessonResource | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchResources(lessonId)
      .then(r => { if (!cancelled) setResources(r); })
      .catch(() => { if (!cancelled) setResources([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lessonId]);

  // Lightbox keyboard nav
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
        <div className="space-y-7">
          {(Object.keys(grouped) as ResourceType[]).map(type => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <section key={type}>
                {/* Section divider */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{meta.label}</h4>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* === PDF === */}
                {type === 'pdf' && (
                  <div className="space-y-2">
                    {items.map(r => (
                      <div key={r.id} className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 hover:border-primary/30 transition-colors">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                          <FileText size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">{r.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : '—'}
                            {' · '}
                            {new Date(r.created_at).toLocaleDateString()}
                          </div>
                          {r.description && <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{r.description}</div>}
                        </div>
                        <button onClick={() => setPdfPreview(r)} className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-[11px] hover:border-primary/40 hover:text-primary transition-colors">
                          <Eye size={12} /> Preview
                        </button>
                        <a href={r.url || '#'} download className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-[11px] hover:border-primary/40 hover:text-primary transition-colors">
                          <Download size={12} /> Download
                        </a>
                        <button onClick={() => handleDelete(r)} className="rounded-md p-1.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* === IMAGE === */}
                {type === 'image' && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.map((r, i) => (
                      <div
                        key={r.id}
                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border bg-secondary"
                        onClick={() => setLightbox({ items, index: i })}
                      >
                        <img src={r.url || ''} alt={r.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-xs font-medium text-white truncate">{r.name}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLightbox({ items, index: i }); }}
                          className="absolute right-2 top-2 rounded-md bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                          aria-label="Expand"
                        >
                          <Maximize2 size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                          className="absolute left-2 top-2 rounded-md bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all"
                          aria-label="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* === VIDEO === */}
                {type === 'video' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map(r => (
                      <VideoCard key={r.id} r={r} onFullscreen={() => setVideoFs(r)} onDelete={() => handleDelete(r)} />
                    ))}
                  </div>
                )}

                {/* === CODE === */}
                {type === 'code' && (
                  <div className="space-y-5">
                    {items.map(r => (
                      <div key={r.id} className="group">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          {r.description && <p className="text-[11px] text-muted-foreground">{r.description}</p>}
                          <button onClick={() => handleDelete(r)} className="ml-auto rounded p-1 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <CodeBlock code={r.code_content || ''} language={r.language || 'text'} fileName={r.name} />
                      </div>
                    ))}
                  </div>
                )}

                {/* === LINK === */}
                {type === 'link' && (
                  <div className="space-y-1.5">
                    {items.map(r => (
                      <div key={r.id} className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2 hover:border-primary/30 transition-colors">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                        <span className="text-sm font-semibold text-foreground">{r.name}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{r.url}</span>
                        <a href={r.url || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Open in new tab">
                          <ExternalLink size={13} />
                        </a>
                        <button onClick={() => handleDelete(r)} className="rounded-md p-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <AddResourceModal
        open={addOpen}
        onOpenChange={setAddOpen}
        lessonId={lessonId}
        onAdded={(r) => setResources(rs => [...rs, r])}
      />

      {/* PDF preview modal */}
      <Dialog open={!!pdfPreview} onOpenChange={(o) => !o && setPdfPreview(null)}>
        <DialogContent className="h-[85vh] max-w-5xl p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-medium text-foreground truncate">{pdfPreview?.name}</span>
              <a href={pdfPreview?.url || '#'} download className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:text-primary transition-colors">
                <Download size={12} /> Download
              </a>
            </div>
            {pdfPreview?.url && (
              <iframe src={pdfPreview.url} className="h-full w-full flex-1 bg-secondary" title={pdfPreview.name} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
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

      {/* Video fullscreen */}
      <Dialog open={!!videoFs} onOpenChange={o => !o && setVideoFs(null)}>
        <DialogContent className="h-[85vh] max-w-5xl p-0">
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-4 py-2 text-sm font-medium text-foreground">{videoFs?.name}</div>
            <div className="flex-1 bg-black">
              {videoFs && <VideoPlayer url={videoFs.url || ''} fullscreen />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Video sub-components =====

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function VideoPlayer({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        className={fullscreen ? 'h-full w-full' : 'aspect-video w-full'}
        src={`https://www.youtube.com/embed/${ytId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <video
      controls
      className={fullscreen ? 'h-full w-full bg-black' : 'aspect-video w-full bg-black rounded-lg'}
      src={url}
    />
  );
}

function VideoCard({ r, onFullscreen, onDelete }: { r: LessonResource; onFullscreen: () => void; onDelete: () => void }) {
  const [playing, setPlaying] = useState(false);
  const ytId = r.url ? getYouTubeId(r.url) : null;
  const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video bg-black">
        {playing ? (
          <VideoPlayer url={r.url || ''} />
        ) : (
          <button onClick={() => setPlaying(true)} className="group/play absolute inset-0 flex items-center justify-center">
            {thumbnail ? (
              <img src={thumbnail} alt={r.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-secondary to-secondary/40" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/play:bg-black/50 transition-colors">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm group-hover/play:scale-110 transition-transform">
                <Play size={24} fill="currentColor" />
              </div>
            </div>
          </button>
        )}
        <button
          onClick={onFullscreen}
          className="absolute right-2 top-2 z-10 rounded-md bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
          aria-label="Fullscreen"
        >
          <Maximize2 size={13} />
        </button>
      </div>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{r.name}</div>
          {r.description && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.description}</div>}
        </div>
        <button onClick={onDelete} className="rounded p-1 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
