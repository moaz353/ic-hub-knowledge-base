import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses, createCourse, deleteCourse, type Course } from '@/services/courses';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, GraduationCap, CheckCircle2, PlayCircle, BookOpen, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'in_progress' | 'completed' | 'not_started';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [providerFilter, setProviderFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newHours, setNewHours] = useState('');

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    setLoading(true);
    try { setCourses(await fetchCourses()); } catch { /* ignore */ }
    setLoading(false);
  }

  const totalCourses = courses.length;
  const completedCount = courses.filter(c => c.status === 'completed').length;
  const inProgressCount = courses.filter(c => c.status === 'in_progress').length;

  const providers = [...new Set(courses.map(c => c.provider).filter(Boolean))];

  const filtered = courses.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (providerFilter && c.provider !== providerFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      await createCourse({ name: newName, description: newDesc, provider: newProvider, estimated_hours: parseFloat(newHours) || 0 });
      toast.success('Course created');
      setAddOpen(false);
      setNewName(''); setNewDesc(''); setNewProvider(''); setNewHours('');
      loadCourses();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await deleteCourse(id); toast.success('Deleted'); loadCourses(); }
    catch (e: any) { toast.error(e.message); }
  }

  function statusColor(status: string) {
    if (status === 'completed') return 'text-emerald-400 bg-emerald-400/10';
    if (status === 'in_progress') return 'text-amber-400 bg-amber-400/10';
    return 'text-muted-foreground bg-secondary';
  }

  function progressColor(progress: number) {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress > 0) return 'bg-amber-500';
    return 'bg-muted';
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><BookOpen size={20} className="text-primary" /></div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalCourses}</div>
              <div className="text-xs text-muted-foreground">Total Courses</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5"><CheckCircle2 size={20} className="text-emerald-400" /></div>
            <div>
              <div className="text-2xl font-bold text-foreground">{completedCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2.5"><PlayCircle size={20} className="text-amber-400" /></div>
            <div>
              <div className="text-2xl font-bold text-foreground">{inProgressCount}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(['all', 'in_progress', 'completed', 'not_started'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s === 'completed' ? 'Completed' : 'Not Started'}
            </button>
          ))}
        </div>

        {providers.length > 0 && (
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-foreground"
          >
            <option value="">All Providers</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {/* Course Cards */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <GraduationCap size={48} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No courses found. Add your first course to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(course => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group block rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">{course.name}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(course.status)}`}>
                      {course.status === 'completed' ? 'Completed' : course.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                  {course.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {course.provider && <span className="rounded-md bg-secondary px-2 py-1">{course.provider}</span>}
                    {course.estimated_hours > 0 && <span>{course.estimated_hours}h estimated</span>}
                    {course.last_activity && <span>Last: {new Date(course.last_activity).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{course.progress}%</div>
                    <div className="w-32">
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full transition-all duration-500 ${progressColor(course.progress)}`} style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(course.id, course.name); }}
                    className="rounded-md p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Course Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Course</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="Course name" value={newName} onChange={e => setNewName(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <textarea placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Provider" value={newProvider} onChange={e => setNewProvider(e.target.value)} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Est. hours" type="number" value={newHours} onChange={e => setNewHours(e.target.value)} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button onClick={handleAdd} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Create Course</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
