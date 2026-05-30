import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

// Admin işlemleri için kullanıcının JWT'siyle istemci oluşturur
export function createUserClient(accessToken: string) {
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// Dosyayı Supabase Storage'a yükler, public URL döner
export async function uploadFile(
  accessToken: string,
  file: File,
  folder: string
): Promise<string | null> {
  const client = createUserClient(accessToken);
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const path     = `${folder}/${Date.now()}.${ext}`;
  const buffer   = await file.arrayBuffer();

  const { error } = await client.storage
    .from('media')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return null;

  const { data } = client.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  sort_order: number;
}

export interface HeroSettings {
  id: number;
  badge: string;
  title: string;
  description: string;
  image_url: string | null;
}

export interface GalleryItem {
  id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export interface VideoItem {
  id: number;
  title: string;
  description: string;
  youtube_url: string;
  sort_order: number;
}

export interface AntrenmanGaleriItem {
  id: number;
  media_url: string;
  caption: string | null;
  sort_order: number;
}

export interface Match {
  id: number;
  badge: string;
  home_name: string;
  home_logo: string | null;
  away_name: string;
  away_logo: string | null;
  score_home: number;
  score_away: number;
  match_date: string;
  league: string;
  sort_order: number;
}
