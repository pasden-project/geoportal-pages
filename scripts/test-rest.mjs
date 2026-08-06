/* scripts/test-rest.mjs — uji otomatis REST router Fase1 (via Node fetch)
 *
 * Pemakaian (Git Bash):
 *   GAS_EXEC_URL="https://script.google.com/macros/s/<ID>/exec" \
 *   REST_SECRET="<key yang Anda set>" \
 *   node scripts/test-rest.mjs
 *
 * Opsional:
 *   SKIP_WRITE=1  → hanya uji read + guard (TIDAK menulis data apa pun).
 *   Kunci di layar tidak dicetak (ditampilkan ****).
 *
 * Kontrak yang diuji (sesuai doGet/doPost + REST_ROUTE di Code.gs):
 *   read tanpa key            → { ok:true, data }
 *   write tanpa key / key salah → { ok:false }  (403 / fail-closed)
 *   write + key benar         → { ok:true }     (dibuat lalu dihapus)
 */
const EXEC = process.env.GAS_EXEC_URL;
const SECRET = process.env.REST_SECRET || '';
const SKIP_WRITE = process.env.SKIP_WRITE === '1';

if (!EXEC) { console.error('GAS_EXEC_URL belum di-set.'); process.exit(1); }
if (!SECRET) console.warn('Peringatan: REST_SECRET kosong → uji write akan diharapkan ditolak.');

let pass = 0, fail = 0;
function check(nama, kond, info) {
  if (kond) { pass++; console.log('  ✅', nama, info ? '(' + info + ')' : ''); }
  else { fail++; console.log('  ❌', nama, info ? '(' + info + ')' : ''); }
}

async function get(fn) {
  const r = await fetch(EXEC + '?path=' + encodeURIComponent(fn), { redirect: 'follow' });
  return { status: r.status, json: await r.json().catch(() => null) };
}
async function post(fn, args, key) {
  const url = EXEC + '?path=' + encodeURIComponent(fn) + (key ? '&key=' + encodeURIComponent(key) : '');
  const r = await fetch(url, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn: fn, args: args })
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

console.log('== Uji Fase1 REST router ==');
console.log('Exec URL  :', EXEC);
console.log('Secret    :', SECRET ? '****' : '(kosong)');
console.log('SKIP_WRITE:', SKIP_WRITE ? 'ya (tanpa menulis data)' : 'tidak (round-trip write dibuka)');
console.log('');

// 1) read tanpa key
const g = await get('getAvailableYears');
check('read getAvailableYears  → ok:true', g.json && g.json.ok === true,
  'data=' + JSON.stringify(g.json && g.json.data));

// 2) read dashboard (payload berat — buktikan data peta lengkap)
const d = await get('getDashboardData');
check('read getDashboardData   → ok:true', d.json && d.json.ok === true,
  'points=' + (d.json.data && d.json.data.points ? d.json.data.points.length : 0) +
  ' uppkb=' + (d.json.data && d.json.data.uppkbPoints ? d.json.data.uppkbPoints.length : 0));

// 3) write tanpa key → harus ditolak
const w0 = await post('saveRoute', [{ name: 'x', points: [] }], '');
check('write tanpa key         → ditolak (ok:false)', w0.json && w0.json.ok === false,
  'HTTP ' + w0.status + ' · ' + (w0.json && w0.json.error));

// 4) write dengan key salah → harus ditolak
const w1 = await post('saveRoute', [{ name: 'x', points: [] }], 'KEY_SALAH');
check('write key salah         → ditolak (ok:false)', w1.json && w1.json.ok === false,
  'HTTP ' + w1.status + ' · ' + (w1.json && w1.json.error));

// 5) write round-trip dengan key benar (opsional)
if (!SKIP_WRITE) {
  const nm = '__uji_fase1_' + Date.now();
  const w2 = await post('saveRoute', [{
    name: nm, origin_code: 'TEST', dest_code: 'TEST',
    waypoints: [], polyline: [[-6.9, 107.6], [-6.8, 107.5]], color: '#3b82f6'
  }], SECRET);
  check('write key benar         → berhasil (ok:true)', w2.json && w2.json.ok === true,
    (w2.json.data && w2.json.data.id) ? 'id=' + w2.json.data.id : 'HTTP ' + w2.status + ' · ' + (w2.json && w2.json.error));

  if (w2.json && w2.json.ok && w2.json.data && w2.json.data.id) {
    const del = await post('deleteRoute', [w2.json.data.id], SECRET);
    check('delete test route       → berhasil', del.json && del.json.ok === true,
      'HTTP ' + del.status);
  } else {
    check('delete test route       → dilewati (write gagal)', true,
      'Bila ada baris "' + nm + '" di sheet Routes, hapus manual.');
  }
} else {
  console.log('  (SKIP_WRITE=1 → uji write round-trip dilewati)');
}

console.log('');
console.log('Hasil: ' + pass + ' lolos, ' + fail + ' gagal.');
process.exit(fail ? 1 : 0);
