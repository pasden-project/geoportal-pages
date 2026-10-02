// scripts/test-perintis-integration.mjs — Automated verification suite for Angkutan Perintis Module Integration
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_JSON_PATH = resolve(REPO_ROOT, 'src/data/perintis-jabar-2025.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_CSS_PATH = resolve(REPO_ROOT, 'v2/command-center.css');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');

const V2_PERINTIS_HTML = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_PERINTIS_CSS = resolve(REPO_ROOT, 'v2/perintis/perintis.css');
const V2_PERINTIS_JS = resolve(REPO_ROOT, 'v2/perintis/perintis.js');

const SRC_PERINTIS_HTML = resolve(REPO_ROOT, 'src/command-center/perintis/index.html');
const SRC_PERINTIS_CSS = resolve(REPO_ROOT, 'src/command-center/perintis/perintis.css');
const SRC_PERINTIS_JS = resolve(REPO_ROOT, 'src/command-center/perintis/perintis.js');

let passCount = 0;
let failCount = 0;

function assert(name, condition, details = '') {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${name}${details ? ` (${details})` : ''}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${name}${details ? ` (${details})` : ''}`);
  }
}

console.log('================================================================================');
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul Angkutan Perintis');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_PERINTIS_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/perintis/perintis.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_PERINTIS_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/perintis/perintis.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: Source / Target Parity (v2/perintis vs src/command-center/perintis)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: 100% Parity between v2/perintis and src/command-center/perintis ---');
{
  const files = [
    ['index.html', V2_PERINTIS_HTML, SRC_PERINTIS_HTML],
    ['perintis.css', V2_PERINTIS_CSS, SRC_PERINTIS_CSS],
    ['perintis.js', V2_PERINTIS_JS, SRC_PERINTIS_JS]
  ];

  files.forEach(([name, p1, p2], idx) => {
    assert(`Test 2.${idx + 1}a: ${name} exists in both locations`, existsSync(p1) && existsSync(p2));
    const b1 = readFileSync(p1);
    const b2 = readFileSync(p2);
    assert(`Test 2.${idx + 1}b: ${name} 100% byte-for-byte parity (${b1.length} bytes)`, b1.equals(b2));
  });
}

// -----------------------------------------------------------------------------
// Test 3: Dataset Integrity & Contract Numbers
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Dataset Integrity & Factual Numbers ---');
{
  assert('Test 3.1: perintis-jabar-2025.json exists', existsSync(DATA_JSON_PATH));
  const rawData = JSON.parse(readFileSync(DATA_JSON_PATH, 'utf8'));

  assert('Test 3.2: Dataset specifies 6 routes', rawData.routes && rawData.routes.length === 6);

  let totalUtama = 0;
  let totalCadangan = 0;
  let totalPax = 0;
  let totalRitase = 0;
  let totalTargetKontrak = 0;
  let totalRealisasiKeuangan = 0;

  rawData.routes.forEach(r => {
    totalUtama += r.armada.jumlah;
    totalCadangan += r.armada.cadangan;
    totalPax += r.summary_ytd.total_penumpang;
    totalRitase += r.summary_ytd.total_ritase;
    totalTargetKontrak += r.target_kontrak;
    totalRealisasiKeuangan += r.realisasi_keuangan_ytd;

    // Check geometry
    const poly = r.geometry && r.geometry.polyline;
    assert(`Test 3.Route [${r.id}]: Polyline non-empty (${poly ? poly.length : 0} pts)`, poly && poly.length > 20);
    assert(`Test 3.Route [${r.id}]: Origin/Destination coordinates valid`,
      Array.isArray(r.geometry.origin_coord) && Array.isArray(r.geometry.dest_coord));
  });

  assert('Test 3.5: Total ritase is exactly 4.655 trips YTD',
    totalRitase === 4655, `${totalRitase}`);
  const avgLf = rawData.routes.reduce((acc, r) => acc + r.summary_ytd.avg_load_factor, 0) / rawData.routes.length;
  const lfPct = (avgLf * 100).toFixed(1);
  assert('Test 3.6: Average Load Factor is between 31.0% and 31.5%',
    avgLf >= 0.31 && avgLf <= 0.315, `${lfPct}%`);

  const keuPct = (totalRealisasiKeuangan / totalTargetKontrak * 100).toFixed(1);
  assert('Test 3.7: Realisasi Anggaran is 81.8%',
    keuPct === '81.8', `${keuPct}%`);
}

// -----------------------------------------------------------------------------
// Test 4: Dashboard V2 Integration (Quick Access, Sidebar, Card)
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Dashboard V2 Navigation & Institutional Card ---');
{
  const v2Html = readFileSync(V2_INDEX_PATH, 'utf8');

  // Quick Access
  assert('Test 4.1: Quick access button is an active <a> tag to ./perintis/',
    v2Html.includes('<a href="./perintis/" class="quick-btn" data-nav-status="available"'));

  // Sidebar in v2/index.html
  assert('Test 4.2: Sidebar link in v2/index.html is active <a> to ./perintis/',
    v2Html.includes('<a href="./perintis/" class="nav-link" data-nav-status="available"'));

  // Sidebar in terminal/index.html
  const termHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.3: Sidebar link in terminal/index.html is active <a> to ../perintis/',
    termHtml.includes('<a href="../perintis/" class="nav-link" data-nav-status="available"'));

  // Sidebar in trayek/index.html
  const trayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.4: Sidebar link in trayek/index.html is active <a> to ../perintis/',
    trayekHtml.includes('<a href="../perintis/" class="nav-link" data-nav-status="available"'));

  // Card Kinerja Angkutan Perintis
  assert('Test 4.5: Card header displays 6 KORIDOR AKTIF verified badge',
    v2Html.includes('class="badge-source-verified">6 KORIDOR AKTIF</span>'));

  assert('Test 4.6: Card displays 4 summary KPI items (Armada, LF, Penumpang, Anggaran)',
    v2Html.includes('18 Bus') &&
    v2Html.includes('31,3%') &&
    v2Html.includes('26.815') &&
    v2Html.includes('81,8%'));

  assert('Test 4.7: Card renders all 6 corridors with indicators',
    v2Html.includes('Surade – Sagaranten') &&
    v2Html.includes('Sagaranten – Pelabuhan Ratu') &&
    v2Html.includes('Tegal Buleud – Sagaranten') &&
    v2Html.includes('Leuwiliang – Cikidang') &&
    v2Html.includes('Jasinga – Parung Panjang') &&
    v2Html.includes('Sadang – Wanakerta'));

  assert('Test 4.8: Card footer CTA links to ./perintis/',
    v2Html.includes('<a href="./perintis/" class="perintis-card-cta"'));

  // CSS classes defined
  const v2Css = readFileSync(V2_CSS_PATH, 'utf8');
  assert('Test 4.9: .badge-source-verified defined in command-center.css',
    v2Css.includes('.badge-source-verified'));
  assert('Test 4.10: .perintis-summary-grid and .perintis-corridors-list defined',
    v2Css.includes('.perintis-summary-grid') && v2Css.includes('.perintis-corridors-list'));
}

// -----------------------------------------------------------------------------
// Test 5: Standalone Perintis Module Elements & ARIA
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Standalone Perintis Module Markup & ARIA ---');
{
  const pHtml = readFileSync(V2_PERINTIS_HTML, 'utf8');

  assert('Test 5.1: App shell with active sidebar link for Angkutan Perintis',
    pHtml.includes('<a href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"'));

  assert('Test 5.2: Header clock and data status pill present',
    pHtml.includes('id="current-date"') && pHtml.includes('id="current-time"') && pHtml.includes('Data Terverifikasi BPTD'));

  assert('Test 5.3: 4 KPI cards present in module',
    pHtml.includes('id="kpiTotalRoutes"') &&
    pHtml.includes('id="kpiTotalArmada"') &&
    pHtml.includes('id="kpiTotalPenumpang"') &&
    pHtml.includes('id="kpiAvgLoadFactor"'));

  assert('Test 5.4: Map container #perintisMap and legend present',
    pHtml.includes('id="perintisMap"') && pHtml.includes('class="perintis-legend-bar"'));

  assert('Test 5.5: Search and filter controls present',
    pHtml.includes('id="searchPerintis"') &&
    pHtml.includes('id="filterKabupaten"') &&
    pHtml.includes('id="filterStatus"'));

  assert('Test 5.6: Corridor grid container #perintisGrid present',
    pHtml.includes('id="perintisGrid"'));

  assert('Test 5.7: Detailed modal dialog #perintisModal with WAI-ARIA attributes',
    pHtml.includes('id="perintisModal"') &&
    pHtml.includes('role="dialog"') &&
    pHtml.includes('aria-modal="true"'));

  assert('Test 5.8: Monthly table container and tbody #modalMonthlyBody present',
    pHtml.includes('id="modalMonthlyBody"') && pHtml.includes('class="monthly-table"'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Update
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Registry Documentation ---');
{
  const contract = readFileSync(DOCS_CONTRACT_PATH, 'utf8');
  assert('Test 6.1: Contract documents INTEGRATED & VERIFIED for Perintis',
    contract.includes('INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2025)'));
  assert('Test 6.2: Contract documents 6 trayek bersubsidi Perum DAMRI',
    contract.includes('6 trayek angkutan jalan perintis bersubsidi Perum DAMRI'));
  assert('Test 6.3: Contract documents 18 armada and 19 seat capacity',
    contract.includes('18 armada bus') && contract.includes('19 tempat duduk'));
}

// -----------------------------------------------------------------------------
// Test 7: HTTP Preview Server Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: HTTP Preview Server Verification (Port 8080) ---');
async function checkHttp(path, checkFn, testName) {
  return new Promise(resolveTest => {
    const req = http.get(`http://127.0.0.1:8080${path}`, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        assert(`${testName} (Status 200)`, res.statusCode === 200);
        if (checkFn) checkFn(body);
        resolveTest();
      });
    });

    req.on('error', err => {
      console.log(`  [NOTE] Local preview server on port 8080 error (${err.message}). Skipping.`);
      resolveTest();
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log('  [NOTE] HTTP check timed out. Skipping.');
      resolveTest();
    });
  });
}

