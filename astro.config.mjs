// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://kocaelikadinfa.com',
  output: 'server',
  adapter: netlify(),

  // Supabase Storage'daki görsellerin Netlify Image CDN üzerinden
  // yeniden boyutlandırılıp WebP'ye çevrilmesine izin verir.
  image: {
    domains: ['ysozqdfbmferemehaylv.supabase.co'],
  },
});
