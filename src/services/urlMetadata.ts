import { supabase } from '@/integrations/supabase/client';

export interface UrlMetadata {
  title: string;
  description: string;
  thumbnail: string;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-metadata', {
      body: { url },
    });
    if (error || !data?.success) return null;
    return {
      title: data.title || '',
      description: data.description || '',
      thumbnail: data.thumbnail || '',
    };
  } catch {
    return null;
  }
}
