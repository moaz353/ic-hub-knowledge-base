import { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
  ChevronDown, FileText, Image as ImageIcon, Video, Code2, Link2,
  GripVertical, Trash2, ExternalLink, Maximize2, Download,
} from 'lucide-react';
import type { LessonResource, ResourceType } from '@/services/resources';
import CodeBlock from './CodeBlock';
import ResourceNotes from './ResourceNotes';

const TYPE_BADGE: Record<ResourceType, { label: string; cls: string; Icon: any }> = {
  code:  { label: 'Code',  cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30',         Icon: Code2 },
  image: { label: 'Image', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', Icon: ImageIcon },
  video: { label: 'Video', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30',  Icon: Video },
  link:  { label: 'Link',  cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',       Icon: Link2 },
  pdf:   { label: 'PDF',   cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',       Icon: FileText },
};

const LANG_LABEL: Record<string, string> = {
  verilog: 'Verilog .v',
  systemverilog: 'SystemVerilog .sv',
  tcl: 'Tcl .tcl',
  python: 'Python .py',
};

function getDomain(url: string | null) {
  if (!url) return '';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

interface Props {
  resource: LessonResource;
  onDelete: () => void;
  onFullscreenImage?: () => void;
}

export default function ResourceCard({ resource: r, onDelete, onFullscreenImage }: Props) {
  const [open, setOpen] = useState(false);
  const controls = useDragControls();
  const meta = TYPE_BADGE[r.type];
  const Icon = meta.Icon;
  const date = new Date(r.created_at).toLocaleDateString();

  // Collapsed-state right side (type-specific summary chip)
  const summary = (() => {
    if (r.type === 'code') return LANG_LABEL[r.language || ''] || r.language || '';
    if (r.type === 'video') {
      const d = getDomain(r.url);
      return d.includes('youtube') ? 'YouTube' : d.includes('vimeo') ? 'Vimeo' : (d || 'File');
    }
    if (r.type === 'link') return getDomain(r.url);
    if (r.type === 'pdf' && r.page_count) return `${r.page_count} pages`;
    return '';
  })();

  return (
    <Reorder.Item
      value={r}
      dragListener={false}
      dragControls={controls}
      className="group rounded-xl border border-white/[0.06] bg-[#1a1b2e] overflow-hidden transition-all"
    >
      {/* Collapsed header row (always visible) */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span
          onPointerDown={(e) => { e.stopPropagation(); controls.start(e); }}
          className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </span>

        {/* Thumbnail / icon */}
        {r.type === 'image' && r.url ? (
          <img src={r.url} alt={r.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
        ) : (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${meta.cls}`}>
            <Icon size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[18px] font-semibold leading-tight text-foreground">{r.name}</span>
            <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
              {meta.label}
            </span>
            {summary && (
              <span className="hidden sm:inline-flex shrink-0 items-center rounded-full bg-[#2a2d3e] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {summary}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted-foreground">
            {r.type !== 'link' && <span className="truncate">{r.type === 'code' ? r.name : (r.url ? r.url.split('/').pop() : '')}</span>}
            {r.description && (
              <>
                {r.type !== 'link' && <span className="opacity-40">·</span>}
                <span className="truncate">{r.description}</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span className="shrink-0">{date}</span>
          </div>
        </div>

        <span
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 size={13} />
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded content */}
      <div
        className="grid transition-all duration-[250ms] ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] px-4 py-4">
            {r.description && (
              <p className="mb-4 text-sm text-muted-foreground">{r.description}</p>
            )}

            {/* Type-specific full content */}
            {r.type === 'code' && (
              <CodeBlock code={r.code_content || ''} language={r.language || 'text'} fileName={r.name} />
            )}

            {r.type === 'image' && r.url && (
              <div className="relative">
                <img src={r.url} alt={r.name} className="max-h-[480px] w-full rounded-lg object-contain bg-black/40" />
                {onFullscreenImage && (
                  <button
                    onClick={onFullscreenImage}
                    className="absolute right-2 top-2 rounded-md bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                    aria-label="Fullscreen"
                  ><Maximize2 size={13} /></button>
                )}
              </div>
            )}

            {r.type === 'video' && r.url && <VideoEmbed url={r.url} />}

            {r.type === 'link' && r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                <ExternalLink size={14} /> Open {getDomain(r.url)}
              </a>
            )}

            {r.type === 'pdf' && r.url && (
              <div className="space-y-2">
                <iframe src={r.url} className="h-[60vh] w-full rounded-lg border border-border bg-secondary" title={r.name} />
                <a href={r.url} download className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:text-primary transition-colors">
                  <Download size={12} /> Download
                </a>
              </div>
            )}

            <ResourceNotes resourceId={r.id} />
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`https://www.youtube.com/embed/${ytId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <video controls className="aspect-video w-full rounded-lg bg-black" src={url} />;
}
