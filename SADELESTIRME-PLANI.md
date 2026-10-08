# Sadeleştirme ve Prestij Planı

> Kocaeli Kadın Futbol Kulübü · kocaelikadinfa.com
> Hazırlanma: 2026-10-08. 17 ajanlı analiz (4 teşhis merceği → 3 bağımsız
> tasarım yönü → her yöne 3 jüri → sentez) + doğrudan ölçüm.
> Değerler tahmin değil, koddan ve canlı siteden sayıldı.

---

## 0. Yapıldı: maç sonuçları ters gösteriliyordu

`mac-gecmisi.astro` kulübü `home_name.includes('kkfk')` ile tanıyordu.
Veritabanında ad **"Kocaeli Kadın Futbol Kulübü"**, "KKFK" hiç geçmiyor →
kontrol her maçta false → kod kulübü daima deplasman sanıyordu.

Canlı sitede 5 galibiyet **"M" (mağlubiyet)** olarak basılıyordu — 8–0 ve
9–3 kazanılan maçlar dahil.

Düzeltildi (commit `7b60407`): kulüp tespiti `src/lib/match.ts`'e alındı,
birden fazla yazılışı tanıyor, Türkçe `'İ'.toLowerCase()` tuzağını ele
alıyor, kulüp maçta yoksa rozet basmıyor. Rozetler: 6 "loss" → 5 "win".

**Açık kalan:** `matches` tablosundaki 6. kayıt ("İdmanocağı Kadın Futbol
Kulübü – Kocaeli Kadın Gücü") kulübün maçı değil. Pilot takım maçı mı,
yanlış giriş mi? Kontrol edilmeli.

**Kalıcı çözüm:** `matches` tablosuna açık bir sütun (`is_home boolean`
ya da sabit kulüp kimliği). Dize aramasıyla kulüp tanımak kırılgan.

---

## 1. Teşhis: sorun süs değil, karar disiplini

Referans araştırmasının bulgusu:

| | Öğe | font-size | font-weight | letter-spacing |
|---|---|---|---|---|
| Venezia FC | 1274 | 9 | 3 | **1** |
| Ajax | — | — | — | 1 |
| Arsenal | — | — | — | 1 |
| **Kocaeli Kadın FK** | **279** | **21** | **6** | **11** |

Yani "amatör" hissi tek tek efektlerden değil, **her bölümün kendi kararını
vermiş olmasından** geliyor.

### Her süsün faturası bilgiye kesiliyor

- **Yağmur** görünsün diye 4 bölümün zemini yarı saydam → kulübün en ciddi
  paragrafları benekli dokunun üstünde. Üstelik kaydırınca duraklıyor: okumak
  için durduğun an arka plan harekete geçiyor.
- **Skor sayacı** SSR'de basılı doğru skoru silip 0'dan sayıyor → hızlı
  kaydıran 4–0 yerine 1–0 okuyor; 1–1 maçta hiç olmamış "1–0" basılıyor.
- **Telefon numarası** 2,6:1 kontrastla okunmuyor — sponsorun arayacağı numara.
- **36 gradyan** tam parlaklıkta dönerken içerik ikinci planda.

---

## 2. Tasarım sistemi (tam değerlerle)

### Tipografi: 42 boyut → 7

```
--fs-eyebrow  .6875rem (11px)   yalnız .eyebrow etiketleri
--fs-sm       .8125rem (13px)   tarih, lig, meta, buton, menü
--fs-base     1rem     (16px)   gövde  ← 15px'e İNDİRİLMİYOR
--fs-md       1.125rem (18px)   kart başlığı, giriş paragrafı
--fs-lg       1.5rem   (24px)   h3
--fs-xl       clamp(1.75rem, 2.5vw + 1rem, 2.5rem)   28→40px, tüm h2
--fs-display  clamp(2.25rem, 4vw + 1rem, 3.5rem)     36→56px, h1 (sayfada 1 kez)
```

İstisna: `.score-num 2.4rem`, `.score-big 3rem` + `font-variant-numeric: tabular-nums`.

**Önemli:** tüm `clamp()` ifadelerinin orta terimi `vw + rem` biçiminde olmalı.
Mevcut 18 clamp'in hepsi ham `vw` olduğu için **Ctrl+ ile başlıklar
büyümüyordu** — erişilebilirlik hatası.

### Ağırlık: 7 → 3

```
--fw-normal 400   gövde
--fw-medium 500   eyebrow, meta, menü
--fw-bold   700   h1-h3, buton, kart başlığı
```

900 tek yere emekli: skor sayıları. 800 ve 300 kalkar.
`Scores.astro:235`'teki `font-weight: 300` zaten ölü bildirim (değişken font
aralığı 400–900, yani 400 çiziliyor).

