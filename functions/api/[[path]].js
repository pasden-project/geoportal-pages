/* functions/api/[[path]].js — Cloudflare Pages API gateway (jalan utama)
 *
 * Frontend (src/) memanggil:  POST /api/<fn>   (lihat src/api.js, apiBase '/api')
 * File ini menangkap "/api/*" dan meneruskan ke Google Apps Script /exec,
 * menyisipkan kunci rahasia (dari env Pages) di query — tidak pernah di UI publik.
 *
 * Manfaat pakai Pages Functions alih-alih Worker terpisah:
 *   - same-origin (tanpa CORS / tanpa subdomain tambahan)
 *   - ikut auto-deploy sewaktu Pages dibangun dari repo
 *
 * ENV yang harus diatur di Cloudflare Pages (Settings → Environment variables):
 *   GAS_EXEC_URL : https://script.google.com/macros/s/<id>/exec
 *   GAS_SECRET   : nilai ScriptProperty REST_SECRET milik Apps Script
 */
const OK_JSON = { 'content-type': 'application/json' };

async function proxy(context) {
  const { request, env, params } = context;
  // Nama fungsi = segmen setelah /api/  (catch-all [[path]] → array)
  const name = (params.path && params.path[0]) ? params.path[0] : 'getDashboardData';

  if (!env.GAS_EXEC_URL) {
    return new Response(JSON.stringify({ ok: false, error: 'GAS_EXEC_URL belum diset.' }),
      { status: 500, headers: OK_JSON });
  }

  const gasUrl = env.GAS_EXEC_URL +
    (env.GAS_EXEC_URL.indexOf('?') >= 0 ? '&' : '?') +
    'path=' + encodeURIComponent(name) +
    '&key=' + encodeURIComponent(env.GAS_SECRET || '');

  const body = request.body ? await request.text() : '{}';
  const gas = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Accept: 'application/json' },
    body: body
  });

  return new Response(gas.body, { status: gas.status, headers: OK_JSON });
}

export async function onRequestPost(context) { return proxy(context); }
export async function onRequestGet(context) { return proxy(context); }