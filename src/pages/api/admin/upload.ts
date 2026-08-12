import type { APIRoute } from 'astro';
import { supabase, createUserClient } from '../../../lib/supabase';
import { adminActions } from '../../../lib/admin/actions';

/**
 * Tek görsellik ekleme ucu — çoklu yükleme için.
 *
 * Neden ayrı bir uç var: 30 telefon fotoğrafı tek POST'ta ~75 MB eder,
 * Netlify'ın istek gövdesi sınırı ise bunun çok altında. Tarayıcı görselleri
 * küçültüp buraya tek tek gönderiyor; her istek küçük ve bağımsız olduğu için
 * ne boyut sınırına ne de fonksiyon zaman aşımına takılıyor, ayrıca ilerleme
 * gösterilebiliyor.
 *
 * İşi kendisi yapmıyor: dashboard'ın kullandığı aksiyon kaydının aynısını
 * çağırıp sonucu JSON döndürüyor. Böylece kurallar tek yerde kalıyor.
 */

const json = (gövde: unknown, status = 200) =>
  new Response(JSON.stringify(gövde), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  if (!accessToken) return json({ error: 'Oturum bulunamadı.' }, 401);

  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return json({ error: 'Oturumun süresi dolmuş. Yeniden giriş yapın.' }, 401);

  const form = await request.formData();
  const action = form.get('_action')?.toString() ?? '';

  const handler = adminActions[action];
  if (!handler) return json({ error: 'Bilinmeyen işlem: ' + action }, 400);

  const result = await handler.run({
    form,
    db: createUserClient(accessToken),
    token: accessToken,
  });

  return json(result, result.error ? 400 : 200);
};
