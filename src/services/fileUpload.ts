import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'item-files';

export async function uploadFile(
  file: File,
  topicId: string,
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop() || 'bin';
  const safeName = `${topicId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Upload failed:', error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(safeName);
  return { url: data.publicUrl, path: safeName };
}

export async function deleteFile(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}

export function isUploadedFile(url: string): boolean {
  return url.includes('/storage/v1/object/public/item-files/');
}

export function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('.').pop()?.toLowerCase() || '';
  } catch {
    return url.split('.').pop()?.toLowerCase() || '';
  }
}

export function isImageFile(url: string): boolean {
  const ext = getFileExtension(url);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
}

export function isPdfFile(url: string): boolean {
  return getFileExtension(url) === 'pdf';
}
