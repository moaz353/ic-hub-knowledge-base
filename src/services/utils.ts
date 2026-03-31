import type { ICItem, TopicData } from '@/types/ichub';

// Progress
export function getProgress(id: string): number {
  return parseInt(localStorage.getItem(`ichub_progress_${id}`) || '0', 10);
}
export function setProgress(id: string, pct: number): void {
  localStorage.setItem(`ichub_progress_${id}`, String(Math.min(100, Math.max(0, pct))));
}

// Last opened
export function getLastOpened(id: string): string | null {
  return localStorage.getItem(`ichub_opened_${id}`);
}
export function setLastOpened(id: string): void {
  localStorage.setItem(`ichub_opened_${id}`, new Date().toISOString());
}

// Favorites (localStorage)
export function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem('ichub_favorites') || '[]');
  } catch { return []; }
}
export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
    localStorage.setItem('ichub_favorites', JSON.stringify(favs));
    return false;
  }
  favs.push(id);
  localStorage.setItem('ichub_favorites', JSON.stringify(favs));
  return true;
}
export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

// Watch Later queue
interface QueueItem {
  id: string;
  topicId: string;
  title: string;
  type: string;
  file: string;
  addedAt: string;
}
export function getQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem('ichub_queue') || '[]');
  } catch { return []; }
}
export function addToQueue(item: ICItem, topicId: string): void {
  const queue = getQueue();
  if (queue.some(q => q.id === item.id)) return;
  queue.push({
    id: item.id,
    topicId,
    title: item.title,
    type: item.type,
    file: item.file,
    addedAt: new Date().toISOString(),
  });
  localStorage.setItem('ichub_queue', JSON.stringify(queue));
}
export function removeFromQueue(id: string): void {
  const queue = getQueue().filter(q => q.id !== id);
  localStorage.setItem('ichub_queue', JSON.stringify(queue));
}
export function isInQueue(id: string): boolean {
  return getQueue().some(q => q.id === id);
}

// Export Markdown
export function exportMarkdown(topic: TopicData): void {
  let md = `# ${topic.name} — ${topic.fullName}\n\n`;
  md += `${topic.description}\n\n`;
  md += `---\n\n`;
  topic.items.forEach(item => {
    md += `## ${item.title}\n\n`;
    md += `- **Type:** ${item.type}\n`;
    md += `- **Source:** ${item.source || 'N/A'}\n`;
    md += `- **Date:** ${item.date}\n`;
    md += `- **Tags:** ${item.tags.join(', ') || 'None'}\n`;
    if (item.rating > 0) md += `- **Rating:** ${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}\n`;
    if (item.description) md += `\n${item.description}\n`;
    if (item.annotation) md += `\n> ${item.annotation}\n`;
    md += `\n[Open](${item.file})\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${topic.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export PDF
export function exportPDF(): void {
  window.print();
}

// Relative time
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
