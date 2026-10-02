// scripts/test-uppkb-integration.mjs — Automated verification suite for UPPKB / Angkutan Barang Module Integration
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_JSON_PATH = resolve(REPO_ROOT, 'src/data/uppkb-jabar-2025.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_CSS_PATH = resolve(REPO_ROOT, 'v2/command-center.css');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');

const V2_UPPKB_HTML = resolve(REPO_ROOT, 'v2/uppkb/index.html');
const V2_UPPKB_CSS = resolve(REPO_ROOT, 'v2/uppkb/uppkb.css');
const V2_UPPKB_JS = resolve(REPO_ROOT, 'v2/uppkb/uppkb.js');

const SRC_INDEX_PATH = resolve(REPO_ROOT, 'src/command-center/index.html');
const SRC_TERMINAL_PATH = resolve(REPO_ROOT, 'src/command-center/terminal/index.html');
const SRC_TRAYEK_PATH = resolve(REPO_ROOT, 'src/command-center/trayek/index.html');
const SRC_PERINTIS_PATH = resolve(REPO_ROOT, 'src/command-center/perintis/index.html');

const SRC_UPPKB_HTML = resolve(REPO_ROOT, 'src/command-center/uppkb/index.html');
const SRC_UPPKB_CSS = resolve(REPO_ROOT, 'src/command-center/uppkb/uppkb.css');
const SRC_UPPKB_JS = resolve(REPO_ROOT, 'src/command-center/uppkb/uppkb.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul UPPKB / Barang');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_UPPKB_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/uppkb/uppkb.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_UPPKB_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/uppkb/uppkb.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: Source / Target Parity (v2/uppkb vs src/command-center/uppkb)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: 100% Parity between v2/uppkb and src/command-center/uppkb ---');
{
  const files = [
    ['index.html', V2_UPPKB_HTML, SRC_UPPKB_HTML],
    ['uppkb.css', V2_UPPKB_CSS, SRC_UPPKB_CSS],
    ['uppkb.js', V2_UPPKB_JS, SRC_UPPKB_JS]
  ];

  files.forEach(([name, p1, p2], idx) => {
    assert(`Test 2.${idx + 1}a: ${name} exists in both locations`, existsSync(p1) && existsSync(p2));
    const b1 = readFileSync(p1);
    const b2 = readFileSync(p2);
    assert(`Test 2.${idx + 1}b: ${name} 100% byte-for-byte parity (${b1.length} bytes)`, b1.equals(b2));
  });
}

// -----------------------------------------------------------------------------
// Test 3: Dataset Integrity & Verified Stations
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Dataset Integrity & Factual Master Stations ---');
{
  assert('Test 3.1: uppkb-jabar-2025.json exists', existsSync(DATA_JSON_PATH));
  const rawData = JSON.parse(readFileSync(DATA_JSON_PATH, 'utf8'));

  assert('Test 3.2: Contains exactly 6 UPPKB facilities',
    rawData.total_fasilitas === 6 && rawData.stations.length === 6,
    `stations count: ${rawData.stations.length}`);

  const expectedStations = [
    { kode: 'JT001', nama: 'Balonggandu', lat: -6.37733, lng: 107.51488, kab: 'Kabupaten Karawang' },
    { kode: 'JT002', nama: 'Losarang', lat: -6.38535, lng: 108.14003, kab: 'Kabupaten Indramayu' },
    { kode: 'JT003', nama: 'Gentong', lat: -7.11956, lng: 108.13575, kab: 'Kabupaten Tasikmalaya' },
    { kode: 'JT004', nama: 'Cibaragalan', lat: -6.50387, lng: 107.46548, kab: 'Kabupaten Purwakarta' },
    { kode: 'JT005', nama: 'Tomo', lat: -6.76096, lng: 108.14228, kab: 'Kabupaten Sumedang' },
    { kode: 'JT006', nama: 'Kemang', lat: -6.51892, lng: 106.75827, kab: 'Kabupaten Bogor' }
  ];

  let totalDiperiksa = 0;
  let totalPelanggaran = 0;

  expectedStations.forEach((exp, idx) => {
    const st = rawData.stations.find(s => s.kode === exp.kode);
    assert(`Test 3.3.${idx + 1}: Station ${exp.kode} (${exp.nama}) found with verified coordinates and kabupaten`,
      st &&
      st.nama === exp.nama &&
      Math.abs(st.lat - exp.lat) < 0.0001 &&
      Math.abs(st.lng - exp.lng) < 0.0001 &&
      st.kabupaten === exp.kab);

    if (st) {
      totalDiperiksa += st.diperiksa_2025;
      totalPelanggaran += st.pelanggaran_2025;
      assert(`Test 3.3.${idx + 1}b: Station ${exp.kode} has 12 monthly records`,
        Array.isArray(st.monthly) && st.monthly.length === 12);
    }
  });

  assert('Test 3.4: Total kendaraan diperiksa 2025 is exactly 194.392',
    totalDiperiksa === 194392 && rawData.summary.total_diperiksa_2025 === 194392,
    `${totalDiperiksa}`);

  assert('Test 3.5: Total penindakan 2025 is 15.898',
    rawData.summary.total_penindakan_2025 === 15898);

  assert('Test 3.6: Tingkat kepatuhan is 91,8%',
    rawData.summary.tingkat_kepatuhan === 0.918);
}

