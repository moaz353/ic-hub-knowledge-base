import { useState } from 'react';
import type { ICItem, ItemType } from '@/types/ichub';
import { getAllItemTypes, addCustomItemType, capitalize } from '@/types/ichub';
import { fetchUrlMetadata } from '@/services/urlMetadata';

interface AddEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<ICItem, 'id'> & { id?: string }) => void;
  topicId: string;
  editItem?: ICItem | null;
}

export default function AddEditModal({ open, onClose, onSubmit, topicId, editItem }: AddEditModalProps) {
  const [availableTypes, setAvailableTypes] = useState<ItemType[]>(getAllItemTypes);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [fetching, setFetching] = useState(false);

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

  const handleAddNewType = () => {
    const name = newTypeName.trim();
    if (!name) return;
    const newType = addCustomItemType(name);
    setAvailableTypes(getAllItemTypes());
    set('type', newType);
    setNewTypeName('');
    setShowNewType(false);
  };

  const handleAutoFill = async () => {
    const url = form.file.trim();
    if (!url) return;
    setFetching(true);
    try {
      const meta = await fetchUrlMetadata(url);
      if (meta) {
        setForm(f => ({
          ...f,
          title: f.title || meta.title,
          description: f.description || meta.description,
          thumbnail: f.thumbnail || meta.thumbnail,
        }));
      }
    } catch (e) {
      console.error('Auto-fill failed:', e);
    } finally {
      setFetching(false);
    }
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
            <div className="flex gap-2">
              <select value={form.type} onChange={e => set('type', e.target.value)} className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {availableTypes.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowNewType(!showNewType)}
                className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                title="Add new type"
              >
                +
              </button>
            </div>
            {showNewType && (
              <div className="mt-2 flex gap-2">
                <input
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="New type name"
                  className="flex-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNewType())}
                />
                <button
                  type="button"
                  onClick={handleAddNewType}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            )}
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
            <div className="flex gap-2">
              <input
                value={form.file}
                onChange={e => set('file', e.target.value)}
                required
                className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="https://..."
                onBlur={() => {
                  if (form.file.trim() && !form.title && !editItem) {
                    handleAutoFill();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={!form.file.trim() || fetching}
                className="rounded-md border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50"
                title="Auto-fill from URL"
              >
                {fetching ? '⟳' : '⚡ Fill'}
              </button>
            </div>
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
