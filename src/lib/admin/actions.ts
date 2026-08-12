/**
 * Admin panelindeki tüm POST işlemleri tek yerde.
 *
 * Her aksiyon iki şey bildirir:
 *   panel — işlem bitince geri dönülecek panelin id'si (URL hash'i)
 *   run   — işin kendisi
 *
 * dashboard.astro yalnızca doğru aksiyonu bulur, çalıştırır ve sonucu
 * POST-Redirect-GET ile geri yansıtır.
 */

import { supabase, createUserClient, uploadFile } from '../supabase';

type Db = ReturnType<typeof createUserClient>;

export interface ActionCtx {
  form: FormData;
  /** Kullanıcının JWT'siyle oluşturulmuş istemci — yazma işlemleri bununla. */
  db: Db;
  token: string;
}

export interface ActionResult {
  ok?: string;
  error?: string;
}

interface ActionDef {
  panel: string;
  run: (ctx: ActionCtx) => Promise<ActionResult>;
}

// ── Yardımcılar ────────────────────────────────────────────────────────
const str = (form: FormData, name: string) => form.get(name)?.toString() ?? '';
const num = (form: FormData, name: string, fallback = 0) => {
  const v = Number(form.get(name));
  return Number.isFinite(v) ? v : fallback;
};

/** Supabase sonucunu tek satırda mesaja çevirir. */
const done = (
  error: { message: string } | null,
  okMsg: string,
  failPrefix = 'Kaydedilemedi'
): ActionResult => (error ? { error: `${failPrefix}: ${error.message}` } : { ok: okMsg });

/**
 * Kullanıcının girdiği görsel adresini doğrular.
 * Yalnızca http/https kabul edilir; `javascript:` ve `data:` gibi şemalar elenir.
 */
function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith('/')) return value; // site içi yol
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

/** Formdan önce dosyayı, yoksa URL alanını alır. */
async function resolveImage(
  ctx: ActionCtx,
  fileField: string,
  urlField: string,
  folder: string
): Promise<string | null> {
  const file = ctx.form.get(fileField) as File | null;
  if (file && file.size > 0) {
    const uploaded = await uploadFile(ctx.token, file, folder);
    if (uploaded) return uploaded;
  }
  return safeUrl(ctx.form.get(urlField)?.toString());
}

/**
 * published_at sütunu migrations/001 çalıştırılana kadar tabloda olmayabilir.
 * O durumda alanı düşürüp tekrar deniyoruz ki haber ekleme/güncelleme bozulmasın.
 */
const missingPublishedAt = (msg?: string) =>
  !!msg && /published_at/i.test(msg) && /(column|schema cache)/i.test(msg);

/** Basit galeri tablolarının hepsi aynı şekilde çalışıyor. */
function galleryAdd(
  panel: string,
  table: string,
  folder: string,
  urlField = 'image_url'
): ActionDef {
  return {
    panel,
    run: async (ctx) => {
      const caption = str(ctx.form, 'caption');
      const sort_order = num(ctx.form, 'sort_order', 99);
      const image_url = await resolveImage(ctx, 'image_file', urlField, folder);

      if (!image_url) return { error: 'Lütfen bir görsel seçin veya geçerli bir URL girin.' };

      const column = urlField === 'media_url' ? 'media_url' : 'image_url';
      const { error } = await ctx.db
        .from(table)
        .insert({ [column]: image_url, caption, sort_order });
      return done(error, 'Eklendi!', 'Eklenemedi');
    },
  };
}

function galleryDelete(panel: string, table: string): ActionDef {
  return {
    panel,
    run: async (ctx) => {
      const { error } = await ctx.db.from(table).delete().eq('id', num(ctx.form, 'id'));
      return done(error, 'Silindi.', 'Silinemedi');
    },
  };
}

