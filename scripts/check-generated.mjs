/* scripts/check-generated.mjs — Drift guard: verifikasi src/* sesuai source Geo12.
 *
 * Tujuan:
 *   Geo12 source → rekonstruksi output yang diharapkan → bandingkan byte-for-byte
 *   dengan Geo12-pages/src/* → PASS (exit 0) jika identik, FAIL (exit 1) jika beda.
 *
 * DILARANG: menulis file, memperbaiki file, menjalankan generator, git operation,
 * network request, mengubah production, mengubah src/*.
 *
 * Logika rekonstruksi DIREPLIKASI dari scripts/split-frontend.mjs (tidak memanggil,
 * tidak me-refactor generator). Jika generator berubah, guard ini harus diselaraskan.
 *
 * Path:
 *   - OUT diambil relatif dari lokasi script ini → guard dapat dijalankan dari repo.
 *   - SRC (Geo12/) berada DI LUAR repo (single source of truth) → absolute path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT = path.join(REPO_ROOT, 'src');
const SRC = 'C:/Users/Pasadena/Documents/GeoTerminal/ProjectDashboard/Geo12';

function read(p) { return fs.readFileSync(p, 'utf8'); }
function readBuf(p) { return fs.readFileSync(p); }

// ---- ekstrak isi di antara tag (identik dengan split-frontend.mjs) ----
function between(file, open, close) {
  const s = read(file);
  const i = s.indexOf(open);
  const j = s.lastIndexOf(close);
  if (i < 0 || j < 0) throw new Error('Delimiter tidak ditemukan di ' + file);
  return s.slice(i + open.length, j);
}

// ---- daftar penggantian: [old, new] (string persis, bukan regex) ----
const RE = [
  // S1 loadRoutes
  ['  google.script.run\n    .withSuccessHandler(function (routes) {',
   '  Backend.getRoutes().then(function (routes) {'],
  ['    .withFailureHandler(function (err) {\n      console.error(\'loadRoutes error:\', err);\n      if (callback) callback();\n    })\n    .getRoutes();',
   '    .catch(function (err) {\n      console.error(\'loadRoutes error:\', err);\n      if (callback) callback();\n    });'],

  // S2 deleteRoute (dalam drawRouteFromData, tanpa failure handler)
  ['            google.script.run\n              .withSuccessHandler(function () {\n                savedRoutesData = savedRoutesData.filter(r => r.id !== rd.id);\n                buatLegenda();\n                map.closePopup();\n              })\n              .deleteRoute(rd.id);',
   '            Backend.deleteRoute(rd.id).then(function () {\n                savedRoutesData = savedRoutesData.filter(r => r.id !== rd.id);\n                buatLegenda();\n                map.closePopup();\n            }).catch(function (err) {\n                console.error(\'deleteRoute error:\', err);\n            });'],

  // S3 muatData
  ['  if (autoExpand === undefined) autoExpand = true;\n  showLoading();\n  google.script.run\n    .withSuccessHandler(function (data) {',
   '  if (autoExpand === undefined) autoExpand = true;\n  showLoading();\n  Backend.getDashboardData(filter).then(function (data) {'],
  ['    .withFailureHandler(function (err) {\n      hideLoading();\n      alert(\'Gagal memuat data. Error: \' + (err && err.message ? err.message : err));\n      console.error(\'getDashboardData error:\', err);\n    })\n    .getDashboardData(filter);',
   '    .catch(function (err) {\n      hideLoading();\n      alert(\'Gagal memuat data. Error: \' + (err && err.message ? err.message : err));\n      console.error(\'getDashboardData error:\', err);\n    });'],

  // S4 jalankanUpdateData
  ['  btn.setAttribute(\'aria-busy\', \'true\');\n  showLoading();\n  google.script.run\n    .withSuccessHandler(function (res) {',
   '  btn.setAttribute(\'aria-busy\', \'true\');\n  showLoading();\n  Backend.sinkronisasiProduksi(tahun).then(function (res) {'],
  ['    .withFailureHandler(function (err) {\n      hideLoading();\n      btn.disabled = false;\n      btn.classList.remove(\'loading\');\n      btn.setAttribute(\'aria-busy\', \'false\');\n      tampilkanNotif(false, \'Error sinkronisasi: \' + (err && err.message ? err.message : err));\n      console.error(\'sinkronisasiProduksi error:\', err);\n    })\n    .sinkronisasiProduksi(tahun);',
   '    .catch(function (err) {\n      hideLoading();\n      btn.disabled = false;\n      btn.classList.remove(\'loading\');\n      btn.setAttribute(\'aria-busy\', \'false\');\n      tampilkanNotif(false, \'Error sinkronisasi: \' + (err && err.message ? err.message : err));\n      console.error(\'sinkronisasiProduksi error:\', err);\n    });'],

  // S5 muatDataMentah
  ['function muatDataMentah() {\n  if (rawDataLoaded) return;\n  showLoading();\n  google.script.run\n    .withSuccessHandler(function (data) {',
   'function muatDataMentah() {\n  if (rawDataLoaded) return;\n  showLoading();\n  Backend.getAllRawData().then(function (data) {'],
  ['    .withFailureHandler(function (err) {\n      hideLoading();\n      alert(\'Gagal memuat data mentah: \' + (err && err.message ? err.message : err));\n    })\n    .getAllRawData();',
   '    .catch(function (err) {\n      hideLoading();\n      alert(\'Gagal memuat data mentah: \' + (err && err.message ? err.message : err));\n    });'],

  // S6 saveCurrentRoute
  ['  };\n  showLoading();\n  google.script.run\n    .withSuccessHandler(function (res) {',
   '  };\n  showLoading();\n  Backend.saveRoute(payload).then(function (res) {'],
  ['    .withFailureHandler(function (err) {\n      hideLoading();\n      alert(\'Error: \' + (err && err.message ? err.message : err));\n    })\n    .saveRoute(payload);',
   '    .catch(function (err) {\n      hideLoading();\n      alert(\'Error: \' + (err && err.message ? err.message : err));\n    });'],

  // S6b saveCurrentRoute (edit: updateRoute / baru: saveRoute, handler variabel)
  ['  showLoading();\n  if (isEdit) {\n    google.script.run.withSuccessHandler(onOk).withFailureHandler(onFail).updateRoute(payload);\n  } else {\n    google.script.run.withSuccessHandler(onOk).withFailureHandler(onFail).saveRoute(payload);\n  }',
   '  showLoading();\n  if (isEdit) {\n    Backend.updateRoute(payload).then(onOk).catch(onFail);\n  } else {\n    Backend.saveRoute(payload).then(onOk).catch(onFail);\n  }'],

  // S7 muatProfileDariServer
  ['function muatProfileDariServer(p) {\n  showLoading();\n  google.script.run\n    .withSuccessHandler(function (detail) {',
   'function muatProfileDariServer(p) {\n  showLoading();\n  Backend.getTerminalDetail(p.kode_terminal).then(function (detail) {'],
  ['    .withFailureHandler(function (err) {\n      hideLoading();\n      alert(\'Gagal memuat profil: \' + (err && err.message ? err.message : err));\n    })\n    .getTerminalDetail(p.kode_terminal);',
   '    .catch(function (err) {\n      hideLoading();\n      alert(\'Gagal memuat profil: \' + (err && err.message ? err.message : err));\n    });'],

  // S8 saveTerminalDetail (indent 4/6, dalam event handler)
  ['    };\n    showLoading();\n    google.script.run\n      .withSuccessHandler(function (res) {',
   '    };\n    showLoading();\n    Backend.saveTerminalDetail(payload).then(function (res) {'],
  ['      .withFailureHandler(function (err) {\n        hideLoading();\n        alert(\'Error: \' + (err.message || err));\n      })\n      .saveTerminalDetail(payload);',
   '      .catch(function (err) {\n        hideLoading();\n        alert(\'Error: \' + (err.message || err));\n      });'],

  // S9 bukaPotret (getPotretRows)
  ['  // Data ini bisa diedit dari dashboard maupun langsung di Google Sheets.\n  google.script.run\n    .withSuccessHandler(function (data) {',
   '  // Data ini bisa diedit dari dashboard maupun langsung di Google Sheets.\n  Backend.getPotretRows(id).then(function (data) {'],
  ['    .withFailureHandler(function (err) { console.error(\'getPotretRows error:\', err); })\n    .getPotretRows(id);',
   '    .catch(function (err) { console.error(\'getPotretRows error:\', err); });'],

  // S10 getPotretBarangMeta (nested, indent 8/10)
  ['        google.script.run\n          .withSuccessHandler(function (meta) {',
   '        Backend.getPotretBarangMeta(new Date().getFullYear()).then(function (meta) {'],
  ['          .withFailureHandler(function (err) { console.error(\'getPotretBarangMeta error:\', err); })\n          .getPotretBarangMeta(new Date().getFullYear());',
   '          .catch(function (err) { console.error(\'getPotretBarangMeta error:\', err); });'],

  // S11 simpanPotret
  ['  if (!bersih.length) { alert(\'Belum ada data untuk disimpan.\'); return; }\n  showLoading();\n  google.script.run\n    .withSuccessHandler(function (res) {',
   '  if (!bersih.length) { alert(\'Belum ada data untuk disimpan.\'); return; }\n  showLoading();\n  Backend.savePotretRows(id, bersih).then(function (res) {'],
  ['    .withFailureHandler(function (err) {\n      hideLoading();\n      tampilkanNotif(false, \'Error: \' + (err && err.message ? err.message : err));\n    })\n    .savePotretRows(id, bersih);',
   '    .catch(function (err) {\n      hideLoading();\n      tampilkanNotif(false, \'Error: \' + (err && err.message ? err.message : err));\n    });'],

  // S12 inisialisasi (DOMContentLoaded)
  ['  setupEventListeners();\n  initMap();\n  loadChoropleth();\n  google.script.run\n    .withSuccessHandler(function (years) {',
   '  setupEventListeners();\n  initMap();\n  loadChoropleth();\n  Backend.getAvailableYears().then(function (years) {'],
  ['    .withFailureHandler(function (err) {\n      alert(\'Gagal inisialisasi: \' + (err && err.message ? err.message : err));\n      hideLoading();\n    })\n    .getAvailableYears();',
   '    .catch(function (err) {\n      alert(\'Gagal inisialisasi: \' + (err && err.message ? err.message : err));\n      hideLoading();\n    });'],
];

// ---- rekonstruksi output yang diharapkan (identik dengan generator) ----
const expected = {};

// 1) style.css
expected['style.css'] = between(SRC + '/CSS.html', '<style>', '</style>').trimStart() + '\n';

// 2) script.js
let js = between(SRC + '/JS.html', '<script>', '</script>').trimStart() + '\n';
let belumKetemu = 0;
for (const [old, nw] of RE) {
  if (js.includes(old)) { js = js.replace(old, nw); }
  else { belumKetemu++; }
}
expected['script.js'] = js;

// 3) index.html
let idx = read(SRC + '/Index.html');
idx = idx.replace("<?!= include('CSS'); ?>", '  <link rel="stylesheet" href="style.css">');
idx = idx.replace("<?!= include('JS'); ?>", '  <script src="config.js"></script>\n  <script src="api.js"></script>\n  <script src="script.js"></script>');
expected['index.html'] = idx;

// ---- byte-for-byte compare ----
const report = [];
let pass = true;

for (const [name, want] of Object.entries(expected)) {
  const actualPath = path.join(OUT, name);
  if (!fs.existsSync(actualPath)) {
    report.push(`  [MISSING] ${name} — tidak ada di ${actualPath}`);
    pass = false;
    continue;
  }
  const wantBuf = Buffer.from(want, 'utf8');
  const haveBuf = readBuf(actualPath);
  if (wantBuf.equals(haveBuf)) {
    report.push(`  [OK]      ${name} (${haveBuf.length} bytes)`);
  } else {
    report.push(`  [DIFF]    ${name} — source menghasilkan ${wantBuf.length} bytes, src aktual ${haveBuf.length} bytes`);
    pass = false;
  }
}

if (belumKetemu > 0) {
  report.push(`  [NOTE]    ${belumKetemu} pola google.script.run tidak ditemukan di source (lihat split-frontend.mjs RE)`);
}

console.log('check-generated — drift guard');
console.log('  SRC : ' + SRC);
console.log('  OUT : ' + OUT);
console.log('---');
console.log(report.join('\n'));
console.log('---');

if (!pass) {
  console.log('FAIL: generated files differ from source.');
  process.exit(1);
}
console.log('PASS: generated files match source.');
process.exit(0);