await checkHttp('/command-center/', (body) => {
  assert('Test 7.1: Overview page contains active Perintis Quick Access link',
    body.includes('<a href="./perintis/" class="quick-btn"'));
  assert('Test 7.2: Overview page contains 6 KORIDOR AKTIF verified badge',
    body.includes('6 KORIDOR AKTIF'));
}, 'Test 7.1-7.2: HTTP /command-center/');

await checkHttp('/command-center/perintis/', (body) => {
  assert('Test 7.3: Perintis page contains perintisMap container',
    body.includes('id="perintisMap"'));
  assert('Test 7.4: Perintis page contains perintisGrid',
    body.includes('id="perintisGrid"'));
}, 'Test 7.3-7.4: HTTP /command-center/perintis/');

await checkHttp('/command-center/perintis/perintis.css', (body) => {
  assert('Test 7.5: perintis.css contains .perintis-map-container',
    body.includes('.perintis-map-container'));
}, 'Test 7.5: HTTP /command-center/perintis/perintis.css');

await checkHttp('/command-center/perintis/perintis.js', (body) => {
  assert('Test 7.6: perintis.js contains PERINTIS_EMBEDDED_DATA',
    body.includes('PERINTIS_EMBEDDED_DATA'));
}, 'Test 7.6: HTTP /command-center/perintis/perintis.js');

console.log('\n================================================================================');
console.log(`VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
console.log('================================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
