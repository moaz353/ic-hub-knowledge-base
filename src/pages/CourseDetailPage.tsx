import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchCourse, fetchLessons, fetchSessions, addLesson, updateLesson, deleteLesson,
  logSession, recalculateProgress, updateCourse,
  fetchSections, addSection, deleteSection,
  fetchCourseLinks, addCourseLink, deleteCourseLink,
  type Course, type CourseLesson, type CourseSession, type CourseSection, type CourseLink,
} from '@/services/courses';
import { uploadFile } from '@/services/fileUpload';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Plus, Check, Bookmark, Trash2, ExternalLink, Download, Clock,
  FileUp, Link as LinkIcon, ChevronUp, ChevronDown, ChevronRight,
  FlaskConical, BookOpen, SkipForward, SkipBack,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [sharedLinks, setSharedLinks] = useState<CourseLink[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMinutes, setSessionMinutes] = useState('');

  // Overview panel
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [descSaved, setDescSaved] = useState(true);
  const descInitial = useRef(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Notes
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);
  const notesInitial = useRef(false);

  // Files (in-memory list of uploads this session)
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

  // Player / current item
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Dialogs
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [addItemDialog, setAddItemDialog] = useState<{ sectionId: string | null; kind: 'lesson' | 'lab' } | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [c, l, s, sec, lnk] = await Promise.all([
        fetchCourse(id!), fetchLessons(id!), fetchSessions(id!), fetchSections(id!), fetchCourseLinks(id!),
      ]);
      setCourse(c);
      setLessons(l);
      setSessions(s);
      setSections(sec);
      setSharedLinks(lnk);
      setDescription(c?.description || '');
      descInitial.current = true;
      const { data: noteData } = await supabase.from('rich_notes').select('*').eq('item_id', `course-${id}`).maybeSingle();
      if (noteData) setNotes(noteData.content);
      notesInitial.current = true;
      // Pick first lesson as current
      if (l.length > 0) setCurrentId(l[0].id);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // Debounced save: course description
  useEffect(() => {
    if (!id || !descInitial.current) return;
    setDescSaved(false);
    const t = setTimeout(async () => {
      try {
        await updateCourse(id, { description } as any);
        setDescSaved(true);
      } catch { /* ignore */ }
    }, 1200);
    return () => clearTimeout(t);
  }, [description, id]);

  // Debounced save: notes
  useEffect(() => {
    if (!id || !notesInitial.current) return;
    setNotesSaved(false);
    const t = setTimeout(async () => {
      const { data } = await supabase.from('rich_notes').select('id').eq('item_id', `course-${id}`).maybeSingle();
      if (data) {
        await supabase.from('rich_notes').update({ content: notes } as any).eq('id', data.id);
      } else if (notes.trim()) {
        await supabase.from('rich_notes').insert({ item_id: `course-${id}`, content: notes } as any);
      }
      setNotesSaved(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [notes, id]);

  // ===== Lesson / Lab helpers =====
  const orderedItems = useMemo(() => {
    // Group by section in section order, then unsectioned at end
    const out: CourseLesson[] = [];
    sections.forEach(sec => {
      lessons
        .filter(l => l.section_id === sec.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach(l => out.push(l));
    });
    lessons
      .filter(l => !l.section_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach(l => out.push(l));
    return out;
  }, [lessons, sections]);

  const currentItem = useMemo(
    () => orderedItems.find(l => l.id === currentId) || orderedItems[0] || null,
    [orderedItems, currentId],
  );

  const goNext = useCallback(() => {
    if (!currentItem) return;
    const i = orderedItems.findIndex(l => l.id === currentItem.id);
    if (i >= 0 && i < orderedItems.length - 1) setCurrentId(orderedItems[i + 1].id);
  }, [orderedItems, currentItem]);

  const goPrev = useCallback(() => {
    if (!currentItem) return;
    const i = orderedItems.findIndex(l => l.id === currentItem.id);
    if (i > 0) setCurrentId(orderedItems[i - 1].id);
  }, [orderedItems, currentItem]);

  async function toggleComplete(lesson: CourseLesson) {
    if (!id) return;
    await updateLesson(lesson.id, { completed: !lesson.completed } as any);
    const progress = await recalculateProgress(id);
    setLessons(ls => ls.map(l => l.id === lesson.id ? { ...l, completed: !l.completed } : l));
    setCourse(prev => prev ? { ...prev, progress, status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started' } : prev);
  }

  async function toggleBookmark(lesson: CourseLesson) {
    await updateLesson(lesson.id, { bookmarked: !lesson.bookmarked } as any);
    setLessons(ls => ls.map(l => l.id === lesson.id ? { ...l, bookmarked: !l.bookmarked } : l));
  }

  async function removeItem(lessonId: string) {
    if (!id) return;
    await deleteLesson(lessonId);
    const progress = await recalculateProgress(id);
    const l = await fetchLessons(id);
    setLessons(l);
    setCourse(prev => prev ? { ...prev, progress } : prev);
    if (currentId === lessonId) setCurrentId(l[0]?.id || null);
  }

  // Keyboard shortcuts: Space (toggle complete), N (next), P (prev), M (bookmark)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (!t) return;
      // Ignore typing
      if (['INPUT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable) return;
      if (!currentItem) return;
      if (e.code === 'Space') { e.preventDefault(); toggleComplete(currentItem); }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); goNext(); }
      else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); goPrev(); }
      else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleBookmark(currentItem); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentItem, goNext, goPrev]);

  // ===== Sections =====
  async function handleAddSection() {
    if (!newSectionName.trim() || !id) return;
    try {
      const sec = await addSection(id, newSectionName.trim(), sections.length);
      setSections(s => [...s, sec]);
      setNewSectionName('');
      setAddSectionOpen(false);
      toast.success('Section added');
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDeleteSection(sectionId: string, name: string) {
    if (!confirm(`Delete section "${name}"? Items inside will be kept (uncategorized).`)) return;
    try {
      await deleteSection(sectionId);
      setSections(s => s.filter(x => x.id !== sectionId));
      setLessons(ls => ls.map(l => l.section_id === sectionId ? { ...l, section_id: null } : l));
      toast.success('Section deleted');
    } catch (e: any) { toast.error(e.message); }
  }

  // ===== Adding lesson / lab =====
  async function handleAddItem() {
    if (!addItemDialog || !id || !newItemTitle.trim()) return;
    try {
      const sortOrder = lessons.filter(l => l.section_id === addItemDialog.sectionId).length;
      const item = await addLesson(id, newItemTitle.trim(), sortOrder, addItemDialog.sectionId, addItemDialog.kind);
      setLessons(ls => [...ls, item]);
      setNewItemTitle('');
      setAddItemDialog(null);
      toast.success(`${addItemDialog.kind === 'lab' ? 'Lab' : 'Lesson'} added`);
    } catch (e: any) { toast.error(e.message); }
  }

  // ===== Shared Links =====
  async function handleAddSharedLink() {
    if (!id || !newLinkName.trim() || !newLinkUrl.trim()) return;
    try {
      const lnk = await addCourseLink(id, newLinkName.trim(), newLinkUrl.trim(), sharedLinks.length);
      setSharedLinks(s => [...s, lnk]);
      setNewLinkName('');
      setNewLinkUrl('');
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDeleteSharedLink(linkId: string) {
    try {
      await deleteCourseLink(linkId);
      setSharedLinks(s => s.filter(x => x.id !== linkId));
    } catch (e: any) { toast.error(e.message); }
  }

  // ===== Sessions =====
  async function handleLogSession() {
    if (!id || !sessionMinutes) return;
    await logSession(id, parseInt(sessionMinutes));
    setSessionMinutes('');
    setSessions(await fetchSessions(id));
    toast.success('Session logged');
  }

  // ===== Files =====
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

  // Heatmap
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => map.set(s.session_date, (map.get(s.session_date) || 0) + s.duration_minutes));
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

  // Group items by section for sidebar render
  const unsectionedItems = lessons.filter(l => !l.section_id).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/courses" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      {/* Header */}
      <div className="mb-4 rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">{course.name}</h1>
            {course.provider && <span className="text-sm text-muted-foreground">{course.provider}</span>}
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
      </div>

      {/* === COURSE OVERVIEW PANEL (collapsible) === */}
      <div className="mb-6 rounded-xl border border-border bg-card border-l-[3px] border-l-primary overflow-hidden shadow-sm">
        <button
          onClick={() => setOverviewOpen(o => !o)}
          className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/40 transition-colors"
          aria-expanded={overviewOpen}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Overview</span>
          {overviewOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {overviewOpen && (
          <div className="border-t border-border px-5 py-4 space-y-5">
            {/* Rich text-ish editor (markdown textarea, matches existing notes pattern) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Description</label>
                <span className={`text-[11px] ${descSaved ? 'text-emerald-400' : 'text-amber-400'}`}>{descSaved ? '✓ Saved' : 'Saving…'}</span>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Markdown supported — **bold**, *italic*, # heading, - bullets"
                rows={5}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono"
              />
            </div>

            {/* Shared Links */}
            <div>
              <label className="mb-2 block text-xs font-medium text-foreground">Shared Links</label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                {sharedLinks.length === 0 && <span className="text-xs text-muted-foreground">No shared links yet.</span>}
                {sharedLinks.map(l => (
                  <span key={l.id} className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary pl-3 pr-1 py-1 text-xs hover:border-primary/40 transition-colors">
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">{l.name}</a>
                    <button onClick={() => handleDeleteSharedLink(l.id)} className="ml-1 rounded-full p-0.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all" aria-label="Delete link">
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  placeholder="Name"
                  value={newLinkName}
                  onChange={e => setNewLinkName(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  placeholder="https://…"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSharedLink()}
                  className="flex-[2] rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button onClick={handleAddSharedLink} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Add</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === PLAYER LAYOUT: sidebar + content === */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR: Sections / Lessons / Labs */}
        <aside className="rounded-2xl border border-border bg-card overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Curriculum</span>
            <div className="text-xs text-muted-foreground mt-0.5">{completedLessons}/{lessons.length} done</div>
          </div>

          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {sections.map(sec => {
              const items = lessons.filter(l => l.section_id === sec.id).sort((a, b) => a.sort_order - b.sort_order);
              const isCollapsed = !!collapsedSections[sec.id];
              return (
                <div key={sec.id} className="group/sec">
                  <div className="flex items-center gap-1 px-3 py-2 hover:bg-secondary/50 transition-colors">
                    <button onClick={() => setCollapsedSections(c => ({ ...c, [sec.id]: !c[sec.id] }))} className="p-1 text-muted-foreground hover:text-foreground">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <span className="flex-1 text-xs font-semibold text-foreground truncate">{sec.name}</span>
                    <button
                      onClick={() => setAddItemDialog({ sectionId: sec.id, kind: 'lesson' })}
                      title="Add Lesson"
                      className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <BookOpen size={12} />
                    </button>
                    <button
                      onClick={() => setAddItemDialog({ sectionId: sec.id, kind: 'lab' })}
                      title="Add Lab"
                      className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <FlaskConical size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(sec.id, sec.name)}
                      title="Delete section"
                      className="rounded p-1 text-muted-foreground/40 opacity-0 group-hover/sec:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div>
                      {items.length === 0 && (
                        <div className="px-8 py-2 text-[11px] text-muted-foreground/60 italic">No items yet</div>
                      )}
                      {items.map(item => (
                        <SidebarItem
                          key={item.id}
                          item={item}
                          active={item.id === currentItem?.id}
                          onSelect={() => setCurrentId(item.id)}
                          onToggleComplete={() => toggleComplete(item)}
                          onRemove={() => removeItem(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unsectioned items */}
            {unsectionedItems.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60 bg-secondary/30">Uncategorized</div>
                {unsectionedItems.map(item => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    active={item.id === currentItem?.id}
                    onSelect={() => setCurrentId(item.id)}
                    onToggleComplete={() => toggleComplete(item)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <button onClick={() => setAddSectionOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors">
              <Plus size={14} /> Add Section
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6 min-w-0">
          {/* Current item player */}
          <div className="rounded-2xl border border-border bg-card p-6">
            {currentItem ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${currentItem.kind === 'lab' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-primary/30 bg-primary/10 text-primary'}`}>
                    {currentItem.kind === 'lab' ? <FlaskConical size={11} /> : <BookOpen size={11} />}
                    {currentItem.kind === 'lab' ? 'Lab' : 'Lesson'}
                  </span>
                  {currentItem.completed && <span className="text-[10px] font-semibold text-emerald-400">✓ Completed</span>}
                </div>
                <h2 className="text-xl font-bold text-foreground mb-4">{currentItem.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => toggleComplete(currentItem)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${currentItem.completed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                    <Check size={14} /> {currentItem.completed ? 'Completed' : 'Mark complete'} <kbd className="ml-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px]">Space</kbd>
                  </button>
                  <button onClick={() => toggleBookmark(currentItem)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${currentItem.bookmarked ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    <Bookmark size={14} /> {currentItem.bookmarked ? 'Bookmarked' : 'Bookmark'} <kbd className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px]">M</kbd>
                  </button>
                  <button onClick={goPrev} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <SkipBack size={14} /> Prev <kbd className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px]">P</kbd>
                  </button>
                  <button onClick={goNext} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Next <SkipForward size={14} /> <kbd className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px]">N</kbd>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No items yet. Add a section then add lessons or labs from the sidebar.
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Items Done', value: `${completedLessons}/${lessons.length}` },
              { label: 'Time Spent', value: `${Math.round(totalMinutes / 60 * 10) / 10}h` },
              { label: 'Sessions', value: String(sessions.length) },
              { label: 'Est. Remaining', value: course.estimated_hours > 0 ? `${Math.max(0, course.estimated_hours - totalMinutes / 60).toFixed(1)}h` : '—' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="rounded-2xl border border-border bg-card p-5">
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

          {/* Files / Notes tabs (kept) */}
          <Tabs defaultValue="notes">
            <TabsList className="rounded-xl">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Markdown supported</span>
                  <span className={`text-xs ${notesSaved ? 'text-emerald-400' : 'text-amber-400'}`}>{notesSaved ? '✓ Saved' : 'Saving...'}</span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Write course notes here…"
                  rows={12}
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="files">
              <div className="rounded-2xl border border-border bg-card p-5">
                <button onClick={() => setAddFileOpen(true)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  <FileUp size={18} /><span className="text-sm font-medium">Upload File</span>
                </button>
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/20 transition-all">
                        <span className="flex-1 text-sm text-foreground truncate">{f.name}</span>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary"><ExternalLink size={14} /></a>
                        <a href={f.url} download className="p-1.5 rounded-lg text-muted-foreground hover:text-primary"><Download size={14} /></a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Dialogs */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="Section name *" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSection()} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm" autoFocus />
            <button onClick={handleAddSection} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add Section</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!addItemDialog} onOpenChange={o => !o && setAddItemDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add {addItemDialog?.kind === 'lab' ? 'Lab' : 'Lesson'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder={`${addItemDialog?.kind === 'lab' ? 'Lab' : 'Lesson'} name *`} value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm" autoFocus />
            <button onClick={handleAddItem} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addFileOpen} onOpenChange={setAddFileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input placeholder="File name *" value={newFileName} onChange={e => setNewFileName(e.target.value)} className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm" autoFocus />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all">
              <FileUp size={18} />
              <span className="text-sm">{selectedFile ? selectedFile.name : 'Choose file'}</span>
              <input type="file" className="hidden" onChange={e => { setSelectedFile(e.target.files?.[0] || null); if (!newFileName && e.target.files?.[0]) setNewFileName(e.target.files[0].name.replace(/\.[^.]+$/, '')); }} />
            </label>
            <button onClick={handleFileUpload} disabled={!selectedFile || !newFileName.trim()} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Upload</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({
  item, active, onSelect, onToggleComplete, onRemove,
}: {
  item: CourseLesson;
  active: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={`group flex items-center gap-2 px-3 py-2 pl-7 cursor-pointer transition-colors ${active ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary/50 border-l-2 border-l-transparent'}`} onClick={onSelect}>
      <button onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className={`shrink-0 rounded border p-0.5 transition-all ${item.completed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-border text-transparent hover:text-muted-foreground'}`}>
        <Check size={10} />
      </button>
      {item.kind === 'lab' ? <FlaskConical size={11} className="shrink-0 text-amber-400" /> : <BookOpen size={11} className="shrink-0 text-primary/70" />}
      <span className={`flex-1 text-xs truncate ${item.completed ? 'text-muted-foreground line-through' : active ? 'text-foreground font-medium' : 'text-foreground/90'}`}>{item.title}</span>
      {item.bookmarked && <Bookmark size={10} className="shrink-0 text-amber-400" />}
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="rounded p-0.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all">
        <Trash2 size={11} />
      </button>
    </div>
  );
}
