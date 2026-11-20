// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Not: Astro'nun yerleşik font API'si (fonts + astro:fonts) bu kurulumda
// çalışmıyor — fontları indiriyor ama <Font> bileşeninin geldiği 'astro:fonts'
// sanal modülünü Rollup çözemiyor ve derleme kırılıyor. Bu yüzden Montserrat
// elle public/fonts/ altına konuldu; kuralları src/styles/fonts.css'te.

export default defineConfig({
  site: 'https://kocaelikadinfa.com',
  output: 'server',

  adapter: vercel({
    // Görsel yapılandırması BURADA, vercel.json'da değil: adaptör bunu
    // .vercel/output/config.json'a yazıyor ve Build Output API'de asıl
    // geçerli olan o dosya.
    imageService: true,
    imagesConfig: {
      // Vercel yalnızca bu listedeki genişlikleri kabul eder; listede
      // olmayan bir w değeri 400 döner. Liste koddaki TÜM img()/imgSet()
      // çağrıları taranarak çıkarıldı — yeni bir genişlik kullanılırsa
      // buraya da eklenmeli.
      sizes: [120, 240, 400, 480, 600, 640, 800, 1024, 1200, 1600, 2000],
      // Yalnızca kulübün Supabase Storage'ı dönüştürülebilir.
      domains: [],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'ysozqdfbmferemehaylv.supabase.co',
          pathname: '/storage/**',
        },
      ],
      // Dönüştürülmüş görseller içerikleriyle birlikte değişmez URL'lere
      // sahip; uzun önbellek güvenli.
      minimumCacheTTL: 31536000,
      formats: ['image/webp'],
    },
  }),

  // Astro'nun kendi görsel işleme izni. src/lib/img.ts uç noktayı doğrudan
  // çağırsa da bu ayar Astro tarafındaki kontrolü açık tutuyor.
  image: {
    domains: ['ysozqdfbmferemehaylv.supabase.co'],
  },
});
