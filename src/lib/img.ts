/**
 * Supabase Storage görsellerini Netlify Image CDN üzerinden yeniden
 * boyutlandırıp WebP'ye çevirir.
 *
 * Yüklenen fotoğraflar telefon kamerasından geldiği için 3000–5000 px
 * genişliğinde ve 2–3 MB olabiliyor; sitede ise en fazla ~800 px'de
 * gösteriliyorlar. Bu yardımcı, URL'yi dönüştürme uç noktasına yönlendirerek
 * indirilen boyutu ~%95 azaltır.
 *
 * Supabase dışındaki adresler (yerel /public dosyaları, Unsplash yedeği vb.)
 * olduğu gibi döner — yetkilendirilmemiş alan adları CDN'de 403 verir.
 */

const SUPABASE_ORIGIN = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');

function isTransformable(src: string): boolean {
  return SUPABASE_ORIGIN.length > 0 && src.startsWith(SUPABASE_ORIGIN);
}

/** Tek bir görsel URL'si üretir. */
export function img(
  src: string | null | undefined,
  width = 800,
  quality = 72
): string {
  if (!src) return '';
  if (!isTransformable(src)) return src;
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&fm=webp&q=${quality}`;
}

/**
 * srcset üretir. Dönüştürülemeyen adreslerde undefined döner ki
 * <img> yalnızca src ile çalışsın.
 */
export function imgSet(
  src: string | null | undefined,
  widths: number[] = [400, 800],
  quality = 72
): string | undefined {
  if (!src || !isTransformable(src)) return undefined;
  return widths.map(w => `${img(src, w, quality)} ${w}w`).join(', ');
}