> ⚠️ Siyah zeminde tipografi optik olarak incelir. 900 → 700 geçişi ilk anda
> "zayıflamış" görünür ve **tek seferde tüm sayfalarda** yapılmalı. Birkaç
> başlık 900 kalırsa tutarsızlık şu andakinden daha görünür olur.

### Harf aralığı: 14 → 4 (hepsi `em`)

```
--ls-display  -.02em   h1
--ls-tight    -.01em   h2/h3
(gövdede hiç yazılmaz)
--ls-eyebrow  .14em    yalnız 11px etiket
```

Mevcut `.section-label` 4px — 11px'lik bir etikette %36 tracking, sinema
jeneriği aralığı. Tracking **eklenen** tek yer `.eyebrow`.

### Satır yüksekliği: 16 → 3

`--lh-tight 1.1` (h1) · `--lh-snug 1.3` (h2/h3/kart) · `--lh-body 1.65` (paragraf).
Mevcut 1.6/1.65/1.7/1.75/1.85 beşlisi tek rolü paylaşıyor, aralarındaki fark
bir paragrafta 1 pikselin altında.

### Renk: 57 hex + 88 rgba → 4 metin + 3 zemin + 3 yeşil

```
--text       #ffffff   başlık            21:1
--text-body  #d6d6d6   gövde paragrafı   13,4:1
--text-muted #9a9a9a   meta, footer menü  6,4:1
--text-dim   #8a8a8a   telif, admin       5,2:1   ← en soluk kabul edilebilir

--black      #000000   sayfa ve bölüm zemini
--surface    #0b0e0b   kart, panel
--surface-2  #141814   görsel yer tutucu

--green        #0d4d1e   yalnız DOLGU (buton zemini, rozet)
--green-mid    #116025   yalnız hover
--green-bright #2cb84a   yalnız KÜÇÜK METİN (eyebrow, link, odak halkası)
```

Yeşil büyük yüzeye hiç sürülmez, ekranda en fazla 3 yerde görünür.

Alfa 5 adlandırılmış bileşiğe iner: `--border`, `--border-strong`,
`--surface-hover`, `--green-wash`, `--scrim`. Yeşilin 25 farklı saydamlığı
(.05/.06/.08/.1/.14/…) tek `--green-wash` değerine iner; siyah ekranda 0.05 ile
0.08 arasında görünür fark yok.

> 🔴 **KRİTİK:** `--dark`, `--card-bg`, `--radius` `:root`'tan **SİLİNMEZ**,
> alias yapılır:
> ```css
> --dark: var(--surface);
> --card-bg: var(--surface);
> --radius: var(--r-md);
> ```
> Gerekçe: 12 dosyaya yayılmış ~51 çağrı var (`Layout.astro:155` scrollbar
> dahil). Silinirse zeminler saydamlaşır, panel köşeleri 0'a düşer. Alias ile
> sıfır regresyonla geçilir, çağrı yerleri sonra tembel tembel temizlenir.

### Boşluk: ~100 padding → 6 adım (4px ızgara)

```
--sp-1 .5rem   (8px)     --sp-4 2rem  (32px)
--sp-2 .75rem  (12px)    --sp-5 3rem  (48px)
--sp-3 1.25rem (20px)    --sp-6 5rem  (80px)
```

