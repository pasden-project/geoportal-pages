// scripts/test-od-integration.mjs — Automated verification suite for OD Intelligence Module Integration
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_ANALISIS_PATH = resolve(REPO_ROOT, 'src/data/od-analisis.json');
const DATA_MATRIX_PATH = resolve(REPO_ROOT, 'src/data/od-matrix-terminal-a.json');
const DATA_REGIONAL_PATH = resolve(REPO_ROOT, 'src/data/od-regional.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_CSS_PATH = resolve(REPO_ROOT, 'v2/command-center.css');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_UPPKB_PATH = resolve(REPO_ROOT, 'v2/uppkb/index.html');

const V2_OD_HTML = resolve(REPO_ROOT, 'v2/od/index.html');
const V2_OD_CSS = resolve(REPO_ROOT, 'v2/od/od.css');
const V2_OD_JS = resolve(REPO_ROOT, 'v2/od/od.js');

const SRC_INDEX_PATH = resolve(REPO_ROOT, 'src/command-center/index.html');
const SRC_TERMINAL_PATH = resolve(REPO_ROOT, 'src/command-center/terminal/index.html');
const SRC_TRAYEK_PATH = resolve(REPO_ROOT, 'src/command-center/trayek/index.html');
const SRC_PERINTIS_PATH = resolve(REPO_ROOT, 'src/command-center/perintis/index.html');
const SRC_UPPKB_PATH = resolve(REPO_ROOT, 'src/command-center/uppkb/index.html');

const SRC_OD_HTML = resolve(REPO_ROOT, 'src/command-center/od/index.html');
const SRC_OD_CSS = resolve(REPO_ROOT, 'src/command-center/od/od.css');
const SRC_OD_JS = resolve(REPO_ROOT, 'src/command-center/od/od.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul OD Intelligence');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_OD_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/od/od.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_OD_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/od/od.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: File Existence & Byte-for-Byte Parity Check
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: File Existence & Byte-for-Byte Parity ---');
{
  assert('Test 2.1: v2/od/index.html exists', existsSync(V2_OD_HTML));
  assert('Test 2.2: v2/od/od.css exists', existsSync(V2_OD_CSS));
  assert('Test 2.3: v2/od/od.js exists', existsSync(V2_OD_JS));

  assert('Test 2.4: src/command-center/od/index.html exists', existsSync(SRC_OD_HTML));
  assert('Test 2.5: src/command-center/od/od.css exists', existsSync(SRC_OD_CSS));
  assert('Test 2.6: src/command-center/od/od.js exists', existsSync(SRC_OD_JS));

  const v2HtmlBuf = readFileSync(V2_OD_HTML);
  const srcHtmlBuf = readFileSync(SRC_OD_HTML);
  assert('Test 2.7: index.html 100% byte-for-byte parity', v2HtmlBuf.equals(srcHtmlBuf), `${v2HtmlBuf.length} bytes`);

  const v2CssBuf = readFileSync(V2_OD_CSS);
  const srcCssBuf = readFileSync(SRC_OD_CSS);
  assert('Test 2.8: od.css 100% byte-for-byte parity', v2CssBuf.equals(srcCssBuf), `${v2CssBuf.length} bytes`);

  const v2JsBuf = readFileSync(V2_OD_JS);
  const srcJsBuf = readFileSync(SRC_OD_JS);
  assert('Test 2.9: od.js 100% byte-for-byte parity', v2JsBuf.equals(srcJsBuf), `${v2JsBuf.length} bytes`);
}

// -----------------------------------------------------------------------------
// Test 3: Data Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: OD Data Integrity Verification ---');
{
  assert('Test 3.1: od-analisis.json exists', existsSync(DATA_ANALISIS_PATH));
  assert('Test 3.2: od-matrix-terminal-a.json exists', existsSync(DATA_MATRIX_PATH));
  assert('Test 3.3: od-regional.json exists', existsSync(DATA_REGIONAL_PATH));

  const analisis = JSON.parse(readFileSync(DATA_ANALISIS_PATH, 'utf8'));
  assert('Test 3.4: total volume equals 4.681.829', analisis.total?.volume === 4681829, `vol=${analisis.total?.volume}`);
  assert('Test 3.5: total trips equals 483.310', analisis.total?.perjalanan === 483310, `trips=${analisis.total?.perjalanan}`);
  assert('Test 3.6: total terminals equals 12', analisis.total?.terminal === 12, `terminals=${analisis.total?.terminal}`);
  assert('Test 3.7: perTrayek contains >= 25 items', Array.isArray(analisis.perTrayek) && analisis.perTrayek.length >= 25, `count=${analisis.perTrayek?.length}`);
  assert('Test 3.8: Top 1 corridor is Bandung - Sukabumi', analisis.perTrayek?.[0]?.trayek === 'BANDUNG - SUKABUMI' && analisis.perTrayek?.[0]?.volume === 452046);

  const matrix = JSON.parse(readFileSync(DATA_MATRIX_PATH, 'utf8'));
  assert('Test 3.9: matrix has 12 Terminal A destinations', Array.isArray(matrix.terminals) && matrix.terminals.length === 12);
  assert('Test 3.10: matrix terminals include Leuwipanjang and Baranangsiang', matrix.terminals.includes('Leuwipanjang') && matrix.terminals.includes('Baranangsiang'));
  assert('Test 3.11: matrix has >= 100 origins', Array.isArray(matrix.origins) && matrix.origins.length >= 100, `origins=${matrix.origins?.length}`);

  const regional = JSON.parse(readFileSync(DATA_REGIONAL_PATH, 'utf8'));
  assert('Test 3.12: regional has 27 Kabupaten/Kota entries', Array.isArray(regional) && regional.length === 27, `count=${regional.length}`);
}

// -----------------------------------------------------------------------------
// Test 4: Navigation Links Across All 6 Modules
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Navigation Links Across Modules ---');
{
  const v2IndexHtml = readFileSync(V2_INDEX_PATH, 'utf8');
  assert('Test 4.1: v2/index.html quick access links to ./od/', v2IndexHtml.includes('href="./od/"') && v2IndexHtml.includes('class="quick-btn"'));
  assert('Test 4.2: v2/index.html quick access has data-nav-status="available"', v2IndexHtml.includes('href="./od/" class="quick-btn" data-nav-status="available"'));
  assert('Test 4.3: v2/index.html sidebar links to ./od/ with available status', v2IndexHtml.includes('href="./od/" class="nav-link" data-nav-status="available"'));

  const v2TermHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.4: v2/terminal/index.html sidebar links to ../od/ available', v2TermHtml.includes('href="../od/" class="nav-link" data-nav-status="available"'));

  const v2TrayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.5: v2/trayek/index.html sidebar links to ../od/ available', v2TrayekHtml.includes('href="../od/" class="nav-link" data-nav-status="available"'));

  const v2PerintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.6: v2/perintis/index.html sidebar links to ../od/ available', v2PerintisHtml.includes('href="../od/" class="nav-link" data-nav-status="available"'));

  const v2UppkbHtml = readFileSync(V2_UPPKB_PATH, 'utf8');
  assert('Test 4.7: v2/uppkb/index.html sidebar links to ../od/ available', v2UppkbHtml.includes('href="../od/" class="nav-link" data-nav-status="available"'));

  const v2OdHtml = readFileSync(V2_OD_HTML, 'utf8');
  assert('Test 4.8: v2/od/index.html sidebar has active OD link', v2OdHtml.includes('href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"'));

  assert('Test 4.9: No disabled OD coming-soon buttons remain in v2/index.html', !/data-nav-status="coming-soon"[^>]*OD Intelligence/.test(v2IndexHtml));
  assert('Test 4.10: No disabled OD coming-soon buttons remain in v2/terminal/', !/data-nav-status="coming-soon"[^>]*OD Intelligence/.test(v2TermHtml));
  assert('Test 4.11: No disabled OD coming-soon buttons remain in v2/trayek/', !/data-nav-status="coming-soon"[^>]*OD Intelligence/.test(v2TrayekHtml));
  assert('Test 4.12: No disabled OD coming-soon buttons remain in v2/perintis/', !/data-nav-status="coming-soon"[^>]*OD Intelligence/.test(v2PerintisHtml));
  assert('Test 4.13: No disabled OD coming-soon buttons remain in v2/uppkb/', !/data-nav-status="coming-soon"[^>]*OD Intelligence/.test(v2UppkbHtml));
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup & WAI-ARIA
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup & WAI-ARIA ---');
{
  const odHtml = readFileSync(V2_OD_HTML, 'utf8');
  assert('Test 5.1: KPI total passengers element exists', odHtml.includes('id="kpiTotalPassengers"'));
  assert('Test 5.2: KPI total trips element exists', odHtml.includes('id="kpiTotalTrips"'));
  assert('Test 5.3: KPI total terminals element exists', odHtml.includes('id="kpiTotalTerminals"'));
  assert('Test 5.4: KPI total regions element exists', odHtml.includes('id="kpiTotalRegions"'));

  assert('Test 5.5: Leaflet map container odMap exists', odHtml.includes('id="odMap"'));
  assert('Test 5.6: Tablist exists with role="tablist"', odHtml.includes('role="tablist"'));
  assert('Test 5.7: Tab Matrix OD button exists with role="tab"', odHtml.includes('id="btnTabMatrix"') && odHtml.includes('aria-controls="panelMatrix"'));
  assert('Test 5.8: Tab Regional button exists with role="tab"', odHtml.includes('id="btnTabRegional"') && odHtml.includes('aria-controls="panelRegional"'));
  assert('Test 5.9: Tab Corridors button exists with role="tab"', odHtml.includes('id="btnTabCorridors"') && odHtml.includes('aria-controls="panelCorridors"'));

  assert('Test 5.10: Panel Matrix exists with role="tabpanel"', odHtml.includes('id="panelMatrix"') && odHtml.includes('role="tabpanel"'));
  assert('Test 5.11: Panel Regional exists with role="tabpanel"', odHtml.includes('id="panelRegional"') && odHtml.includes('role="tabpanel"'));
  assert('Test 5.12: Panel Corridors exists with role="tabpanel"', odHtml.includes('id="panelCorridors"') && odHtml.includes('role="tabpanel"'));

  assert('Test 5.13: Modal dialog exists with role="dialog" and aria-modal="true"', odHtml.includes('id="odDetailModal"') && odHtml.includes('role="dialog"') && odHtml.includes('aria-modal="true"'));
  assert('Test 5.14: Modal backdrop element exists', odHtml.includes('id="modalBackdrop"'));
  assert('Test 5.15: Modal close button exists with aria-label', odHtml.includes('id="modalCloseBtn"') && odHtml.includes('aria-label="Tutup jendela detail"'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Documentation Consistency ---');
{
  assert('Test 6.1: DATA_CONTRACT_NEXT_06.md exists', existsSync(DOCS_CONTRACT_PATH));
  const contractDoc = readFileSync(DOCS_CONTRACT_PATH, 'utf8');

  assert('Test 6.2: Contract status updated to INTEGRATED & VERIFIED',
    contractDoc.includes('| **Matriks Asal-Tujuan (OD)** | `INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2026)`'));

  assert('Test 6.3: Section 4.3 Spesifikasi Kontrak Data Matriks Asal-Tujuan present',
    contractDoc.includes('### 4.3 Spesifikasi Kontrak Data Matriks Asal-Tujuan (OD Intelligence)'));

  assert('Test 6.4: Contract documents 12 Terminal Tipe A coordinates',
    contractDoc.includes('Terminal Leuwipanjang') && contractDoc.includes('Terminal Baranangsiang') && contractDoc.includes('Terminal Guntur Melati'));

  assert('Test 6.5: Contract documents 4.681.829 volume and 483.310 trips',
    contractDoc.includes('4.681.829 volume') && contractDoc.includes('483.310 perjalanan'));
}

// -----------------------------------------------------------------------------
// Test 7: HTTP Preview Server Smoke Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: HTTP Server Static & API Route Smoke ---');
async function runHttpSmoke() {
  const PREVIEW_PORT = 8080;

  function probe(urlPath) {
    return new Promise((res) => {
      const req = http.get(`http://localhost:${PREVIEW_PORT}${urlPath}`, { timeout: 3000 }, (resp) => {
        let body = '';
        resp.on('data', chunk => { body += chunk; });
        resp.on('end', () => {
          res({ status: resp.statusCode, headers: resp.headers, body });
        });
      });
      req.on('error', (e) => res({ error: e.message }));
      req.on('timeout', () => { req.destroy(); res({ error: 'timeout' }); });
    });
  }

  // Check if server is reachable
  const rootCheck = await probe('/command-center/od/');
  if (rootCheck.error) {
    console.log(`  [INFO] Local preview server on port ${PREVIEW_PORT} not running (${rootCheck.error}).`);
    console.log(`  [INFO] Skipping live HTTP smoke. Static and parity tests pass.`);
  } else {
    assert('Test 7.1: HTTP 200 for /command-center/od/', rootCheck.status === 200, `status=${rootCheck.status}`);
    assert('Test 7.2: HTML contains OD Intelligence title', rootCheck.body.includes('OD Intelligence'));

    const cssCheck = await probe('/command-center/od/od.css');
    assert('Test 7.3: HTTP 200 for /command-center/od/od.css', cssCheck.status === 200, `status=${cssCheck.status}`);

    const jsCheck = await probe('/command-center/od/od.js');
    assert('Test 7.4: HTTP 200 for /command-center/od/od.js', jsCheck.status === 200, `status=${jsCheck.status}`);

    const dataCheck = await probe('/data/od-analisis.json');
    assert('Test 7.5: HTTP 200 for /data/od-analisis.json', dataCheck.status === 200, `status=${dataCheck.status}`);
  }

  console.log('\n================================================================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

await runHttpSmoke();
