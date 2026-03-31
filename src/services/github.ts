import { CONFIG } from '@/config';
import type { TopicData, TopicIndex, ICItem } from '@/types/ichub';

const API_BASE = 'https://api.github.com';

function repoUrl(path: string): string {
  return `${API_BASE}/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`;
}

function cacheKey(path: string): string {
  return `ichub_cache_${path}`;
}

function getCached<T>(path: string): { data: T; sha: string } | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(path));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function setCache<T>(path: string, data: T, sha: string): void {
  try {
    sessionStorage.setItem(cacheKey(path), JSON.stringify({ data, sha }));
  } catch { /* ignore */ }
}

function invalidateCache(path: string): void {
  sessionStorage.removeItem(cacheKey(path));
}

export async function getFile(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(repoUrl(path));
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const json = await res.json();
  const content = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))));
  return { content, sha: json.sha };
}

export async function putFile(
  path: string,
  content: string,
  sha: string,
  message: string,
  token: string
): Promise<string> {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const res = await fetch(repoUrl(path), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: encoded,
      sha,
      branch: CONFIG.branch,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  const json = await res.json();
  return json.content.sha.substring(0, 7);
}

export async function readIndex(): Promise<TopicIndex> {
  const cached = getCached<TopicIndex>(`${CONFIG.dataPath}index.json`);
  if (cached) return cached.data;
  const { content, sha } = await getFile(`${CONFIG.dataPath}index.json`);
  const data = JSON.parse(content) as TopicIndex;
  setCache(`${CONFIG.dataPath}index.json`, data, sha);
  return data;
}

export async function readTopic(topicId: string): Promise<{ data: TopicData; sha: string }> {
  const path = `${CONFIG.dataPath}${topicId}.json`;
  const cached = getCached<TopicData>(path);
  if (cached) return cached;
  const { content, sha } = await getFile(path);
  const data = JSON.parse(content) as TopicData;
  setCache(path, data, sha);
  return { data, sha };
}

export async function writeTopic(
  topicId: string,
  data: TopicData,
  sha: string,
  message: string,
  token: string
): Promise<string> {
  const path = `${CONFIG.dataPath}${topicId}.json`;
  const content = JSON.stringify(data, null, 2);
  const newSha = await putFile(path, content, sha, message, token);
  invalidateCache(path);
  return newSha;
}

export async function addItem(
  topicId: string,
  item: ICItem,
  token: string
): Promise<string> {
  const { data, sha } = await readTopic(topicId);
  data.items.push(item);
  return writeTopic(topicId, data, sha, `add: ${item.title} → ${data.name}`, token);
}

export async function editItem(
  topicId: string,
  itemId: string,
  updates: Partial<ICItem>,
  token: string
): Promise<string> {
  const { data, sha } = await readTopic(topicId);
  const idx = data.items.findIndex(i => i.id === itemId);
  if (idx === -1) throw new Error('Item not found');
  data.items[idx] = { ...data.items[idx], ...updates };
  return writeTopic(topicId, data, sha, `edit: ${data.items[idx].title} → ${data.name}`, token);
}

export async function deleteItem(
  topicId: string,
  itemId: string,
  token: string
): Promise<string> {
  const { data, sha } = await readTopic(topicId);
  const item = data.items.find(i => i.id === itemId);
  if (!item) throw new Error('Item not found');
  data.items = data.items.filter(i => i.id !== itemId);
  return writeTopic(topicId, data, sha, `delete: ${item.title} from ${data.name}`, token);
}

export async function readAllTopics(): Promise<TopicData[]> {
  const index = await readIndex();
  const results = await Promise.allSettled(
    index.topics.map(id => readTopic(id).then(r => r.data))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<TopicData> => r.status === 'fulfilled')
    .map(r => r.value);
}

export async function createTopic(
  topicData: TopicData,
  token: string
): Promise<string> {
  const path = `${CONFIG.dataPath}${topicData.id}.json`;
  const content = JSON.stringify(topicData, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const res = await fetch(repoUrl(path), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `create topic: ${topicData.name}`,
      content: encoded,
      branch: CONFIG.branch,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }

  // Update index.json
  const indexPath = `${CONFIG.dataPath}index.json`;
  const { content: indexContent, sha: indexSha } = await getFile(indexPath);
  const index = JSON.parse(indexContent) as TopicIndex;
  if (!index.topics.includes(topicData.id)) {
    index.topics.push(topicData.id);
    await putFile(indexPath, JSON.stringify(index, null, 2), indexSha, `index: add ${topicData.id}`, token);
    invalidateCache(indexPath);
  }

  return (await res.json()).content.sha.substring(0, 7);
}

export async function editTopic(
  topicId: string,
  updates: Partial<Omit<TopicData, 'id' | 'items'>>,
  token: string
): Promise<string> {
  const { data, sha } = await readTopic(topicId);
  const updated = { ...data, ...updates, id: data.id, items: data.items };
  return writeTopic(topicId, updated, sha, `edit topic: ${updated.name}`, token);
}

export async function deleteTopic(
  topicId: string,
  token: string
): Promise<string> {
  // Get the file sha
  const path = `${CONFIG.dataPath}${topicId}.json`;
  const { sha } = await getFile(path);

  // Delete the file
  const res = await fetch(repoUrl(path), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `delete topic: ${topicId}`,
      sha,
      branch: CONFIG.branch,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  invalidateCache(path);

  // Update index.json
  const indexPath = `${CONFIG.dataPath}index.json`;
  const { content: indexContent, sha: indexSha } = await getFile(indexPath);
  const index = JSON.parse(indexContent) as TopicIndex;
  index.topics = index.topics.filter(t => t !== topicId);
  await putFile(indexPath, JSON.stringify(index, null, 2), indexSha, `index: remove ${topicId}`, token);
  invalidateCache(indexPath);

  return 'deleted';
}