/** hero_settings tablosunda tek satırı (id) günceller, yoksa oluşturur. */
async function upsertHero(
  ctx: ActionCtx,
  id: number,
  fields: Record<string, unknown>,
  okMsg: string
): Promise<ActionResult> {
  const { data: existing } = await supabase.from('hero_settings').select('id').eq('id', id).single();
  if (existing) {
    const { error } = await ctx.db.from('hero_settings').update(fields).eq('id', id);
    return done(error, okMsg);
  }
  const { error } = await ctx.db
    .from('hero_settings')
    .insert({ id, badge: '', title: '', description: '', ...fields });
  return done(error, okMsg);
}

// ── Aksiyonlar ─────────────────────────────────────────────────────────
export const adminActions: Record<string, ActionDef> = {
  // ── Ana sayfa hero ──
  hero_save: {
    panel: 'hero',
    run: async (ctx) => {
      const image_url = await resolveImage(ctx, 'image_file', 'image_url', 'hero');
      return upsertHero(
        ctx,
        1,
        {
          badge: str(ctx.form, 'badge'),
          title: str(ctx.form, 'title'),
          description: str(ctx.form, 'description'),
          ...(image_url && { image_url }),
        },
        'Hero güncellendi!'
      );
    },
  },

  // ── Hero sağ paneldeki manşetler (sort_order 1–4 sabit slot) ──
  news_save: {
    panel: 'hero',
    run: async (ctx) => {
      const slot = num(ctx.form, 'slot');
      const existingId = str(ctx.form, 'existing_id');
      const title = str(ctx.form, 'title');
      const description = str(ctx.form, 'description');
      const image_url = await resolveImage(ctx, 'image_file', 'image_url', 'news');

      if (existingId) {
        const { error } = await ctx.db
          .from('news')
          .update({ title, description, ...(image_url && { image_url }) })
          .eq('id', Number(existingId));
        return done(error, `Manşet ${slot} güncellendi!`);
      }
      const { error } = await ctx.db
        .from('news')
        .insert({ title, description, image_url, sort_order: slot });
      return done(error, `Manşet ${slot} eklendi!`);
    },
  },

  // ── Maçlar ──
  match_add: {
    panel: 'maclar',
    run: async (ctx) => {
      const home_logo = await resolveImage(ctx, 'home_logo_file', 'home_logo_url', 'logos');
      const away_logo = await resolveImage(ctx, 'away_logo_file', 'away_logo_url', 'logos');

      const { error } = await ctx.db.from('matches').insert({
        badge: str(ctx.form, 'badge'),
        home_name: str(ctx.form, 'home_name'),
        home_logo,
        away_name: str(ctx.form, 'away_name'),
        away_logo,
        score_home: num(ctx.form, 'score_home'),
        score_away: num(ctx.form, 'score_away'),
        match_date: str(ctx.form, 'match_date'),
        league: str(ctx.form, 'league'),
        sort_order: num(ctx.form, 'sort_order', 99),
      });
      return done(error, 'Yeni maç eklendi!', 'Maç eklenemedi');
    },
  },

  update: {
    panel: 'maclar',
    run: async (ctx) => {
      // Logo alanları boş bırakılırsa kayıtlı logo korunur (null'lanmaz).
      const home_logo = await resolveImage(ctx, 'home_logo_file', 'home_logo_url', 'logos');
      const away_logo = await resolveImage(ctx, 'away_logo_file', 'away_logo_url', 'logos');

      const { error } = await ctx.db
        .from('matches')
        .update({
          badge: str(ctx.form, 'badge'),
          home_name: str(ctx.form, 'home_name'),
          ...(home_logo && { home_logo }),
          away_name: str(ctx.form, 'away_name'),
          ...(away_logo && { away_logo }),
          score_home: num(ctx.form, 'score_home'),
          score_away: num(ctx.form, 'score_away'),
          match_date: str(ctx.form, 'match_date'),
          league: str(ctx.form, 'league'),
        })
        .eq('id', num(ctx.form, 'id'));
      return done(error, 'Maç güncellendi!', 'Güncelleme başarısız');
    },
  },

  delete: {
    panel: 'maclar',
    run: async (ctx) => {
      const { error } = await ctx.db.from('matches').delete().eq('id', num(ctx.form, 'id'));
      return done(error, 'Maç silindi.', 'Silme başarısız');
    },
  },

  // ── Haberler ──
  article_add: {
    panel: 'haberler',
    run: async (ctx) => {
      const title = str(ctx.form, 'title');
      const description = str(ctx.form, 'description');
      const published_at = str(ctx.form, 'published_at') || null;
      const image_url = await resolveImage(ctx, 'image_file', 'image_url', 'news');

      let { error } = await ctx.db
        .from('news')
        .insert({ title, description, image_url, published_at, sort_order: 0 });
      if (missingPublishedAt(error?.message)) {
        ({ error } = await ctx.db
          .from('news')
          .insert({ title, description, image_url, sort_order: 0 }));
      }
      return done(error, 'Haber eklendi!', 'Eklenemedi');
    },
  },

  article_update: {
    panel: 'haberler',
    run: async (ctx) => {
      const id = num(ctx.form, 'id');
      const title = str(ctx.form, 'title');
      const description = str(ctx.form, 'description');
      const published_at = str(ctx.form, 'published_at') || null;
      const image_url = await resolveImage(ctx, 'image_file', 'image_url', 'news');

      let { error } = await ctx.db
        .from('news')
        .update({ title, description, published_at, ...(image_url && { image_url }) })
        .eq('id', id);
      if (missingPublishedAt(error?.message)) {
        ({ error } = await ctx.db
          .from('news')
          .update({ title, description, ...(image_url && { image_url }) })
          .eq('id', id));
      }
      return done(error, 'Haber güncellendi!');
    },
  },

  article_delete: {
    panel: 'haberler',
    run: async (ctx) => {
      const { error } = await ctx.db.from('news').delete().eq('id', num(ctx.form, 'id'));
      return done(error, 'Haber silindi.', 'Silinemedi');
    },
  },

  // ── Videolar (sort_order 1/2/3 sabit slot) ──
  video_save: {
    panel: 'videolar',
    run: async (ctx) => {
      const slot = num(ctx.form, 'slot');
      const existingId = str(ctx.form, 'existing_id');
      const title = str(ctx.form, 'title');
      const description = str(ctx.form, 'description');
      const youtube_url = safeUrl(str(ctx.form, 'youtube_url')) ?? '';

      if (existingId) {
        const { error } = await ctx.db
          .from('videos')
          .update({ title, description, youtube_url })
          .eq('id', Number(existingId));
        return done(error, `Video ${slot} güncellendi!`);
      }
      const { error } = await ctx.db
        .from('videos')
        .insert({ title, description, youtube_url, sort_order: slot });
      return done(error, `Video ${slot} eklendi!`);
    },
  },

  // ── Antrenmanlardan Kareler (fotoğraf + YouTube) ──
  antrenman_add: galleryAdd('antrenman', 'antrenman_galeri', 'antrenman-galeri', 'media_url'),
  antrenman_delete: galleryDelete('antrenman', 'antrenman_galeri'),

  // ── Galeriler ──
  a_takim_gallery_add: galleryAdd('a-takim', 'a_takim_gallery', 'a-takim-gallery'),
  a_takim_gallery_delete: galleryDelete('a-takim', 'a_takim_gallery'),

  pilot_gallery_add: galleryAdd('pilot', 'pilot_gallery', 'pilot-gallery'),
  pilot_gallery_delete: galleryDelete('pilot', 'pilot_gallery'),

  gallery_add: galleryAdd('akademi', 'gallery', 'gallery'),
  gallery_delete: galleryDelete('akademi', 'gallery'),

  // ── Pilot takım hero görseli ──
  pilot_hero_save: {
    panel: 'pilot',
    run: async (ctx) => {
      const image_url = await resolveImage(ctx, 'image_file', 'image_url', 'pilot-hero');
      if (!image_url) return { error: 'Lütfen bir görsel seçin veya geçerli bir URL girin.' };
      return upsertHero(ctx, 2, { image_url }, 'Pilot Takım hero görseli güncellendi!');
    },
  },
};
