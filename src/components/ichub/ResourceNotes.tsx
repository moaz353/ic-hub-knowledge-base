import { useEffect, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Plus, Star, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react';
import {
  fetchResourceNotes, addResourceNote, updateResourceNote, deleteResourceNote,
  type ResourceNote,
} from '@/services/resourceNotes';
import { toast } from 'sonner';

export default function ResourceNotes({ resourceId }: { resourceId: string }) {
  const [notes, setNotes] = useState<ResourceNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchResourceNotes(resourceId)
      .then(n => { if (!cancelled) setNotes(n); })
      .catch(() => { if (!cancelled) setNotes([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resourceId]);

  async function handleAdd() {
    try {
      const n = await addResourceNote(resourceId, notes.length);
      setNotes(prev => [...prev, n]);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteResourceNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleUpdate(id: string, updates: Partial<ResourceNote>) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    try { await updateResourceNote(id, updates); }
    catch (e: any) { toast.error(e.message); }
  }

  async function handleReorder(newOrder: ResourceNote[]) {
    setNotes(newOrder);
    try { await Promise.all(newOrder.map((n, i) => updateResourceNote(n.id, { sort_order: i }))); }
    catch { /* ignore */ }
  }

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Plus size={11} /> Add note
        </button>
      </div>

      {loading ? (
        <div className="text-[11px] text-muted-foreground">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
          No notes yet.
        </div>
      ) : (
        <Reorder.Group axis="y" values={notes} onReorder={handleReorder} className="space-y-2">
          {notes.map(n => (
            <NoteItem key={n.id} note={n} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function NoteItem({
  note, onUpdate, onDelete,
}: {
  note: ResourceNote;
  onUpdate: (id: string, u: Partial<ResourceNote>) => void;
  onDelete: (id: string) => void;
}) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  function save() {
    onUpdate(note.id, { title, body });
    setEditing(false);
  }
  function cancel() {
    setTitle(note.title); setBody(note.body); setEditing(false);
  }

  return (
    <Reorder.Item value={note} dragListener={false} dragControls={controls}>
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex items-start gap-2">
          <button
            onPointerDown={(e) => controls.start(e)}
            className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical size={13} />
          </button>
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="text-sm font-medium text-foreground">{note.title || 'Untitled'}</div>
            )}
            <div className="mt-1 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => onUpdate(note.id, { rating: note.rating === s ? 0 : s })}
                  className="text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star size={13} fill={s <= note.rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {editing ? (
              <>
                <button onClick={save} className="rounded p-1 text-emerald-400 hover:bg-emerald-400/10"><Check size={13} /></button>
                <button onClick={cancel} className="rounded p-1 text-muted-foreground hover:bg-secondary"><X size={13} /></button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground/60 hover:text-primary hover:bg-primary/10"><Pencil size={12} /></button>
            )}
            <button onClick={() => onDelete(note.id)} className="rounded p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"><Trash2 size={12} /></button>
          </div>
        </div>
        {editing ? (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Note body…"
            rows={3}
            className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : note.body ? (
          <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{note.body}</p>
        ) : null}
      </div>
    </Reorder.Item>
  );
}
