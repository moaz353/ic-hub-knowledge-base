import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchCourse, fetchLessons, fetchSessions, addLesson, updateLesson, deleteLesson,
  logSession, recalculateProgress,
  type Course, type CourseLesson, type CourseSession,
} from '@/services/courses';
import { uploadFile } from '@/services/fileUpload';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Check, Bookmark, Pin, Trash2, ExternalLink, Download, Play, Clock, FileUp, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMinutes, setSessionMinutes] = useState('');

  // Notes state
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);

  // Links state
  const [links, setLinks] = useState<{ url: string; title: string }[]>([]);

  // Files state
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

  // Dialogs
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [c, l, s] = await Promise.all([fetchCourse(id!), fetchLessons(id!), fetchSessions(id!)]);
      setCourse(c);
      setLessons(l);
      setSessions(s);
      const { data: noteData } = await supabase.from('rich_notes').select('*').eq('item_id', `course-${id}`).maybeSingle();
      if (noteData) setNotes(noteData.content);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // Save notes with debounce
  useEffect(() => {
    if (!id) return;
    setNotesSaved(false);
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('rich_notes').select('id').eq('item_id', `course-${id}`).maybeSingle();
      if (data) {
        await supabase.from('rich_notes').update({ content: notes } as any).eq('id', data.id);
      } else if (notes.trim()) {
        await supabase.from('rich_notes').insert({ item_id: `course-${id}`, content: notes } as any);
      }
      setNotesSaved(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, id]);

  async function handleAddLesson() {
    if (!newLessonTitle.trim() || !id) return;
    try {
      await addLesson(id, newLessonTitle.trim(), lessons.length);
      setNewLessonTitle('');
      setAddLessonOpen(false);
      const l = await fetchLessons(id);
      setLessons(l);
      toast.success('Lesson added');
    } catch (e: any) { toast.error(e.message); }
  }

  async function toggleLesson(lesson: CourseLesson) {
    if (!id) return;
    await updateLesson(lesson.id, { completed: !lesson.completed } as any);
    const progress = await recalculateProgress(id);
    const l = await fetchLessons(id);
    setLessons(l);
    setCourse(prev => prev ? { ...prev, progress, status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started' } : prev);
  }

  async function toggleBookmark(lesson: CourseLesson) {
    await updateLesson(lesson.id, { bookmarked: !lesson.bookmarked } as any);
    setLessons(l => l.map(le => le.id === lesson.id ? { ...le, bookmarked: !le.bookmarked } : le));
  }

  async function togglePin(lesson: CourseLesson) {
    await updateLesson(lesson.id, { pinned: !lesson.pinned } as any);
    setLessons(l => l.map(le => le.id === lesson.id ? { ...le, pinned: !le.pinned } : le));
  }

  async function removeLesson(lessonId: string) {
    if (!id) return;
    await deleteLesson(lessonId);
    const progress = await recalculateProgress(id);
    const l = await fetchLessons(id);
    setLessons(l);
    setCourse(prev => prev ? { ...prev, progress } : prev);
  }

  async function handleLogSession() {
    if (!id || !sessionMinutes) return;
    await logSession(id, parseInt(sessionMinutes));
    setSessionMinutes('');
    setSessions(await fetchSessions(id));
    toast.success('Session logged');
  }

  async function handleFileUpload() {
    if (!selectedFile || !id || !newFileName.trim()) return;
    try {
      const result = await uploadFile(selectedFile, `courses/${id}`);
      if (result) {
        setFiles(f => [...f, { name: newFileName.trim(), url: result.url }]);
        toast.success('File uploaded');
        setAddFileOpen(false);
        setNewFileName('');
        setSelectedFile(null);
      }
    } catch (err: any) { toast.error(err.message); }
  }

  function handleAddLink() {
    if (!newLinkUrl.trim() || !newLinkName.trim()) return;
    setLinks(l => [...l, { url: newLinkUrl.trim(), title: newLinkName.trim() }]);
    setNewLinkUrl('');
    setNewLinkName('');
    setAddLinkOpen(false);
    toast.success('Link added');
  }

  // Heatmap data
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => {
      map.set(s.session_date, (map.get(s.session_date) || 0) + s.duration_minutes);
    });
    return map;
  }, [sessions]);

  const heatmapWeeks = useMemo(() => {
    const weeks: { date: string; minutes: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 140);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    let currentWeek: { date: string; minutes: number }[] = [];
    const d = new Date(startDate);
    while (d <= today) {
      const key = d.toISOString().slice(0, 10);
      currentWeek.push({ date: key, minutes: heatmapData.get(key) || 0 });
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [heatmapData]);

  const maxMinutes = Math.max(1, ...Array.from(heatmapData.values()));

  function heatColor(minutes: number) {
    if (minutes === 0) return 'bg-secondary';
    const intensity = minutes / maxMinutes;
    if (intensity > 0.75) return 'bg-emerald-500';
    if (intensity > 0.5) return 'bg-emerald-500/70';
    if (intensity > 0.25) return 'bg-emerald-500/40';
    return 'bg-emerald-500/20';
  }

  const totalMinutes = sessions.reduce((s, se) => s + se.duration_minutes, 0);
  const completedLessons = lessons.filter(l => l.completed).length;
  const lastLesson = lessons.filter(l => !l.completed)[0];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Link to="/courses" className="mt-4 inline-block text-primary hover:underline">← Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <Link to="/courses" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">{course.name}</h1>
            {course.provider && <span className="text-sm text-muted-foreground">{course.provider}</span>}
            {course.description && <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-foreground">{course.progress}%</div>
            <div className="mt-1 w-40">
              <div className="h-3 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full transition-all duration-500 ${course.progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${course.progress}%` }} />
              </div>
            </div>
          </div>
        </div>
        {lastLesson && (
          <button
            onClick={() => toggleLesson(lastLesson)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Play size={16} /> Continue: {lastLesson.title}
          </button>
        )}
      </div>

      {/* Overview Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Lessons Done', value: `${completedLessons}/${lessons.length}` },
          { label: 'Time Spent', value: `${Math.round(totalMinutes / 60 * 10) / 10}h` },
          { label: 'Sessions', value: String(sessions.length) },
          { label: 'Est. Remaining', value: course.estimated_hours > 0 ? `${Math.max(0, course.estimated_hours - totalMinutes / 60).toFixed(1)}h` : '—' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/20">
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Study Activity</h2>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(day => (
                <div key={day.date} className={`h-3 w-3 rounded-sm ${heatColor(day.minutes)} transition-colors`} title={`${day.date}: ${day.minutes}min`} />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" placeholder="Minutes" value={sessionMinutes} onChange={e => setSessionMinutes(e.target.value)} className="w-24 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground" />
          <button onClick={handleLogSession} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors">
            <Clock size={14} className="inline mr-1" /> Log Session
          </button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="lessons">
        <TabsList className="mb-4 rounded-xl">
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <div className="rounded-2xl border border-border bg-card">
            {lessons.filter(l => l.pinned).length > 0 && (
              <div className="border-b border-border px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground">📌 Pinned</span>
              </div>
            )}
            <div className="divide-y divide-border">
              {[...lessons].sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                return a.sort_order - b.sort_order;
              }).map(lesson => (
                <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50">
                  <button onClick={() => toggleLesson(lesson)} className={`shrink-0 rounded-lg border p-1.5 transition-all ${lesson.completed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground hover:border-primary'}`}>
                    <Check size={14} />
                  </button>
                  <span className={`flex-1 text-sm ${lesson.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{lesson.title}</span>
                  <button onClick={() => toggleBookmark(lesson)} className={`p-1 rounded transition-colors ${lesson.bookmarked ? 'text-amber-400' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}><Bookmark size={14} /></button>
                  <button onClick={() => togglePin(lesson)} className={`p-1 rounded transition-colors ${lesson.pinned ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}><Pin size={14} /></button>
                  <button onClick={() => removeLesson(lesson.id)} className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-3">
              <button onClick={() => setAddLessonOpen(true)} className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                <Plus size={16} /> Add Lesson
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <div className="rounded-2xl border border-border bg-card p-5">
            <button onClick={() => setAddFileOpen(true)} className="mb-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground hover:border-primary hover:text-primary transition-all w-full cursor-pointer">
              <FileUp size={20} />
              <span className="text-sm font-medium">Upload File</span>
            </button>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/20">
                    <span className="flex-1 text-sm text-foreground truncate">{f.name}</span>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><ExternalLink size={14} /></a>
                    <a href={f.url} download className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Download size={14} /></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Markdown supported</span>
              <span className={`text-xs ${notesSaved ? 'text-emerald-400' : 'text-amber-400'}`}>{notesSaved ? '✓ Saved' : 'Saving...'}</span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Write course notes here... Supports markdown."
              rows={16}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono transition-shadow"
            />
          </div>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links">
          <div className="rounded-2xl border border-border bg-card p-5">
            <button onClick={() => setAddLinkOpen(true)} className="mb-4 flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
              <Plus size={16} /> Add Link
            </button>
            <div className="space-y-2">
              {links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-secondary/50">
                  <LinkIcon size={16} className="shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{link.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                  </div>
                  <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Total Time', value: `${(totalMinutes / 60).toFixed(1)} hours` },
                { label: 'Sessions', value: String(sessions.length) },
                { label: 'Completion', value: `${course.progress}%` },
                { label: 'Avg Session', value: `${sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0} min` },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-secondary p-4">
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="Lesson name *" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLesson()} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <button onClick={handleAddLesson} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add Lesson</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Link</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="Link name *" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <input placeholder="URL *" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLink()} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleAddLink} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add Link</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add File Dialog */}
      <Dialog open={addFileOpen} onOpenChange={setAddFileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="File name *" value={newFileName} onChange={e => setNewFileName(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all">
              <FileUp size={18} />
              <span className="text-sm">{selectedFile ? selectedFile.name : 'Choose file'}</span>
              <input type="file" className="hidden" onChange={e => { setSelectedFile(e.target.files?.[0] || null); if (!newFileName && e.target.files?.[0]) setNewFileName(e.target.files[0].name.replace(/\.[^.]+$/, '')); }} />
            </label>
            <button onClick={handleFileUpload} disabled={!selectedFile || !newFileName.trim()} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">Upload</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
