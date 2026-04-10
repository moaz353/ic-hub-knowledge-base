import { useState, useEffect, useRef, useCallback } from 'react';
import { getNote, saveNote } from '@/services/richNotes';
import { logActivity } from '@/services/activityLog';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  itemId: string;
}

export default function RichTextEditor({ itemId }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef('');

  useEffect(() => {
    setLoading(true);
    getNote(itemId).then(note => {
      const c = note?.content || '';
      setContent(c);
      initialRef.current = c;
    }).finally(() => setLoading(false));
  }, [itemId]);

  const doSave = useCallback(async (text: string) => {
    if (text === initialRef.current) return;
    setSaving(true);
    try {
      await saveNote(itemId, text);
      initialRef.current = text;
      setLastSaved(new Date());
      logActivity('note_saved', itemId);
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setSaving(false);
    }
  }, [itemId]);

  const handleChange = (val: string) => {
    setContent(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(val), 1500);
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (loading) {
    return <div className="h-20 animate-pulse rounded bg-secondary" />;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Notes (Markdown)</span>
        <span className="text-[10px] text-muted-foreground">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
        </span>
      </div>
      <Textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Write markdown notes for this item..."
        className="min-h-[100px] resize-y bg-secondary text-xs font-mono"
      />
    </div>
  );
}
