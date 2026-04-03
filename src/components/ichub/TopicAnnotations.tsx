import { useState } from 'react';
import {
  getTopicAnnotations, addTopicAnnotation, editTopicAnnotation, deleteTopicAnnotation,
  type Annotation
} from '@/services/annotations';

interface Props {
  topicId: string;
}

export default function TopicAnnotations({ topicId }: Props) {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => getTopicAnnotations(topicId));
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newText, setNewText] = useState('');

  const refresh = () => setAnnotations(getTopicAnnotations(topicId));

  const handleAdd = () => {
    if (!newText.trim()) return;
    addTopicAnnotation(topicId, newText.trim());
    setNewText('');
    refresh();
  };

  const handleEdit = (ann: Annotation) => {
    setEditingId(ann.id);
    setEditText(ann.text);
  };

  const handleSaveEdit = (annId: string) => {
    if (!editText.trim()) return;
    editTopicAnnotation(topicId, annId, editText.trim());
    setEditingId(null);
    refresh();
  };

  const handleDelete = (annId: string) => {
    deleteTopicAnnotation(topicId, annId);
    refresh();
  };

  const togglePanel = () => setPanelOpen(!panelOpen);

  return (
    <div className="mt-3">
      {/* Annotation chips row */}
      <div className="flex flex-wrap items-center gap-1">
        {annotations.map(ann => (
          <button
            key={ann.id}
            onClick={togglePanel}
            className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            title={ann.text}
          >
            ✎
          </button>
        ))}
        <button
          onClick={() => { setPanelOpen(true); }}
          className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          title="Add annotation"
        >
          + Note
        </button>
      </div>

      {/* Expanded panel */}
      {panelOpen && (
        <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic Annotations</span>
            <button onClick={() => setPanelOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {annotations.length === 0 && (
            <p className="mb-2 text-xs text-muted-foreground">No annotations yet.</p>
          )}

          <div className="flex flex-wrap gap-2">
            {annotations.map(ann => (
              <div key={ann.id} className="w-full rounded border border-border bg-card p-2 sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                {editingId === ann.id ? (
                  <div className="flex flex-col gap-1">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="w-full resize-none rounded border border-border bg-secondary p-1.5 text-xs text-foreground focus:outline-none"
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
            ))}
          </div>

          {/* Add new */}
          <div className="mt-2 flex gap-2">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Add a topic annotation..."
              className="flex-1 resize-none rounded border border-border bg-card p-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              rows={2}
            />
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="self-end rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
