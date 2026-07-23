-- Haberlere yayın tarihi ekler.
-- Supabase → SQL Editor'da bir kez çalıştırın.
--
-- Bu sütun eklenmeden önce de site çalışır: tarih bulunamazsa arayüz
-- tarihi hiç göstermez. Sütun eklendikten sonra admin panelindeki
-- "Yayın Tarihi" alanı devreye girer.

alter table public.news
  add column if not exists published_at date;

comment on column public.news.published_at is 'Haberin yayın tarihi. Boşsa sitede tarih gösterilmez.';

-- İsteğe bağlı: mevcut haberleri toplu doldurmak isterseniz aşağıdaki
-- satırın yorumunu kaldırın. DİKKAT — bütün haberlere aynı tarihi yazar;
-- gerçek tarihleri admin panelinden tek tek girmek daha doğrudur.
-- update public.news set published_at = current_date where published_at is null;
