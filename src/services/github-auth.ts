import { CONFIG } from '@/config';
import { clearToken } from '@/services/auth';

const API_BASE = 'https://api.github.com';

export function getGitHubHeaders(token?: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function throwGitHubResponseError(response: Response): Promise<never> {
  const payload = await response.json().catch(() => ({}));
  const message = typeof payload?.message === 'string' ? payload.message : '';

  if (response.status === 401 || /bad credentials/i.test(message)) {
    clearToken();
    throw new Error(
      'Invalid GitHub token. The saved token was cleared. Use a Fine-Grained PAT with access to this repository, Contents: Read and Write, and Metadata: Read.'
    );
  }

  if (response.status === 403 || /resource not accessible by personal access token/i.test(message)) {
    clearToken();
    throw new Error(
      `This GitHub token cannot write to ${CONFIG.owner}/${CONFIG.repo}. The saved token was cleared. Create a Fine-Grained PAT scoped to this repository with Contents: Read and Write plus Metadata: Read.`
    );
  }

  throw new Error(message || `GitHub API error: ${response.status}`);
}

export async function validateGitHubToken(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/user`, {
    headers: getGitHubHeaders(token),
  });

  if (!response.ok) {
    await throwGitHubResponseError(response);
  }
}