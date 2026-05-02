import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Image as ImageIcon, Video, Code2, Link2, Upload } from 'lucide-react';
import { addResource, uploadResourceFile, type ResourceType, type CodeLanguage, type LessonResource } from '@/services/resources';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lessonId: string;
  onAdded: (r: LessonResource) => void;
}

const TYPE_OPTIONS: { type: ResourceType; label: string; icon: any; color: string }[] = [
  { type: 'pdf', label: 'PDF', icon: FileText, color: 'text-rose-400' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: 'text-emerald-400' },
  { type: 'video', label: 'Video', icon: Video, color: 'text-amber-400' },
  { type: 'code', label: 'Code', icon: Code2, color: 'text-sky-400' },
  { type: 'link', label: 'Link', icon: Link2, color: 'text-violet-400' },
];

const LANG_OPTIONS: { value: CodeLanguage; label: string }[] = [
  { value: 'verilog', label: 'Verilog (.v)' },
  { value: 'systemverilog', label: 'SystemVerilog (.sv)' },
  { value: 'tcl', label: 'Tcl (.tcl)' },
  { value: 'python', label: 'Python (.py)' },
];

export default function AddResourceModal({ open, onOpenChange, lessonId, onAdded }: Props) {
  const [type, setType] = useState<ResourceType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<CodeLanguage>('verilog');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setType(null); setName(''); setDescription(''); setUrl(''); setFile(null);
    setLanguage('verilog'); setCode(''); setSubmitting(false);
  }

  function handleClose(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  async function submit() {
    if (!type || !name.trim()) return;
    setSubmitting(true);
    try {
      let payload: any = { type, name: name.trim(), description: description.trim() };

      if (type === 'pdf' || type === 'image') {
        if (!file) { toast.error('Please choose a file'); setSubmitting(false); return; }
        const up = await uploadResourceFile(file, lessonId);
        payload.url = up.url;
        payload.storage_path = up.path;
        payload.file_size = up.size;
      } else if (type === 'video' || type === 'link') {
        if (!url.trim()) { toast.error('URL is required'); setSubmitting(false); return; }
        payload.url = url.trim();
      } else if (type === 'code') {
        if (!code.trim()) { toast.error('Code is required'); setSubmitting(false); return; }
        payload.language = language;
        payload.code_content = code;
      }

      const created = await addResource(lessonId, payload);
      onAdded(created);
      toast.success('Resource added');
      handleClose(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add resource');
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{type ? `Add ${type.charAt(0).toUpperCase() + type.slice(1)}` : 'Add Resource'}</DialogTitle>
        </DialogHeader>

        {!type ? (
          <div className="grid grid-cols-3 gap-3 py-2 sm:grid-cols-5">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setType(opt.type)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary"
              >
                <opt.icon size={26} className={opt.color} />
                <span className="text-xs font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Adder testbench"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description…"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {(type === 'pdf' || type === 'image') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {type === 'pdf' ? 'PDF file *' : 'Image file *'}
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  <Upload size={16} />
                  <span className="text-sm">{file ? file.name : 'Choose file'}</span>
                  <input
                    type="file"
                    accept={type === 'pdf' ? 'application/pdf' : 'image/*'}
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''));
                    }}
                  />
                </label>
              </div>
            )}

            {(type === 'video' || type === 'link') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">URL *</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder={type === 'video' ? 'YouTube / Vimeo / .mp4 URL' : 'https://…'}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            {type === 'code' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Language *</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as CodeLanguage)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Code *</label>
                  <textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Paste your code here…"
                    rows={10}
                    className="w-full rounded-lg border border-border bg-[#1e1e1e] px-3 py-2 text-xs font-mono text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <button
                onClick={() => setType(null)}
                className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={submit}
                disabled={submitting || !name.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add Resource'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
