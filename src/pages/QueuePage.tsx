import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQueue, removeFromQueue } from '@/services/utils';
import { getProgress } from '@/services/utils';

interface QueueItem {
  id: string;
  topicId: string;
  title: string;
  type: string;
  file: string;
  addedAt: string;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    setQueue(getQueue().sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
  }, []);

  const handleRemove = (id: string) => {
    removeFromQueue(id);
    setQueue(q => q.filter(i => i.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>→</span>
        <span className="text-foreground">Watch Later</span>
      </nav>

      <h1 className="mb-6 text-xl font-bold text-foreground">Watch Later / Reading List</h1>

      {queue.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-2 text-3xl text-muted-foreground">∅</div>
          <p className="text-sm text-muted-foreground">Your watch later list is empty. Add items from any topic page.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {queue.map(item => {
            const progress = getProgress(item.id);
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/topic?topic=${item.topicId}`} className="flex flex-1 items-center gap-3 overflow-hidden">
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{item.topicId}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{item.type}</span>
                      <span>·</span>
                      <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                    </div>
                    {progress > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    )}
                  </div>
                </Link>
                <a href={item.file} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                  Open
                </a>
                <button onClick={() => handleRemove(item.id)} className="shrink-0 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
