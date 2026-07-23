import type { APIRoute } from 'astro';
import { supabase, type NewsItem } from '../lib/supabase';
import { newsPath, isoDate } from '../lib/news';

/**
 * Dinamik site haritası. Sabit sayfaların yanı sıra her haberin detay
 * sayfasını da listeler; böylece haberler Google'da tek tek çıkabilir.
 * (Eskiden public/sitemap.xml elle güncelleniyordu.)
 */

const SITE = 'https://kocaelikadinfa.com';

const staticPages: { path: string; changefreq: string; priority: string }[] = [
  { path: '/',                        changefreq: 'weekly',  priority: '1.0' },
  { path: '/haberler',                changefreq: 'daily',   priority: '0.9' },
  { path: '/a-takim',                 changefreq: 'weekly',  priority: '0.8' },
  { path: '/pilot-takim',             changefreq: 'weekly',  priority: '0.8' },
  { path: '/akademi',                 changefreq: 'weekly',  priority: '0.8' },
  { path: '/mac-gecmisi',             changefreq: 'weekly',  priority: '0.7' },
  { path: '/aramiza-katil',           changefreq: 'monthly', priority: '0.7' },
  { path: '/antrenmanlardan-kareler', changefreq: 'weekly',  priority: '0.6' },
];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const { data } = await supabase
    .from('news')
    .select('*')
    .order('id', { ascending: false });
  const news: NewsItem[] = data ?? [];

  const urls = [
    ...staticPages.map(
      p => `  <url>
    <loc>${SITE}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    ),
    ...news.map(n => {
      const lastmod = isoDate(n.published_at);
      return `  <url>
    <loc>${esc(SITE + newsPath(n))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
