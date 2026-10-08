import type { Match } from './supabase';

/**
 * Maç kayıtlarında kulübün hangi tarafta olduğunu bulur.
 *
 * ÖNCEKİ HATA: mac-gecmisi.astro kulübü `home_name.includes('kkfk')` ile
 * tanıyordu. Veritabanında ad "Kocaeli Kadın Futbol Kulübü" olarak yazılı,
 * "KKFK" hiç geçmiyor — yani kontrol her maçta false dönüyor ve kod kulübü
 * daima deplasman sanıyordu. Sonuç: 6 maçın 5'inde galibiyet "M" (mağlubiyet)
 * olarak basılıyordu; 8-0 kazanılan maç sitede yenilgi görünüyordu.
 *
 * Kalıcı çözüm matches tablosuna açık bir sütun eklemek olurdu
 * (bkz. migrations). Buraya kadar: adı birden fazla yazılışıyla tanıyan,
 * Türkçe harf kurallarına dikkat eden tek bir yardımcı.
 */

/**
 * Türkçe için güvenli küçültme.
 * JS'te 'İ'.toLowerCase() "i" + birleşik nokta (U+0307) üretir; düz
 * includes() araması bu yüzden sessizce ıskalar. 'I' da 'i' olur, oysa
 * Türkçede 'ı' olmalı. İkisini de önce elle çeviriyoruz.
 */
function normalize(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/̇/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kulübün bilinen yazılışları. Panelden ad nasıl girilirse girilsin
 * tanınsın diye hepsi burada; yeni bir yazılış çıkarsa tek yere eklenir.
 * DİKKAT: buradaki parçalar rakip adlarıyla çakışmamalı. Ligdeki
 * "Kocaeli Kadın Gücü Spor Kulübü" ve "Kocaelispor Futbol Kulübü"
 * bu kalıpların hiçbirine uymuyor (kontrol edildi).
 */
const KULUP_YAZILISLARI = [
  'kocaeli kadın futbol',
  'kocaeli kadın fk',
  'kocaeli kadın fa',
  'kkfk',
];

export function isKulup(ad: string | null | undefined): boolean {
  if (!ad) return false;
  const n = normalize(ad);
  return KULUP_YAZILISLARI.some(y => n.includes(y));
}

/** Kulüp bu maçta ev sahibi mi, deplasman mı, yoksa hiç yok mu? */
export function kulubunTarafi(m: Match): 'ev' | 'deplasman' | null {
  if (isKulup(m.home_name)) return 'ev';
  if (isKulup(m.away_name)) return 'deplasman';
  return null;
}

/**
 * Maçın kulüp açısından sonucu.
 * Kulüp maçta hiç görünmüyorsa null döner — eskiden bu durumda "deplasman"
 * varsayılıp uydurma bir sonuç basılıyordu; artık rozet hiç gösterilmez.
 */
export function sonuc(m: Match): 'win' | 'draw' | 'loss' | null {
  const taraf = kulubunTarafi(m);
  if (!taraf) return null;
  if (m.score_home === m.score_away) return 'draw';
  const kulubunGolu  = taraf === 'ev' ? m.score_home : m.score_away;
  const rakibinGolu  = taraf === 'ev' ? m.score_away : m.score_home;
  return kulubunGolu > rakibinGolu ? 'win' : 'loss';
}

/** Kulübün attığı / yediği gol. Kulüp maçta yoksa ikisi de 0. */
export function goller(m: Match): { attigi: number; yedigi: number } {
  const taraf = kulubunTarafi(m);
  if (!taraf) return { attigi: 0, yedigi: 0 };
  return taraf === 'ev'
    ? { attigi: m.score_home, yedigi: m.score_away }
    : { attigi: m.score_away, yedigi: m.score_home };
}

/** Bir maç listesinin özeti: galibiyet/beraberlik/mağlubiyet ve goller. */
export function ozet(list: Match[]) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const m of list) {
    const s = sonuc(m);
    if (s === 'win') w++;
    else if (s === 'draw') d++;
    else if (s === 'loss') l++;
    const g = goller(m);
    gf += g.attigi;
    ga += g.yedigi;
  }
  return { w, d, l, gf, ga };
}
