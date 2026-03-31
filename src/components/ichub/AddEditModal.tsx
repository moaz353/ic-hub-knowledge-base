import { useState } from 'react';
import type { ICItem, ItemType } from '@/types/ichub';
import { ITEM_TYPES } from '@/types/ichub';

interface AddEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<ICItem, 'id'> & { id?: string }) => void;
  topicId: string;
  editItem?: ICItem | null;
}

export default function AddEditModal({ open, onClose, onSubmit, topicId, editItem }: AddEditModalProps) {
  const [form, setForm] = useState<{
    type: ItemType;
    title: string;
    description: string;
    file: string;
    thumbnail: string;
    tags: string;
    source: string;
    rating: number;
    annotation: string;
    favorite: boolean;
    pinned: boolean;
  }>(() => editItem ? {
    type: editItem.type,
    title: editItem.title,
    description: editItem.description,
    file: editItem.file,
    thumbnail: editItem.thumbnail,
    tags: editItem.tags.join(', '),
    source: editItem.source,
    rating: editItem.rating,
    annotation: editItem.annotation,
    favorite: editItem.favorite,
    pinned: editItem.pinned,
  } : {
    type: 'note',
    title: '',
    description: '',
    file: '',
    thumbnail: '',
    tags: '',
    source: '',
    rating: 0,
    annotation: '',
    favorite: false,
    pinned: false,
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.file.trim()) return;
    onSubmit({
      ...(editItem ? { id: editItem.id } : {}),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      file: form.file.trim(),
      thumbnail: form.thumbnail.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      source: form.source.trim(),
      date: editItem?.date || new Date().toISOString().split('T')[0],
      rating: form.rating,
      annotation: form.annotation.trim(),
      favorite: form.favorite,
      pinned: form.pinned,
    });
  };

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          {editItem ? 'Edit Item' : 'Add Item'}
        </h3>

        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Item title" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Short description" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">URL / File link *</label>
            <input value={form.file} onChange={e => set('file', e.target.value)} required className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="https://..." />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Thumbnail URL</label>
            <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Optional" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="STA, Timing, SDC" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Source / Origin</label>
            <input value={form.source} onChange={e => set('source', e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="e.g. ASIC" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => set('rating', form.rating === n ? 0 : n)} className="text-lg">
                  <span className={form.rating >= n ? 'text-yellow-400' : 'text-muted-foreground'}>★</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">My Notes / Annotation</label>
            <textarea value={form.annotation} onChange={e => set('annotation', e.target.value)} rows={2} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Personal notes..." />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.favorite} onChange={e => set('favorite', e.target.checked)} /> Favorite
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} /> Pinned
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">Cancel</button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {editItem ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
