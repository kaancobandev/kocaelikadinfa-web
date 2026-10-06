-- A Takım hero görselinin panelden yönetilebilmesi için.
-- Supabase → SQL Editor'da bir kez çalıştırın.
--
-- SORUN
-- hero_settings tablosu başlangıçta tek satırlık bir ayar tablosu olarak
-- tasarlanmış ve "hero_settings_single_row" adlı bir tekillik kısıtı
-- eklenmiş. Sonradan Pilot Takım için ikinci satır (id = 2) eklenmiş ama
-- kısıt kaldırılmamış. Bu yüzden üçüncü satır (id = 3, A Takım) eklenmek
-- istendiğinde şu hata alınıyor:
--
--   duplicate key value violates unique constraint "hero_settings_single_row"
--
-- Tablo artık "id'ye göre anahtarlanmış ayar satırları" olarak kullanılıyor:
--   id = 1  → Ana sayfa hero
--   id = 2  → Pilot Takım hero
--   id = 3  → A Takım hero
--
-- Dolayısıyla kısıt tasarımla çelişiyor ve kaldırılması gerekiyor.
-- Satırların benzersizliğini zaten birincil anahtar (id) sağlıyor.

-- ── 1) Önce ne olduğunu görün (isteğe bağlı ama tavsiye edilir) ────────
-- Aşağıdaki iki sorgu kısıtın tanımını gösterir. Beklenmedik bir şey
-- çıkarsa silmeden önce bakın.
--
--   select conname, pg_get_constraintdef(oid) as tanim
--   from pg_constraint
--   where conrelid = 'public.hero_settings'::regclass;
--
--   select indexname, indexdef
--   from pg_indexes
--   where schemaname = 'public' and tablename = 'hero_settings';

-- ── 2) Kısıtı kaldır ──────────────────────────────────────────────────
-- Kısıt ister tablo kısıtı ister bağımsız indeks olarak tanımlanmış olsun
-- diye iki biçim de deneniyor; var olmayan için "if exists" sessiz geçer.
alter table public.hero_settings
  drop constraint if exists hero_settings_single_row;

drop index if exists public.hero_settings_single_row;

-- ── 3) Doğrulama ──────────────────────────────────────────────────────
-- Bu sorgu 0 satır dönmelidir:
--   select conname from pg_constraint
--   where conrelid = 'public.hero_settings'::regclass
--     and conname = 'hero_settings_single_row';

comment on table public.hero_settings is
  'Sayfa hero ayarları, id ile anahtarlanır: 1 = ana sayfa, 2 = pilot takım, 3 = A takım.';
