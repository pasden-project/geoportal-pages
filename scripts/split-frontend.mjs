/* scripts/split-frontend.mjs — Fase4: pisah file Apps Script menjadi aset statik.
 *
 * Membaca (READ-ONLY) file asli di folder Geo12, lalu MENULIS ke Geo12-pages/src/:
 *   Geo12/CSS.html  → src/style.css   (buang tag <style>)
 *   Geo12/JS.html   → src/script.js   (buang tag <script> + ganti 12 panggilan
 *                                      google.script.run menjadi Backend.*() Promise)
 *   Geo12/Index.html→ src/index.html  (ganti include('CSS')/include('JS') → link/script)
 *
 * AMAN dijalankan ulang: selalu mulai dari sumber Geo12 (tidak pernah menyentuhnya).
 * Catatan: file asli Geo12 TIDAK diubah. Adapter transport ada di src/api.js.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Cross-platform: resolusi path relatif terhadap lokasi script ini
// (Geo12-pages/scripts/), bukan current working directory dan bukan absolute path perangkat.
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', '..', 'Geo12');
const OUT = resolve(__dirname, '..', 'src', 'maps');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s); }

// ---- ekstrak isi di antara tag ----
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

// ---- 1) style.css ----
let css = between(SRC + '/CSS.html', '<style>', '</style>').trimStart() + '\n';
css = css.replace("font-family: 'Plus Jakarta Sans', sans-serif;", "font-family: 'Poppins', 'Plus Jakarta Sans', sans-serif;");
css = css.replace('font-family: "Plus Jakarta Sans", sans-serif;', "font-family: 'Poppins', 'Plus Jakarta Sans', sans-serif;");
css = css.replace('.side-menu {\n    background: #fff;\n    width: 280px;\n    height: 100%;', '.side-menu {\n    background: #fff;\n    width: 280px;\n    height: 100%;\n    font-family: \'Poppins\', \'Plus Jakarta Sans\', sans-serif;');
if (!css.includes('.nav-cc-btn')) {
  css += `
  /* ===== Tombol Shortcut "Command Center" (topbar) ===== */
  .nav-cc-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--navy);
    color: #fff;
    text-decoration: none;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    padding: 0 14px;
    height: 42px;
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
    cursor: pointer;
    flex-shrink: 0;
    white-space: nowrap;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .nav-cc-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.35);
    color: #fff;
  }
  [data-theme="dark"] .nav-cc-btn {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.25);
    color: #f8fafc;
  }
  @media (max-width: 520px) {
    .nav-cc-btn span { display: none; }
    .nav-cc-btn { padding: 0 12px; }
  }
`;
}
write(OUT + '/style.css', css);
console.log('style.css  :', fs.statSync(OUT + '/style.css').size, 'bytes');
// ---- 2) script.js (ekstrak + ganti 12 panggilan) ----
let js = between(SRC + '/JS.html', '<script>', '</script>').trimStart() + '\n';
let belumKetemu = 0;
for (const [old, nw] of RE) {
  if (js.includes(old)) { js = js.replace(old, nw); }
  else { belumKetemu++; console.error('  !! pola tidak ditemukan:', JSON.stringify(old.slice(0, 60)) + '...'); }
}
write(OUT + '/script.js', js);
console.log('script.js  :', fs.statSync(OUT + '/script.js').size, 'bytes | pola gagal: ' + belumKetemu + ' | sisa google.script.run: ' + (js.match(/google\.script\.run/g) || []).length + ' | Backend.*: ' + (js.match(/Backend\./g) || []).length);

// ---- 3) index.html ----
let idx = read(SRC + '/Index.html');
idx = idx.replace("<?!= include('CSS'); ?>", '  <link rel="stylesheet" href="style.css">');
idx = idx.replace("<?!= include('JS'); ?>", '  <script src="config.js"></script>\n  <script src="api.js"></script>\n  <script src="script.js"></script>');
if (!idx.includes('brand-shortcut')) {
  const brandLogo = `    <a href="/" class="brand-shortcut" title="Kembali ke Command Center" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;">
      <span class="brand__mark" style="display:inline-flex;align-items:center;gap:4px;padding:3px 6px;background:rgba(255,255,255,0.92);border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <img src="/assets/logo-kemenhub.svg" alt="Logo Kemenhub" style="height:22px;width:auto;" />
        <img src="/assets/logo-hubdat.png" alt="Logo Ditjen Hubdat" style="height:22px;width:auto;" />
      </span>
    </a>\n`;
  idx = idx.replace('<div class="title-block">', brandLogo + '    <div class="title-block">');
}
if (!idx.includes('btnCommandCenter')) {
  const ccBtn = `    <a href="/" id="btnCommandCenter" class="nav-cc-btn" aria-label="Command Center" title="Buka Command Center">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
      <span>Command Center</span>
    </a>\n`;
  idx = idx.replace('<span id="lastUpdateValue"', ccBtn + '    <span id="lastUpdateValue"');
}
if (!idx.includes('Command Center</span></a>')) {
  const sideCc = `        <!-- Command Center Shortcut -->
        <li class="menu-item" onclick="window.location.href='/'" style="cursor:pointer;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:10px;margin-bottom:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect></svg>
          <a href="/" style="text-decoration:none;color:inherit;font-weight:700;"><span>Command Center</span></a>
        </li>\n`;
  idx = idx.replace('<ul class="menu-list">', '<ul class="menu-list">\n' + sideCc);
}
write(OUT + '/index.html', idx);
console.log('index.html :', fs.statSync(OUT + '/index.html').size, 'bytes');
console.log('Selesai. Verifikasi lanjut: node --check script.js + grep.');
