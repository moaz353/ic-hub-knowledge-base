import { useState } from 'react';

interface NewTopicModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (topic: { id: string; name: string; fullName: string; description: string; icon: string; color: string }) => void;
}

export default function NewTopicModal({ open, onClose, onSubmit }: NewTopicModalProps) {
  const [form, setForm] = useState({
    name: '', fullName: '', description: '', icon: '◈', color: '#58a6ff'
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = form.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    onSubmit({ id, ...form });
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-foreground">New Topic</h3>
        <div className="grid gap-3">
          <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Short name (e.g. STA)" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Full name" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <div className="flex gap-3">
            <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="Icon" className="w-20 rounded-md border border-border bg-secondary px-3 py-2 text-center text-lg text-foreground" />
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-border bg-secondary" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">Cancel</button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Create</button>
        </div>
      </form>
    </div>
  );
}
