import type { NewsItem } from './supabase';

/* ── Türkçe karakterleri URL'de güvenli hale getir ───────────────────── */
const TR: Record<string, string> = {
  ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g',
  ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
};

/** "TÜRKİYE İKİNCİSİ KIZLARIMIZ💚🖤" → "turkiye-ikincisi-kizlarimiz" */
export function slugify(text: string): string {
  return text
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, ch => TR[ch])
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // kalan aksanlar
    .replace(/[^a-z0-9]+/g, '-')       // emoji, noktalama, boşluk
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/**
 * Haberin kalıcı adresi. Sonundaki id sayesinde başlık değişse bile
 * bağlantı çalışmaya devam eder; detay sayfası kanonik adrese yönlendirir.
 */
export function newsPath(item: Pick<NewsItem, 'id' | 'title'>): string {
  const s = slugify(item.title ?? '');
  return `/haberler/${s ? `${s}-${item.id}` : `haber-${item.id}`}`;
}

/** Adresteki slug'ın sonundaki id'yi çıkarır. */
export function idFromSlug(slug: string): number | null {
  const m = slug.match(/(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** Kart üzerinde gösterilecek kısa özet (3–4 satır). */
export function excerpt(text: string | null | undefined, max = 180): string {
  if (!text) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/** Metni boş satırlara göre paragraflara böler. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

/** Paragraf içindeki URL'leri tıklanabilir yapar. */
export function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<>"']+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="news-link">$1</a>'
  );
}

/**
 * Uzun kulüp adlarını dar ekranlar için kısaltır.
 * "Kocaeli Kadın Futbol Kulübü" → "Kocaeli Kadın FK"
 *
 * Veritabanına short_name sütunu eklemeden mevcut tüm kayıtlarda çalışır.
 */
export function shortTeamName(name: string): string {
  // NOT: \b sınırı kullanılmıyor — JS'te "ü" kelime karakteri sayılmadığı için
  // "Kulübü" sonunda \b eşleşmiyor ve kısaltma hiç çalışmıyordu.
  const short = name
    .replace(/Gen[çc]lik\s+ve\s+Spor\s+Kul[üu]b[üu]/gi, 'GSK')
    .replace(/Futbol\s+Kul[üu]b[üu]/gi, 'FK')
    .replace(/Spor\s+Kul[üu]b[üu]/gi, 'SK')
    .replace(/Kul[üu]b[üu]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return short || name;
}

/* ── Tarih ───────────────────────────────────────────────────────────── */
const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/** "2026-02-03" → "3 Şubat 2026". Tarih yoksa boş döner. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${parseInt(m[3])} ${TR_MONTHS[parseInt(m[2]) - 1]} ${m[1]}`;
}

/** <time datetime> için ISO tarih. */
export function isoDate(d: string | null | undefined): string {
  if (!d) return '';
  const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}
