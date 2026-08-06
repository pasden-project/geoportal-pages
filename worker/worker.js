/* worker/worker.js — Cloudflare Worker API Gateway (route /api/*)
 *
 * Browser → fetch('/api/<fn>') same-origin → Worker ini →
 *   tambah header CORS + secret server → forward ke Google Apps Script /exec.
 *
 * SECRET DISIMPAN DI ENV LOGIN WORKER, BUKAN DI FRONTEND/REPO:
 *   - GAS_EXEC_URL : https://script.google.com/macros/s/<id>/exec  (deploy "Anyone")
 *   - GAS_SECRET   : token yang DIVERIFIKASI Apps Script (header x-gs-secret)
 *
 * Apps Script doGet/doPost membaca e.parameter.path = nama fungsi publik.
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
    const gasUrl = env.GAS_EXEC_URL +
      (env.GAS_EXEC_URL.indexOf('?') >= 0 ? '&' : '?') +
      'path=' + encodeURIComponent(fn);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Header rahasia — Apps Script menolak bila tidak cocok.
      'x-gs-secret': env.GAS_SECRET || ''
    };

    try {
      const gas = await fetch(gasUrl, { method: 'POST', headers, body: request.body || null });
      return withCors(gas);
    } catch (e) {
      return json({ ok: false, error: 'gateway: ' + (e && e.message ? e.message : e) }, 502);
    }
  }
};