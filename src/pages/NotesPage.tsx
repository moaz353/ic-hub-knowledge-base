import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, StickyNote } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { fetchNotes, createNote, updateNote, deleteNote, type Note } from '@/services/notes';
import { toast } from 'sonner';

const COLORS: { id: string; bg: string; ring: string }[] = [
  { id: 'yellow', bg: 'bg-yellow-200/90 dark:bg-yellow-300/90', ring: 'ring-yellow-400' },
  { id: 'pink', bg: 'bg-pink-200/90 dark:bg-pink-300/90', ring: 'ring-pink-400' },
  { id: 'green', bg: 'bg-green-200/90 dark:bg-green-300/90', ring: 'ring-green-400' },
  { id: 'blue', bg: 'bg-blue-200/90 dark:bg-blue-300/90', ring: 'ring-blue-400' },
  { id: 'purple', bg: 'bg-purple-200/90 dark:bg-purple-300/90', ring: 'ring-purple-400' },
  { id: 'orange', bg: 'bg-orange-200/90 dark:bg-orange-300/90', ring: 'ring-orange-400' },
  { id: 'teal', bg: 'bg-teal-200/90 dark:bg-teal-300/90', ring: 'ring-teal-400' },
  { id: 'red', bg: 'bg-red-200/90 dark:bg-red-300/90', ring: 'ring-red-400' },
  { id: 'slate', bg: 'bg-slate-200/90 dark:bg-slate-300/90', ring: 'ring-slate-400' },
  { id: 'lime', bg: 'bg-lime-200/90 dark:bg-lime-300/90', ring: 'ring-lime-400' },
];

function colorClass(id: string) {
  return COLORS.find(c => c.id === id)?.bg || COLORS[0].bg;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setNotes(await fetchNotes());
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }

  async function handleSave(id: string | null, data: Partial<Note>) {
    try {
      if (id) {
        await updateNote(id, data);
        setNotes(ns => ns.map(n => n.id === id ? { ...n, ...data } as Note : n));
      } else {
        const created = await createNote(data);
        setNotes(ns => [created, ...ns]);
      }
      setEditing(null);
      setCreating(false);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteNote(id);
      setNotes(ns => ns.filter(n => n.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <StickyNote className="text-primary" size={24} /> Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Pin your thoughts to the board.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <StickyNote className="mx-auto mb-3 text-muted-foreground/40" size={48} />
          <p className="text-sm text-muted-foreground">No notes yet. Click "New Note" to start.</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {notes.map(n => (
            <div
              key={n.id}
              className={`group mb-4 break-inside-avoid cursor-pointer rounded-xl ${colorClass(n.color)} p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl hover:rotate-[-0.5deg]`}
              onClick={() => setEditing(n)}
              style={{ minHeight: '120px' }}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 flex-1">{n.title || 'Untitled'}</h3>
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(n); }}
                    className="rounded-md p-1 text-slate-700 hover:bg-black/10"
                    aria-label="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                    className="rounded-md p-1 text-slate-700 hover:bg-red-500/20 hover:text-red-700"
                    aria-label="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-5">{n.content}</p>
              <div className="mt-2 text-[10px] text-slate-600/80">{new Date(n.updated_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <NoteEditorModal
          note={editing}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface NoteEditorProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: Partial<Note>) => void;
}

function NoteEditorModal({ note, open, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || 'yellow');

  function applyFormat(prefix: string, suffix = prefix) {
    const ta = document.getElementById('note-content-ta') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const next = content.slice(0, start) + prefix + sel + suffix + content.slice(end);
    setContent(next);
    setTimeout(() => { ta.focus(); ta.selectionStart = start + prefix.length; ta.selectionEnd = end + prefix.length; }, 0);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`max-w-xl p-0 overflow-hidden border-0 ${colorClass(color)} animate-in zoom-in-95 fade-in duration-200`}>
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">{note ? 'Edit Note' : 'New Note'}</span>
          <button onClick={onClose} className="rounded-md p-1 text-slate-700 hover:bg-black/10">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title…"
            className="w-full bg-transparent text-lg font-bold text-slate-900 placeholder:text-slate-500/60 focus:outline-none"
            autoFocus
          />

          <div className="flex flex-wrap gap-1">
            <button onClick={() => applyFormat('**')} className="rounded border border-black/10 bg-white/30 px-2 py-0.5 text-xs font-bold text-slate-800 hover:bg-white/60">B</button>
            <button onClick={() => applyFormat('*')} className="rounded border border-black/10 bg-white/30 px-2 py-0.5 text-xs italic text-slate-800 hover:bg-white/60">I</button>
            <button onClick={() => applyFormat('\n- ', '')} className="rounded border border-black/10 bg-white/30 px-2 py-0.5 text-xs text-slate-800 hover:bg-white/60">• List</button>
          </div>

          <textarea
            id="note-content-ta"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your note…"
            rows={8}
            className="w-full resize-none bg-white/30 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-700">Color</div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`h-7 w-7 rounded-full ${c.bg} ring-offset-2 ring-offset-transparent transition-all ${color === c.id ? `ring-2 ${c.ring} scale-110` : 'hover:scale-110'}`}
                  aria-label={c.id}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-black/10 transition-colors">Close</button>
            <button
              onClick={() => onSave(note?.id || null, { title, content, color })}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
