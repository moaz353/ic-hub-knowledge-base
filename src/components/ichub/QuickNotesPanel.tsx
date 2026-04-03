import { useState, useRef, useEffect } from 'react';
import type { TopicData } from '@/types/ichub';

interface QuickNote {
  id: string;
  text: string;
  topicId: string;
  createdAt: string;
}

function getRecentQuickNotes(): QuickNote[] {
  try {
    return JSON.parse(localStorage.getItem('ichub_quick_notes') || '[]');
  } catch { return []; }
}

function saveQuickNote(note: QuickNote): void {
  const notes = getRecentQuickNotes();
  notes.unshift(note);
  // Keep last 20
  localStorage.setItem('ichub_quick_notes', JSON.stringify(notes.slice(0, 20)));
}

interface Props {
  topics: TopicData[];
  onNoteCreated?: (topicId: string, title: string) => void;
}

export default function QuickNotesPanel({ topics, onNoteCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [topicId, setTopicId] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const [recentNotes, setRecentNotes] = useState(getRecentQuickNotes);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = () => {
    if (!text.trim()) return;
    const note: QuickNote = {
      id: `qn-${Date.now()}`,
      text: text.trim(),
      topicId: topicId || '_inbox',
      createdAt: new Date().toISOString(),
    };
    saveQuickNote(note);
    setRecentNotes(getRecentQuickNotes());

    if (topicId && onNoteCreated) {
      onNoteCreated(topicId, text.trim());
    }

    setText('');
  };

  return (
    <div className="fixed bottom-16 right-4 z-50" ref={panelRef}>
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Note</span>
            <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a quick note..."
            className="mb-2 w-full resize-none rounded-md border border-border bg-secondary p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            rows={3}
          />
          <select
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            className="mb-2 w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">Inbox (no topic)</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="w-full rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Save Note
          </button>

          {/* Recent quick notes */}
          {recentNotes.length > 0 && (
            <div className="mt-3 border-t border-border pt-2">
              <span className="text-xs text-muted-foreground">Recent</span>
              {recentNotes.slice(0, 2).map(n => (
                <div key={n.id} className="mt-1 rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">
                  <span className="line-clamp-1">{n.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        title="Quick Note"
      >
        ✎
      </button>
    </div>
  );
}