Bölüm dikey dolgusu masaüstünde `--sp-6`, mobilde `--sp-5`. Bugün gap'te
.2/.25/.4/.5/.55/.6/.7/.8/.9rem var — 0,7rem içinde 9 mikro adım, hiçbiri
ekranda fark üretmiyor.

### Oluk ve ölçü

```
--gutter       clamp(1.25rem, 5vw, 4rem)
--measure      1120px   ızgara/bölüm
--measure-text 620px    paragraf (~66 karakter/satır)
```

> 🔴 Global sınıf adı **`.band`**, `.section` DEĞİL. `aramiza-katil.astro:342`'de
> zaten scoped `.section` var; Astro onu `[data-astro-cid-…]` ile 0,2,0
> özgüllüğe çıkarıyor ve global `.section` (0,1,0) sıra ne olursa olsun kaybeder
> — sitenin en uzun sayfası yeni oluğu sessizce almaz.

```css
.band       { padding-block: var(--sp-6); padding-inline: var(--gutter) }
.band-inner { max-width: var(--measure); margin-inline: auto }
@media (max-width: 768px) { .band { padding-block: var(--sp-5) } }
```

`.band > *` evrensel max-width kuralı **yok** (ContentCards'ın section'ı grid,
PageHero `align=right`, `a-takim:100 .story-inner { margin-left: auto }` kırılır).

Tam kenar kalan bölümler (`.band` almaz): ContentCards ızgarası, Hero fotoğrafı,
TeamSection görseli, VideoSection fotoğrafları.

### Köşe: 18 → 3

```
--r-sm   6px    küçük kutu, odak halkası
--r-md   12px   kart, panel
--r-pill 999px  buton, rozet
```

