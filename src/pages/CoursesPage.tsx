import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses, createCourse, updateCourse, deleteCourse, type Course } from '@/services/courses';
import { Search, Plus, GraduationCap, CheckCircle2, PlayCircle, BookOpen, Trash2, Pencil, X, Image as ImageIcon } from 'lucide-react';
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
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');

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

  function openAdd() {
    setEditCourse(null);
    setNewName(''); setNewDesc(''); setNewProvider(''); setNewHours(''); setNewThumbnail('');
    setAddOpen(true);
  }

  function openEdit(course: Course) {
    setEditCourse(course);
    setNewName(course.name);
    setNewDesc(course.description);
    setNewProvider(course.provider);
    setNewHours(course.estimated_hours > 0 ? String(course.estimated_hours) : '');
    setNewThumbnail(course.thumbnail || '');
    setAddOpen(true);
  }

  async function handleSave() {
    if (!newName.trim()) return;
    try {
      const payload = { name: newName, description: newDesc, provider: newProvider, estimated_hours: parseFloat(newHours) || 0, thumbnail: newThumbnail };
      if (editCourse) {
        await updateCourse(editCourse.id, payload as any);
        toast.success('Course updated');
      } else {
        await createCourse(payload as any);
        toast.success('Course created');
      }
      setAddOpen(false);
      setEditCourse(null);
      setNewName(''); setNewDesc(''); setNewProvider(''); setNewHours(''); setNewThumbnail('');
      loadCourses();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await deleteCourse(id); toast.success('Deleted'); loadCourses(); }
    catch (e: any) { toast.error(e.message); }
  }

  function statusLabel(status: string) {
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    return 'Not Started';
  }

  function statusColor(status: string) {
    if (status === 'completed') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (status === 'in_progress') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-muted-foreground bg-secondary border-border';
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your learning progress</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3"><BookOpen size={22} className="text-primary" /></div>
            <div>
              <div className="text-3xl font-bold text-foreground">{totalCourses}</div>
              <div className="text-xs text-muted-foreground">Total Courses</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-500/10 p-3"><CheckCircle2 size={22} className="text-emerald-400" /></div>
            <div>
              <div className="text-3xl font-bold text-foreground">{completedCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-500/10 p-3"><PlayCircle size={22} className="text-amber-400" /></div>
            <div>
              <div className="text-3xl font-bold text-foreground">{inProgressCount}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {(['all', 'in_progress', 'completed', 'not_started'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {s === 'all' ? 'All' : statusLabel(s)}
            </button>
          ))}
        </div>
        {providers.length > 0 && (
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground"
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(course => (
            <div key={course.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              {/* Thumbnail */}
              <Link to={`/courses/${course.id}`} className="block">
                <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-secondary to-secondary/50">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <GraduationCap size={48} className="text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                  {/* Status badge */}
                  <span className={`absolute top-3 right-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${statusColor(course.status)}`}>
                    {statusLabel(course.status)}
                  </span>
                </div>
              </Link>

              {/* Content */}
              <div className="p-4">
                <Link to={`/courses/${course.id}`}>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">{course.name}</h3>
                </Link>
                {course.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>}
                
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  {course.provider && <span className="rounded-lg bg-secondary px-2 py-0.5">{course.provider}</span>}
                  {course.estimated_hours > 0 && <span>{course.estimated_hours}h</span>}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-sm font-bold text-foreground">{course.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all duration-500 ${progressColor(course.progress)}`} style={{ width: `${course.progress}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    {course.progress > 0 && course.progress < 100 ? 'Continue' : course.progress >= 100 ? 'Review' : 'Start'}
                  </Link>
                  <button
                    onClick={() => openEdit(course)}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, course.name)}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Course Dialog */}
      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setEditCourse(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCourse ? 'Edit Course' : 'Add Course'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="Course name *" value={newName} onChange={e => setNewName(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <textarea placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Provider" value={newProvider} onChange={e => setNewProvider(e.target.value)} className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input placeholder="Est. hours" type="number" value={newHours} onChange={e => setNewHours(e.target.value)} className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <ImageIcon size={12} /> Thumbnail URL
              </label>
              <input placeholder="https://example.com/image.jpg" value={newThumbnail} onChange={e => setNewThumbnail(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {newThumbnail && (
                <div className="mt-2 relative rounded-lg overflow-hidden h-24 bg-secondary">
                  <img src={newThumbnail} alt="Preview" className="h-full w-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
            <button onClick={handleSave} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              {editCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
