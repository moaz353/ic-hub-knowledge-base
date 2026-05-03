import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import {
  fetchInstructors, createInstructor, INSTRUCTOR_COLORS, COLOR_CLASSES,
  type Instructor,
} from '@/services/instructors';
import InstructorAvatar from './InstructorAvatar';
import { toast } from 'sonner';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

export default function InstructorSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState<string>('violet');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchInstructors().then(setInstructors).catch(() => {}); }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setAdding(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = instructors.find(i => i.id === value) || null;

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const ins = await createInstructor({ name: newName.trim(), title: newTitle.trim(), color: newColor });
      setInstructors(list => [...list, ins].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(ins.id);
      setAdding(false);
      setNewName(''); setNewTitle(''); setNewColor('violet');
      setOpen(false);
      toast.success('Instructor added');
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-left text-foreground hover:border-primary/40 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <InstructorAvatar instructor={selected} size="sm" />
            <span className="truncate">{selected.name}</span>
            {selected.title && <span className="truncate text-xs text-muted-foreground">· {selected.title}</span>}
          </div>
        ) : (
          <span className="text-muted-foreground">Select instructor…</span>
        )}
        <ChevronDown size={14} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {instructors.length === 0 && !adding && (
              <div className="px-3 py-3 text-xs text-muted-foreground">No instructors yet.</div>
            )}
            {instructors.map(ins => (
              <button
                key={ins.id}
                type="button"
                onClick={() => { onChange(ins.id); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
              >
                <InstructorAvatar instructor={ins} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-foreground">{ins.name}</div>
                  {ins.title && <div className="truncate text-[11px] text-muted-foreground">{ins.title}</div>}
                </div>
                {value === ins.id && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>

          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-xs font-medium text-primary hover:bg-secondary/50 transition-colors"
            >
              <Plus size={14} /> Add New Instructor
            </button>
          ) : (
            <div className="border-t border-border bg-secondary/30 p-3 space-y-2">
              <input
                autoFocus
                placeholder="Name *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                placeholder="e.g. Senior Design Engineer"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Avatar color</div>
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUCTOR_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all ${COLOR_CLASSES[c].bg} ${newColor === c ? 'ring-foreground scale-110' : 'ring-transparent'}`}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName(''); setNewTitle(''); }}
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={12} className="inline mr-1" /> Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !newName.trim()}
                  onClick={handleAdd}
                  className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Save Instructor
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