**Fotoğrafların köşesi 0 ve tam kenar.** `50%` daire olarak kalır (yarıçap
token'ı değil).

### Buton: 5 → 2

Tek `.btn-primary` (dolu yeşil hap) ve tek `.btn-text` (yeşil metin + inline
SVG ok). Metnin içine gömülü `→` karakteri silinir — ekran okuyucu "sağ ok"
demeyi bırakır. `haberler.astro:241`'deki global `.btn-primary`'yi tekrarlayan
ikinci scoped tanım silinir.

---

## 3. Silinecekler

| Ne | Dosya | Risk |
|---|---|---|
| Yağmur + 4 yarı saydam zemin | `RainBackground.astro` (157 satır, 37 radial-gradient) + `Scores:98`, `ContentCards:56`, `VideoSection:86`, `TeamSection:51-53` | Düşük — zincir **aynı commit'te** temizlenmeli |
| Skor sayma animasyonu | `NumberTicker.astro` + `Scores:5,63,65` + `mac-gecmisi:6,112,114` | Düşük |
| Navbar shimmer | `Navbar.astro` `.sb-*` + `sb-spin`/`sb-slide` | **Orta** — `:165 .btn-join:focus-visible` KORUNACAK |
| 3 degrade wordmark | `Navbar:79-86`, `Footer:206-214`, `PageHero:110-113` | **Orta** — `:245 max-width:180px` KORUNACAK, yoksa navbar 1160–1500px'te taşar |
| Hero manşetinde uppercase + 900 | `Hero.astro:168`, `:164` | **Orta** — DB'deki metin de cümle düzenine çevrilmeli |
| 4 cam/blur katmanı | `Hero:209-211`, `Navbar:50-51,258-259`, `TeamSection:139-141` | Orta |
| `.reveal` efekti | kural + gözlemci + 7 sınıf | Düşük |
| `JoinSection.astro` | tamamı | Düşük |

> ⚠️ Bunlar silinince halka açık taraftaki **tüm** `prefers-reduced-motion`
> korumaları gidiyor. `Layout.astro`'ya global blok eklenmesi **şart**:
>
> ```css
> @media (prefers-reduced-motion: reduce) {
>   *, *::before, *::after {
>     animation-duration: .01ms !important;
>     animation-iteration-count: 1 !important;
>     transition-duration: .01ms !important;
>     scroll-behavior: auto !important;
>   }
> }
> ```

Ayrıca silinen iki hareket: kaydırınca küçülen sticky navbar
(`Navbar:313` + `:60` + `:58`) ve `html { scroll-behavior: smooth }`.

**Hedef:** 0 kendiliğinden animasyon, 0 blur. Transition hedefi "15" **değil** —
mevcut 61 transition'ın neredeyse tamamı zaten hover/focus cevabı; doğru hedef
~55. Silinmeyen hareket: lightbox açılışı, SSS chevron, hover/odak geçişleri.

---

## 4. Metin: ana sayfa 1448 kelime

| Yer | Şimdi | Öneri |
|---|---|---|
| Hero manşeti | "Süper Lig'e en fazla oyuncu gönderen altyapılardan biri olmanın gururunu yaşıyoruz." | **"Kadromuzun tamamı kendi altyapımızdan."** |
| TeamSection | "A takımımız, bölgenin en köklü kadın futbol ekiplerinden biri olma yolunda emin adımlarla ilerliyor…" (23 kelime) | **"Kadınlar 1. Ligi'nde, tamamen kendi altyapımızdan."** (6) |
| Footer | "Tutkuyla, kararlılıkla ve takım ruhuyla sahada. Kocaeli'nin gururu, kadın futbolunun gücü." | **"2016'dan beri Kocaeli. Kadınlar 1. Ligi'nde, tamamen kendi altyapımızla."** |
| `a-takim:44-47` | 33 kelime, iki üstünlük iddiası, gramer hatası ("Kadınlar 1. Lig'in … kadrosuyla" = ligin kadrosu) | **"Kadınlar 1. Ligi'nin en genç kadrosu, tamamı kendi altyapımızdan."** (8) |
| `pilot-takim` H1 | "Kocaeli'nin **Şampiyonları**" — ama aynı sayfa "3. Lig'de forma giyme fırsatı" diyor | **"Pilot Takım"** + gövdede tek olgu |

**Neden "0 yabancı oyuncu" manşete konmuyor:** üç jüri de itiraz etti.
(a) "tek takım" ligdeki diğer kulüpler hakkında bir iddia, ziyaretçi
doğrulayamaz (sitede kadro/uyruk listesi yok) ve bir rakip yabancısız sahaya
çıktığı an sitenin tek cümlesi yanlış olur; (b) Türk futbolunda alt kademede
"yabancı yok" önce **bütçe sinyali** okunur — "alamıyoruz" ile "almıyoruz"
sayı olarak aynı görünür. "0" şeritte **sayı olarak** kalıyor, manşette değil.

**Kulübün adı sitede 5 farklı biçimde:** "Kocaeli Kadın Futbol Kulübü" /
"…Akademisi" / "Kocaeli Kadın FA" / "Kocaeli Kadın FK" / "KKFK".
Tek resmî ad + tek kısaltma seçilmeli. (Artık güvenli — kulüp tespiti dize
aramasından çıktı.)

**Diğer kesimler:**
- `aramiza-katil`: 6 eyebrow silinir (~15 kelime, sıfır bilgi kaybı), telefon
  5-6 yerden 2'ye iner. "Aidat ne kadar?" ve "Hangi evraklar?" SSS maddeleri
  **silinmez** — hedef kitlesi veliler olan bir sitede ilk iki soruyu silmek
  "az sözle daha fazla"nın tersi; doğru hamle kulüpten tek satır içerik istemek.
- 7 sayfanın PageHero açıklaması silinir. Test: *açıklama başlıktan
  türetilebiliyorsa dekorasyondur.*
- `akademi` 369 kelimeyle aynı şeyi üç kez söylüyor; iki cümleye inebilir.
- CTA sözlüğü 5 etiketten 2'ye: iç hedef her yerde "Aramıza Katıl", dış form
  her yerde "Ön Kayıt".

---

## 5. Yeni ana sayfa akışı

```
Hero → Kimlik Şeridi → Haberler → Sonuçlar → A Takım → Galeri → Footer
```

1. **Navbar** — arma + düz beyaz wordmark + 6 link + tek yeşil hap.
   Blur yok, degrade yok, kaydırınca küçülme yok.
2. **Hero** — tam kenar fotoğraf, `min(68vh, 620px)`. İçinde sadece: fotoğraf +
   h1 (5–8 kelime, cümle düzeni) + "Haberler" linki. Rozet yok, açıklama yok,
   camlı yan panel yok.
   *Bugün `calc(100vh - var(--nav-h))` ile ilk ekranın %91'ini yiyor; Venezia %56.*
3. **Kimlik Şeridi** (yeni, ~40 satır) — 64px: solda arma + etiket, sağda üç
   veri: `2016 / Kuruluş` · `0 / Yabancı oyuncu` · `4–16 / Akademi yaşı`.
   **Metin koda gömülmez** — `hero_settings`'in boşa düşen `badge` ve
   `description` sütunları şerit metni olarak yeniden kullanılır (migration yok),
   panelden düzenlenebilir kalır.
4. **Haberler** — 3 → 6 kart. Sabit 3 elemanlı `slots` dizisi kaldırılıp gerçek
   sayı kadar basılır (4 haber varken 2 "Yakında…" kartı görünmez — boş kart
   duvarı terk edilmişlik sinyali). Kartın tamamı tek `<a>`.
5. **Sonuçlar** — skorlar ilk karede doğru ve sabit, beyaz (yeşil değil; yeşil
   ne kadar seyrekse o kadar iş yapar). Bölüme `/mac-gecmisi` bağlantısı
   eklenir — bugün hiç yok.
6. **A Takım** — tam kenar fotoğraf + tek satır + tek buton. **Bölüm
   silinmiyor:** ana sayfada kulübün sesinin tamamen kaybolması "sade" değil
   "suskun" olur ve akademiye çocuk gönderecek veliye hiçbir şey anlatmaz.
7. **Galeri** — 3 kare, keskin köşe. Lightbox kalır. "Videolar & Fotoğraflar"
   etiketi ile "Antrenmanlardan Kareler" başlığı birbirini tekrarlıyordu; tek
   etikete iner.
8. **Footer** — 4 kolon kalır, dekor gider (accent-bar, 6 link-dot, logo-ring,
   radial zemin). Griler iki değere iner.

İlk ekranda 8 kalın metin bloğu → 1, 15 görsel → ~7, 5 blur → 0,
kendiliğinden hareket eden 5 şey → 0.

---

## 6. Giriş animasyonu: JS ile çizme fikri

**Karar:** silinmiyor, ileride JS ile yeniden yazılması düşünülüyor.

Fikrin yönü makul ama **ölçüm teşhisi değiştiriyor** — kasmanın sebebi video
değil, sabit zamanlayıcılar:

```js
var KILIT  = 2400;   // arma parlar
var ACILIS = 3100;   // perde kalkar        ← minimum bekleme
setTimeout(sahneyiBaslat, 5000);            // yedek yol
setTimeout(bitir, 9000);                    // sert tavan
```

Üstüne `html.kkfk-playing { overflow: hidden }` — bu süre boyunca **kaydırma
kilitli**. Ajan ölçümü: sayfa 1164 ms'de hazır, perde bir yüklemede
10.347 ms'de kalktı.

**Yani JS/canvas'a geçmek 3,1 saniyelik beklemeyi değiştirmez** — o bir
`setTimeout`, varlık boyutuyla ilgisi yok. Dahası:

- Video 153 KB ve **GPU'da çözülüyor**. Canvas parçacık sistemi sayfa
  yüklemesinin en sıkışık anında **ana iş parçacığında** çizer — orta seviye
  Android'de muhtemelen *daha fazla* kasar.
- Gerçek kasma kaynağı büyük ihtimalle `mix-blend-mode: screen` — tam ekran bir
  öğede blend modu pahalı kompozisyon zorluyor.

**Üç seçenek, maliyet sırasıyla:**

| | Ne | Süre | Etki |
|---|---|---|---|
| **A** ✅ | Süreleri kısalt, kaydırma kilidini kaldır, video gecikmesinin sayacı sıfırlamasını engelle | yapıldı | Hissedilen sorunun çoğunu çözdü |
| **B** | `mix-blend-mode` yerine alfa kanallı video (WebM/HEVC) | 1 saat | Kasma kaynağını kaldırır, görünüm aynı |
| **C** | Canvas/WebGL'e taşı | 1-2 gün | Byte kazancı var, kasma garantisi **yok** |

### A uygulandı — ölçülen sonuç

| | Önce | Sonra |
|---|---|---|
| Perde kalkar | 3276 ms | **~1565 ms** |
| Tamamen gider | 4178 ms | **~2475 ms** |
| En kötü ölçülen | 10.347 ms | **~2500 ms** (tavan 3200+900) |
| Kaydırma | **kilitli** | **serbest** |

Yapılanlar: `ACILIS` 3100 → 1400 · `KILIT` 2400 → 850 · arma giriş animasyonu
1,3s → 0,85s · yedek yollar 5000/9000 → 1500/3200 · "Geç" butonu 1s → 0,25s ·
kaydırma kilidi kaldırıldı.

**Asıl bulgu:** süreyi `ACILIS` değil **videonun gecikmesi** belirliyormuş.
`plateAc()` video geç yetiştiğinde `zamanlamaKur()`'u yeniden çağırıp sayacı
**sıfırdan** başlatıyordu — sahne 67 ms'de hazır olsa bile video 1,9 sn'de
gelirse perde 3,3 sn duruyordu. Artık sahne başından itibaren mutlak tavan var
(`MAKS_SAHNE = 1800`): geç gelen videoya kısa pay verilir, toplam ömür aşılamaz.
Parlama vuruşu da yalnızca bir kez kurulur (eskiden o da sıfırlanıyor ve
parlama perdenin kalkışıyla aynı ana düşüyordu).

**Sırada B var.** Kasma hâlâ hissediliyorsa sebep büyük ihtimalle
`mix-blend-mode: screen`. C'ye ancak B de yetmezse geçilir — "JS ile çizersek
hızlanır" sezgisi ölçümle desteklenmiyor, çünkü bekleme varlıktan değil
zamanlayıcılardan geliyordu.

---

## 7. Karar verilmesi gerekenler

1. **Yaklaşan maç şeridi?** İstenir ama `matches` tablosunda "oynandı mı"
   alanı yok; `MatchesPanel.astro:58-60`'ta skor `required min=0 value=0`,
   yani gelecek maç zorunlu 0–0 kaydediliyor ve beraberlik sayılıyor. Ayrıca
   `Scores.astro` maçları `match_date` değil **id** sırasına göre çekiyor, yani
   "kategori başına son sonuç" aslında "en son eklenen". Maç saati alanı da
   yok. Ya migration ile düzgün yapılır ya hiç yapılmaz.
2. **İkinci yazı tipi (serif başlıklar)?** Üç jüri de yönün en zayıf kalemi
   saydı: Türkçe `ğ/ş/İ` latin-ext altkümesinde, yeni font için `size-adjust`
   baştan ölçülmeli, yoksa çözülmüş 0,055 CLS manşette geri gelir. Faz D,
   opsiyonel. Plan B: Archivo 600.
3. **Haber kartından özet kaldırılsın mı?** Kaldırılırsa başlık tek başına iş
   yapar — ama bugünkü başlıklar "KADROMUZU GÜÇLENDİRMEYE DEVAM EDİYORUZ!"
   (tamamı büyük harf + ünlem) ve açıklamalarda emoji var; 1. kartın görseli
   içine ikinci bir arma gömülü Instagram afişi. Panelde zorlayıcı kural mı
   (maxlength + karakter sayacı + kapak kuralı, ~20 satır), yoksa sadece
   yazılı kural mı?
4. **Puan durumu modülü?** Türk kitlesi arar ama haftalık güncelleme disiplini
   ister. `aramiza-katil.astro:7-26`'daki "⚠️ BURAYI GÜNCELLE" blokları
   (ücret, 3 grubun günleri, 3 sahanın adresi) **aylardır boş** — kapasite
   kanıtı kodun içinde. Otomatik kaynak yoksa yapılmamalı.

---

## 8. Uygulama sırası

### Faz 0 — Doğrulama ✅ yapıldı

**(a) `hero_settings.title` %100 BÜYÜK HARF.**
`"SÜPER LİG'E EN FAZLA OYUNCU GÖNDEREN ALTYAPILARDAN BİRİ OLMANIN GURURU"`
→ CSS'ten `text-transform: uppercase` silmek **tek başına hiçbir görsel
değişiklik üretmez**. Planın uyardığı tuzak gerçek çıktı. Metnin kendisi de
panelden cümle düzenine çevrilmeli (A3, kullanıcıya bağlı).
id=2 ve id=3 (pilot/A takım hero) yalnızca görsel tutuyor, başlıkları boş.

**(b) 47 haberin 30'unda `published_at` BOŞ (%64).**
Planın "kart özetini kaldır, yerine başlık + tarih koy" önerisi bu hâliyle
çoğu kartta tarihsiz kalır. Üç seçenek: (1) tarihleri panelden doldur,
(2) tarihi olmayan kartta tarih satırını hiç basma, (3) özeti şimdilik
koru. **Karar verilmeli — C5 adımı buna bağlı.**

**(c) `matches`'taki 6. kayıt** (*İdmanocağı – Kocaeli Kadın Gücü*) kulübün
maçı değil. Artık rozetsiz basılıyor (eskiden uydurma "M" basıyordu).
Pilot takım maçı mı, yanlış giriş mi — kontrol edilmeli.

### Faz A — Risksiz kazanç

**A1 ✅ yapıldı.** `Layout.astro`'ya tüm token seti (tipografi, ağırlık, harf
aralığı, satır yüksekliği, renk, boşluk, oluk, köşe) + global
`.band`/`.band-inner`/`.eyebrow` + `prefers-reduced-motion` bloğu.
`--dark`/`--card-bg`/`--radius` **alias** olarak bırakıldı.
Tarayıcıda doğrulandı: `.band` → 80px/60px dolgu, `.band-inner` → 1120px,
`.eyebrow` → 11px + 1,54px tracking, aliaslar `#0b0e0b` / `12px`.

