/* config.js — Konfigurasi frontend.
 *  IMPORTANT: JANGAN taruh secret/token apa pun di file ini (frontend publik).
 *  Secret (GAS_EXEC_URL, GAS_SECRET) hanya di env Cloudflare Worker.
 */
window.APP_CONFIG = {
  /* Mode transport data (flag transisi — Fase 3/4):
   *   'gas'  → halaman disajikan oleh Google Apps Script → pakai google.script.run
   *   'rest' → halaman di Cloudflare Pages → pakai fetch('/api/...') via Worker
   * Folder src/ ini untuk CLOUDFLARE PAGES → default 'rest'.
   * (Ubah ke 'gas' hanya bila mengetes versi split di dalam Apps Script.)
   */
  transport: 'rest',

  /* Base URL endpoint API saat mode 'rest'.
   * Default '/api' → dipakai Worker pada domain yang sama (same-origin).
   * Bila API ada di subdomain terpisah, ganti: 'https://api.domain.my.id'
   */
  apiBase: '/api',

  // --- Identitas & peta ---
  appName: 'GeoPORTAL Angkutan BPTD Jabar',
  regionCenter: [-6.9, 107.6],
  regionZoom: 8
};