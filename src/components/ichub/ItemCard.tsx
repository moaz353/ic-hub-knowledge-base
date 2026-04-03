import type { ICItem, ItemType } from '@/types/ichub';
import { TYPE_SYMBOLS, capitalize } from '@/types/ichub';
import {
  getProgress, setProgress, setLastOpened, getLastOpened,
  isFavorite, toggleFavorite, addToQueue, removeFromQueue, isInQueue, timeAgo
} from '@/services/utils';
import { useState, useRef, useEffect } from 'react';
import ItemAnnotations from './ItemAnnotations';

interface ItemCardProps {
  item: ICItem;
  topicColor: string;
  topicId: string;
  onEdit?: (item: ICItem) => void;
  onDelete?: (item: ICItem) => void;
  onTagClick?: (tag: string) => void;
  onPinToggle?: (item: ICItem) => void;
}

export default function ItemCard({
  item, topicColor, topicId, onEdit, onDelete, onTagClick, onPinToggle
}: ItemCardProps) {
  const [fav, setFav] = useState(isFavorite(item.id));
  const [queued, setQueued] = useState(isInQueue(item.id));
  const [progress, setProgressState] = useState(getProgress(item.id));
  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [progressInput, setProgressInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastOpened = getLastOpened(item.id);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setLastOpened(item.id);
    window.open(item.file, '_blank');
  };

  const handleFav = () => {
    const newState = toggleFavorite(item.id);
    setFav(newState);
  };

  const handleQueue = () => {
    if (queued) {
      removeFromQueue(item.id);
    } else {
      addToQueue(item, topicId);
    }
    setQueued(!queued);
    setMenuOpen(false);
  };

  const handleProgressUpdate = (val: number) => {
    setProgress(item.id, val);
    setProgressState(val);
    setProgressInput(false);
    setMenuOpen(false);
  };

  return (
    <div className="card-hover group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Thumbnail / placeholder */}
      <div
        className="flex h-28 items-center justify-center text-4xl"
        style={{ backgroundColor: `${topicColor}15` }}
      >
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <span style={{ color: topicColor }}>{TYPE_SYMBOLS[item.type as ItemType] || '◈'}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</h3>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-44 rounded-md border border-border bg-card py-1 shadow-lg">
                {onEdit && (
                  <button onClick={() => { onEdit(item); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { onDelete(item); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-secondary">
                    Delete
                  </button>
                )}
                <button onClick={handleQueue} className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                  {queued ? 'Remove from Watch Later' : 'Add to Watch Later'}
                </button>
                <button onClick={handleFav} className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                  {fav ? 'Unfavorite' : 'Favorite'}
                </button>
                {onPinToggle && (
                  <button onClick={() => { onPinToggle(item); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                    {item.pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                <button onClick={() => { setProgressInput(true); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                  Update Progress
                </button>
                <button onClick={() => { navigator.clipboard.writeText(item.file); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary">
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}

        {/* Type badge */}
        <span
          className="inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${topicColor}20`, color: topicColor }}
        >
          {capitalize(item.type)}
        </span>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {tag}
              </button>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Rating */}
        {item.rating > 0 && (
          <div className="text-xs" style={{ color: topicColor }}>
            {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
          </div>
        )}

        {/* Annotation badge */}
        {item.annotation && (
          <button
            onClick={() => setNoteOpen(!noteOpen)}
            className="inline-flex w-fit items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            ✎ Note
          </button>
        )}
        {noteOpen && item.annotation && (
          <div className="rounded border border-border bg-secondary p-2 text-xs text-muted-foreground">
            {item.annotation}
          </div>
        )}

        {/* Last opened */}
        {lastOpened && (
          <span className="text-xs text-muted-foreground">
            Last opened: {timeAgo(lastOpened)}
          </span>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            onClick={handleOpen}
            className="flex-1 rounded-md py-1.5 text-center text-xs font-medium text-primary-foreground transition-colors"
            style={{ backgroundColor: topicColor }}
          >
            Open
          </button>
          <button
            onClick={handleFav}
            className={`rounded-md border px-2 py-1.5 text-sm transition-colors ${
              fav ? 'border-yellow-500/30 text-yellow-400' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {fav ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="border-t border-border px-3 py-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: topicColor }} />
          </div>
        </div>
      )}

      {/* Progress input modal */}
      {progressInput && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/95">
          <div className="flex flex-col items-center gap-3 p-4">
            <span className="text-sm font-medium text-foreground">Update Progress</span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgressState(parseInt(e.target.value))}
              className="w-40"
            />
            <span className="text-xs text-muted-foreground">{progress}%</span>
            <div className="flex gap-2">
              <button onClick={() => setProgressInput(false)} className="rounded border border-border px-3 py-1 text-xs text-muted-foreground">Cancel</button>
              <button onClick={() => handleProgressUpdate(progress)} className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