**A2 ✅ yapıldı.** Kontrast: `--text-muted` `#7a7a7a` → `#9a9a9a`
(4,9:1 → 6,4:1, site geneli) + token'ı atlayan 10 elle yazılmış renk
düzeltildi:

| Yer | Önce | Sonra |
|---|---|---|
| Footer kolon başlığı | `#444` 2,2:1 | `--text-muted` |
| Footer marka açıklaması | `#5a5a5a` 3,0:1 | `--text-muted` |
| Footer sosyal ikon | `#555` 2,8:1 | `--text-muted` |
| Footer menü linkleri | `#555` 2,8:1 | `--text-muted` |
| Footer reklam açıklaması | `#505050` 2,6:1 | `--text-muted` |
| Footer iletişim listesi | `#555` 2,8:1 | `--text-muted` |
| Footer telif | `#2e2e2e` 1,6:1 | `--text-dim` |
| Footer Admin Paneli | `#2a2a2a` 1,5:1 | `--text-dim` |
| Hero "haber yakında" | `#3a3a3a` 1,9:1 | `--text-dim` |
| 404 kart oku | `#3a3a3a` 1,9:1 | `--text-muted` |

`Hero:272/280` ve `RainBackground:48` dokunulmadı — onlar `background-color`,
metin değil. 9 sayfa × 2 genişlikte regresyon taraması temiz.

