import { useState } from 'react';
import {
  getItemAnnotations, addItemAnnotation, editItemAnnotation, deleteItemAnnotation,
  type Annotation
} from '@/services/annotations';

interface Props {
  itemId: string;
}

export default function ItemAnnotations({ itemId }: Props) {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => getItemAnnotations(itemId));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const refresh = () => setAnnotations(getItemAnnotations(itemId));

  const handleAdd = () => {
    if (!newText.trim()) return;
    addItemAnnotation(itemId, newText.trim());
    setNewText('');
    setAdding(false);
    refresh();
  };

  const handleEdit = (ann: Annotation) => {
    setEditingId(ann.id);
    setEditText(ann.text);
    setExpandedId(ann.id);
  };

  const handleSaveEdit = (annId: string) => {
    if (!editText.trim()) return;
    editItemAnnotation(itemId, annId, editText.trim());
    setEditingId(null);
    refresh();
  };

  const handleDelete = (annId: string) => {
    deleteItemAnnotation(itemId, annId);
    if (expandedId === annId) setExpandedId(null);
    refresh();
  };

  return (
    <div className="border-t border-border px-3 py-2">
      <div className="flex flex-wrap items-center gap-1">
        {annotations.map(ann => (
          <div key={ann.id}>
            <button
              onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
              className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              title={ann.text}
            >
              {ann.text.slice(0, 30)}{ann.text.length > 30 ? '…' : ''}
            </button>
          </div>
        ))}
        <button
          onClick={() => { setAdding(true); setExpandedId(null); }}
          className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          title="Add annotation"
        >
          +
        </button>
      </div>

      {/* Expanded annotation */}
      {expandedId && (() => {
        const ann = annotations.find(a => a.id === expandedId);
        if (!ann) return null;
        return (
          <div className="mt-2 rounded border border-border bg-secondary p-2">
            {editingId === ann.id ? (
              <div className="flex flex-col gap-1">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full resize-none rounded border border-border bg-card p-1.5 text-xs text-foreground focus:outline-none"
                  rows={2}
                />
                <div className="flex gap-1">
                  <button onClick={() => handleSaveEdit(ann.id)} className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-foreground">{ann.text}</p>
                <div className="mt-1 flex gap-1">
                  <button onClick={() => handleEdit(ann)} className="text-xs text-muted-foreground hover:text-foreground">✎</button>
                  <button onClick={() => handleDelete(ann.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Add new annotation */}
      {adding && (
        <div className="mt-2 flex flex-col gap-1">
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Add annotation..."
            className="w-full resize-none rounded border border-border bg-secondary p-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-1">
            <button onClick={handleAdd} disabled={!newText.trim()} className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground disabled:opacity-50">Save</button>
            <button onClick={() => { setAdding(false); setNewText(''); }} className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
