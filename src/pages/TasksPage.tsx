import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, ListTodo, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchTasks, createTask, updateTask, deleteTask, type Task, type TaskCadence, type TaskStatus } from '@/services/tasks';
import { fetchCourses, type Course } from '@/services/courses';
import { toast } from 'sonner';

type Filter = 'all' | 'daily' | 'weekly' | 'course';

function dayDiff(dateStr: string | null) {
  if (!dateStr) return Infinity;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function dueBadge(dateStr: string | null) {
  const diff = dayDiff(dateStr);
  if (!dateStr) return null;
  let cls = 'border-border bg-secondary text-muted-foreground';
  let label = new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diff < 0) { cls = 'border-rose-500/40 bg-rose-500/10 text-rose-400'; label = `Overdue · ${label}`; }
  else if (diff === 0) { cls = 'border-amber-500/40 bg-amber-500/10 text-amber-400'; label = `Today`; }
  else if (diff === 1) { cls = 'border-amber-500/30 bg-amber-500/5 text-amber-300'; label = `Tomorrow`; }
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>{label}</span>;
}

function groupKey(t: Task): string {
  const diff = dayDiff(t.due_date);
  if (!t.due_date) return 'No date';
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return 'This week';
  return 'Later';
}
const GROUP_ORDER = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'No date'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([fetchTasks(), fetchCourses()]);
      setTasks(t);
      setCourses(c);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }

  const filteredTasks = useMemo(() => {
    if (filter === 'daily') return tasks.filter(t => t.cadence === 'daily');
    if (filter === 'weekly') return tasks.filter(t => t.cadence === 'weekly');
    if (filter === 'course') return tasks.filter(t => t.course_id);
    return tasks;
  }, [tasks, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach(t => {
      const k = groupKey(t);
      (map[k] ||= []).push(t);
    });
    return map;
  }, [filteredTasks]);

  async function toggleDone(t: Task) {
    const next: TaskStatus = t.status === 'done' ? 'todo' : 'done';
    const nextProgress = next === 'done' ? 100 : 0;
    try {
      await updateTask(t.id, { status: next, progress: nextProgress });
      setTasks(ts => ts.map(x => x.id === t.id ? { ...x, status: next, progress: nextProgress } : x));
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleSave(id: string | null, data: Partial<Task>) {
    try {
      if (id) {
        await updateTask(id, data);
        setTasks(ts => ts.map(t => t.id === id ? { ...t, ...data } as Task : t));
      } else {
        const created = await createTask(data);
        setTasks(ts => [created, ...ts]);
      }
      setEditing(null); setCreating(false);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'course', label: 'By Course' },
  ];

  const courseName = (id: string | null) => courses.find(c => c.id === id)?.name || null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ListTodo className="text-primary" size={24} /> Tasks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay on top of what matters today.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
              filter === f.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <ListTodo className="mx-auto mb-3 text-muted-foreground/40" size={48} />
          <p className="text-sm text-muted-foreground">All caught up — no tasks here.</p>
          <button onClick={() => setCreating(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary transition-colors">
            <Plus size={12} /> Add your first task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter(g => grouped[g]?.length).map(group => (
            <section key={group}>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</h3>
                <span className="text-[11px] text-muted-foreground/60">({grouped[group].length})</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {grouped[group].map(t => {
                  const isDone = t.status === 'done';
                  const isInProg = t.status === 'in_progress';
                  return (
                    <div
                      key={t.id}
                      className={`group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-sm ${
                        isInProg ? 'border-l-[3px] border-l-primary border-border' : 'border-border'
                      } ${isDone ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => toggleDone(t)}
                        className={`shrink-0 rounded-full transition-all ${isDone ? 'text-emerald-500' : 'text-muted-foreground hover:text-primary'}`}
                        aria-label="Toggle complete"
                      >
                        {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className={`flex items-center gap-2 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                          <span className="truncate text-sm">{t.name}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {courseName(t.course_id) && (
                            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {courseName(t.course_id)}
                            </span>
                          )}
                          {t.context_label && !t.course_id && (
                            <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {t.context_label}
                            </span>
                          )}
                          {t.cadence !== 'once' && (
                            <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                              {t.cadence}
                            </span>
                          )}
                          {dueBadge(t.due_date)}
                          {isInProg && (
                            <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                              In progress
                            </span>
                          )}
                        </div>
                        {t.progress > 0 && t.progress < 100 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                              <div className="h-full bg-primary transition-all" style={{ width: `${t.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{t.progress}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditing(t)} className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <TaskEditorModal
          task={editing}
          courses={courses}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface EditorProps {
  task: Task | null;
  courses: Course[];
  open: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: Partial<Task>) => void;
}

function TaskEditorModal({ task, courses, open, onClose, onSave }: EditorProps) {
  const [name, setName] = useState(task?.name || '');
  const [courseId, setCourseId] = useState<string>(task?.course_id || '');
  const [contextLabel, setContextLabel] = useState(task?.context_label || '');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [cadence, setCadence] = useState<TaskCadence>(task?.cadence || 'once');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [progress, setProgress] = useState<number>(task?.progress ?? 0);

  function submit() {
    if (!name.trim()) { toast.error('Name is required'); return; }
    onSave(task?.id || null, {
      name: name.trim(),
      course_id: courseId || null,
      context_label: contextLabel.trim(),
      due_date: dueDate || null,
      cadence,
      status,
      progress,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Task name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Course (optional)</label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">— None —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tag (optional)</label>
              <input
                value={contextLabel}
                onChange={e => setContextLabel(e.target.value)}
                placeholder="e.g. Personal"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Repeats</label>
              <select
                value={cadence}
                onChange={e => setCadence(e.target.value as TaskCadence)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="once">One-off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Progress: {progress}%</label>
              <input
                type="range" min={0} max={100} step={5}
                value={progress}
                onChange={e => setProgress(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={submit} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {task ? 'Save' : 'Add Task'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
