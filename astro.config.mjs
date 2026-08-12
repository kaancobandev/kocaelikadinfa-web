// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Not: Astro'nun yerleşik font API'si (fonts + astro:fonts) bu kurulumda
// çalışmıyor — fontları indiriyor ama <Font> bileşeninin geldiği 'astro:fonts'
// sanal modülünü Rollup çözemiyor ve derleme kırılıyor. Bu yüzden Montserrat
// elle public/fonts/ altına konuldu; kuralları src/styles/fonts.css'te.

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