// -----------------------------------------------------------------------------
// Test 4: Dashboard V2 Navigation & Integration
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Dashboard V2 Navigation Integration ---');
{
  const v2Html = readFileSync(V2_INDEX_PATH, 'utf8');

  // Quick Access
  assert('Test 4.1: Quick access button is an active <a> tag to ./uppkb/',
    v2Html.includes('<a href="./uppkb/" class="quick-btn" data-nav-status="available"'));

  // Sidebar in v2/index.html
  assert('Test 4.2: Sidebar link in v2/index.html is active <a> to ./uppkb/',
    v2Html.includes('<a href="./uppkb/" class="nav-link" data-nav-status="available"'));

  // Sidebar in terminal/index.html
  const termHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.3: Sidebar link in terminal/index.html is active <a> to ../uppkb/',
    termHtml.includes('<a href="../uppkb/" class="nav-link" data-nav-status="available"'));

  // Sidebar in trayek/index.html
  const trayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.4: Sidebar link in trayek/index.html is active <a> to ../uppkb/',
    trayekHtml.includes('<a href="../uppkb/" class="nav-link" data-nav-status="available"'));

  // Sidebar in perintis/index.html
  const perintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.5: Sidebar link in perintis/index.html is active <a> to ../uppkb/',
    perintisHtml.includes('<a href="../uppkb/" class="nav-link" data-nav-status="available"'));

  // Parity checks for src/command-center
  const srcIndexHtml = readFileSync(SRC_INDEX_PATH, 'utf8');
  assert('Test 4.6: src/command-center/index.html has active quick access link',
    srcIndexHtml.includes('<a href="./uppkb/" class="quick-btn" data-nav-status="available"'));
  assert('Test 4.7: src/command-center/index.html has active sidebar link',
    srcIndexHtml.includes('<a href="./uppkb/" class="nav-link" data-nav-status="available"'));
}

// -----------------------------------------------------------------------------
// Test 5: Standalone UPPKB Module Elements & ARIA
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Standalone UPPKB Module Markup & ARIA ---');
{
  const uHtml = readFileSync(V2_UPPKB_HTML, 'utf8');

  assert('Test 5.1: App shell with active sidebar link for UPPKB / Barang',
    uHtml.includes('<a href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"'));

  assert('Test 5.2: Header clock and data status pill present',
    uHtml.includes('id="current-date"') && uHtml.includes('id="current-time"') && uHtml.includes('Data Terverifikasi BPTD'));

  assert('Test 5.3: 4 KPI cards present in module',
    uHtml.includes('id="kpiTotalStations"') &&
    uHtml.includes('id="kpiTotalDiperiksa"') &&
    uHtml.includes('id="kpiTotalPenindakan"') &&
    uHtml.includes('id="kpiAvgKepatuhan"'));

  assert('Test 5.4: Map container #uppkbMap and legend present',
    uHtml.includes('id="uppkbMap"') && uHtml.includes('class="uppkb-legend-bar"'));

  assert('Test 5.5: Search and filter controls present',
    uHtml.includes('id="searchUppkb"') &&
    uHtml.includes('id="filterWilayah"') &&
    uHtml.includes('id="filterIntensitas"'));

  assert('Test 5.6: Facility grid container #uppkbGrid present',
    uHtml.includes('id="uppkbGrid"'));

  assert('Test 5.7: Detailed modal dialog #uppkbModal with WAI-ARIA attributes',
    uHtml.includes('id="uppkbModal"') &&
    uHtml.includes('role="dialog"') &&
    uHtml.includes('aria-modal="true"'));

  assert('Test 5.8: Monthly table container and tbody #modalMonthlyBody present',
    uHtml.includes('id="modalMonthlyBody"') && uHtml.includes('class="monthly-table"'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Update
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Registry Documentation ---');
{
  const contract = readFileSync(DOCS_CONTRACT_PATH, 'utf8');
  assert('Test 6.1: Contract documents INTEGRATED & VERIFIED for UPPKB',
    contract.includes('| **UPPKB & Angkutan Barang** | `INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2025)` |'));
  assert('Test 6.2: Contract documents 6 fasilitas penimbangan UPPKB',
    contract.includes('Dataset resmi 6 fasilitas penimbangan UPPKB') &&
    contract.includes('JT001 Balonggandu'));
  assert('Test 6.3: Contract documents 194.392 kendaraan diperiksa and 91,8% kepatuhan',
    contract.includes('194.392 kendaraan diperiksa YTD') && contract.includes('91,8% rata-rata kepatuhan tonase'));
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
      console.log(`  [NOTE] Local preview server on port 8080 error (${err.message}). Skipping HTTP check.`);
      resolveTest();
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log('  [NOTE] HTTP check timed out. Skipping HTTP check.');
      resolveTest();
    });
  });
}

await checkHttp('/command-center/', (body) => {
  assert('Test 7.1: Overview page contains active UPPKB Quick Access link',
    body.includes('<a href="./uppkb/" class="quick-btn"'));
}, 'Test 7.1: HTTP /command-center/');

await checkHttp('/command-center/uppkb/', (body) => {
  assert('Test 7.2: UPPKB page contains uppkbMap container',
    body.includes('id="uppkbMap"'));
  assert('Test 7.3: UPPKB page contains uppkbGrid',
    body.includes('id="uppkbGrid"'));
}, 'Test 7.2-7.3: HTTP /command-center/uppkb/');

await checkHttp('/command-center/uppkb/uppkb.css', (body) => {
  assert('Test 7.4: uppkb.css contains .uppkb-map-container',
    body.includes('.uppkb-map-container'));
}, 'Test 7.4: HTTP /command-center/uppkb/uppkb.css');

await checkHttp('/command-center/uppkb/uppkb.js', (body) => {
  assert('Test 7.5: uppkb.js contains UPPKB_EMBEDDED_DATA',
    body.includes('UPPKB_EMBEDDED_DATA'));
}, 'Test 7.5: HTTP /command-center/uppkb/uppkb.js');

console.log('\n================================================================================');
console.log(`VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
console.log('================================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