**A3 ⏸ kullanıcıya bağlı.** CSS'ten `uppercase` silmek tek başına işe
yaramıyor (bkz. Faz 0a). Panelden yapılacak: Ana Sayfa Hero → Başlık →
büyük harfli metni cümle düzenine çevir. Önerilen yeni metin:
**"Kadromuzun tamamı kendi altyapımızdan."** Metin değişince
`Hero.astro:168`'deki `text-transform: uppercase` silinecek.

### Faz B — Silmeler (1,5 gün, 4 commit, **atomik olmak zorunda**)
- **B1** RainBackground sil + 4 zemini **aynı commit'te** opaklaştır
- **B2** NumberTicker sil + düz skor + `.score-sep` 300 → 400
- **B3** Shimmer + 3 degrade wordmark sil (focus-visible ve max-width koru)
- **B4** `.reveal` tamamen sil; hiçbir yere yeniden ekleme
- **B5** `JoinSection.astro` sil
- **B6** Intro — bkz. bölüm 6, seçenek A

### Faz C — Ana sayfa yeniden kurgusu (2 gün, tek sürüm)
Silme ile yoğunlaştırma **aynı deploy'da** gitmeli, yoksa arada sayfa daha boş
görünür.

Hero yan paneli + ikinci Supabase sorgusu kaldırılır; **aynı commit'te** panel
temizliği (HeroPanel'deki 4 slotlu "Diğer Manşetler", `dashboard.astro:105
newsSlots`, `actions.ts news_save`) — yoksa panel var olmayan bir bölümü
düzenlemeye devam eder.

Sonra: kimlik şeridi bileşeni · ContentCards 3 → 6 · TeamSection tek satıra ·
bölüm başlıkları `.eyebrow` + "Tümü" kalıbına · NewsPanel'e başlık kuralları.

### Faz D — Sistem göçü (3-5 gün, **en büyük ve en hafife alınan kalem**)
23 halka açık `.astro` dosyasında ~2.268 CSS bildirimi var; 42 font-size'ı 7'ye
indirmek ~35 değerin fiilen **boyut değiştirmesi** demek.

Dosya dosya: eski scoped `padding: Xrem Y%` **sil** ve `.band` uygula (yoksa
scoped kural global'i yener ve hiçbir şey değişmez; `aramiza-katil.astro:342`'deki
scoped `.section` `.ak-section`e yeniden adlandırılacak) → değerleri tokena
çevir → 45 `var(--text-muted)` çağrısından gövde paragrafı olanları
`--text-body`ye al (yoksa `--text-body` ölü doğar).

Eşleme tablosu:

| Mevcut | Token |
|---|---|
| .62–.78rem | `--fs-eyebrow` |
| .8–.88rem | `--fs-sm` |
| .9–1.05rem | `--fs-base` |
| 1.1–1.25rem | `--fs-md` |
| 1.4–1.6rem | `--fs-lg` |
| bölüm başlığı clamp'leri | `--fs-xl` |
| sayfa başlığı clamp'leri | `--fs-display` |
| 1.6–1.85 | `--lh-body` |
| 2/3/4/5/6px | `--r-sm` |
| 8/10/12/14/16px | `--r-md` |
| 50px | `--r-pill` |

Doğrulama bütçesi gerçekçi: 8 sayfa × 2 genişlik × her dosya sonrası ≈ 1-2 gün
sadece gözle kontrol. **Bu faz görünmez, parça parça ve ertelenebilir — ama
"şıklık" ve "prestij" tam olarak burada üretiliyor.**

### Faz E — Veri ve içerik (migration gerektirenler)
- `matches`'a `status` / nullable skor + `MatchesPanel`'de zorunluluğun
  kaldırılması + `Scores`'un id sıralamasını `match_date`e çevirme + fikstür
  şeridi
- `stats()`'i `mac-gecmisi`'ne bağla — artık güvenli, kulüp tespiti düzeldi
- İç sayfa metin temizliği + ad/CTA/hitap tekleşmesi
- VideoSection'ın 3 YouTube iframe'ini `youtube-nocookie` + tıkla-oynat
  poster'a çevir — **silinen 153 KB'lık mp4'ten kat kat büyük bir yük**
- (opsiyonel) ikinci yazı tipi
- (sona kondu) puan durumu modülü — otomatik kaynak bulunmadan yapılmaz
