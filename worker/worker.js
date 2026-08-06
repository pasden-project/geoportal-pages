/* worker/worker.js — Cloudflare Worker API Gateway (route /api/*)
 *
 * Browser → fetch('/api/<fn>') same-origin → Worker ini →
 *   tambah header CORS + secret server → forward ke Google Apps Script /exec.
 *
 * SECRET DISIMPAN DI env Worker, BUKAN DI FRONTEND/REPO:
 *   - GAS_EXEC_URL : https://script.google.com/macros/s/<id>/exec  (deploy "Anyone")
 *   - GAS_SECRET   : token yang DIVERIFIKASI Apps Script (via query ?key=...)
 *
 * CATATAN PENTING: Apps Script doPost TIDAK bisa membaca header HTTP
 * sembarangan, jadi secret dikirim sebagai query param ?key=... yang
 * Ditambahkan Worker di sisi server (TIDAK pernah ada di URL browser).
 *
 * Apps Script membaca e.parameter.path (GET) / body {fn} (POST) = nama fungsi.
 */

const CORS = {
  // Minimal untuk memuluskan request same-origin di Pages; perketat ke
  // domain Anda bila mau cross-origin dari subdomain untuk mengambil rute.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, x-gs-secret',
  'Access-Control-Max-Age': '86400'
};

function withCors(res) {
  const r = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) r.headers.set(k, v);
  return r;
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight CORS (bila ada origin berbeda)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Hanya layani /api/*
    if (!url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'Not found' }, 404);
    }

    if (!env.GAS_EXEC_URL) {
      return json({ ok: false, error: 'GAS_EXEC_URL belum diset di Worker env.' }, 500);
    }

    // Nama fungsi = bagian setelah /api/
    const fn = url.pathname.replace(/^\/api\/?/, '') || 'getDashboardData';

    // Secret dikirim sebagai query param (Apps Script tidak membaca header).
    // DITAMBAHKAN DI SINI (server Worker) — tidak pernah ada di URL browser.
    const gasUrl = env.GAS_EXEC_URL +
      (env.GAS_EXEC_URL.indexOf('?') >= 0 ? '&' : '?') +
      'path=' + encodeURIComponent(fn) +
      '&key=' + encodeURIComponent(env.GAS_SECRET || '');

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    try {
      // Baca body sebagai teks dulu lalu teruskan (lebih andal utk Apps Script).
      const raw = request.body ? await request.text() : '{}';
      const gas = await fetch(gasUrl, { method: 'POST', headers, body: raw });
      return withCors(gas);
    } catch (e) {
      return json({ ok: false, error: 'gateway: ' + (e && e.message ? e.message : e) }, 502);
    }
  }
};