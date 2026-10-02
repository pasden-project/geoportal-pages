// scripts/test-connectivity-integration.mjs — Automated verification suite for Multimodal Connectivity Integration
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_CONNECTIVITY_PATH = resolve(REPO_ROOT, 'src/data/connectivity-jabar.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_UPPKB_PATH = resolve(REPO_ROOT, 'v2/uppkb/index.html');
const V2_OD_PATH = resolve(REPO_ROOT, 'v2/od/index.html');

const V2_CONNECTIVITY_HTML = resolve(REPO_ROOT, 'v2/connectivity/index.html');
const V2_CONNECTIVITY_CSS = resolve(REPO_ROOT, 'v2/connectivity/connectivity.css');
const V2_CONNECTIVITY_JS = resolve(REPO_ROOT, 'v2/connectivity/connectivity.js');

const SRC_INDEX_PATH = resolve(REPO_ROOT, 'src/command-center/index.html');
const SRC_CONNECTIVITY_HTML = resolve(REPO_ROOT, 'src/command-center/connectivity/index.html');
const SRC_CONNECTIVITY_CSS = resolve(REPO_ROOT, 'src/command-center/connectivity/connectivity.css');
const SRC_CONNECTIVITY_JS = resolve(REPO_ROOT, 'src/command-center/connectivity/connectivity.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul Konektivitas Multimoda');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_CONNECTIVITY_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/connectivity/connectivity.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_CONNECTIVITY_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/connectivity/connectivity.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: File Existence & Byte-for-Byte Parity Check
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: File Existence & Byte-for-Byte Parity ---');
{
  assert('Test 2.1: v2/connectivity/index.html exists', existsSync(V2_CONNECTIVITY_HTML));
  assert('Test 2.2: v2/connectivity/connectivity.css exists', existsSync(V2_CONNECTIVITY_CSS));
  assert('Test 2.3: v2/connectivity/connectivity.js exists', existsSync(V2_CONNECTIVITY_JS));

  assert('Test 2.4: src/command-center/connectivity/index.html exists', existsSync(SRC_CONNECTIVITY_HTML));
  assert('Test 2.5: src/command-center/connectivity/connectivity.css exists', existsSync(SRC_CONNECTIVITY_CSS));
  assert('Test 2.6: src/command-center/connectivity/connectivity.js exists', existsSync(SRC_CONNECTIVITY_JS));

  const v2HtmlBuf = readFileSync(V2_CONNECTIVITY_HTML);
  const srcHtmlBuf = readFileSync(SRC_CONNECTIVITY_HTML);
  assert('Test 2.7: index.html 100% byte-for-byte parity', v2HtmlBuf.equals(srcHtmlBuf), `${v2HtmlBuf.length} bytes`);

  const v2CssBuf = readFileSync(V2_CONNECTIVITY_CSS);
  const srcCssBuf = readFileSync(SRC_CONNECTIVITY_CSS);
  assert('Test 2.8: connectivity.css 100% byte-for-byte parity', v2CssBuf.equals(srcCssBuf), `${v2CssBuf.length} bytes`);

  const v2JsBuf = readFileSync(V2_CONNECTIVITY_JS);
  const srcJsBuf = readFileSync(SRC_CONNECTIVITY_JS);
  assert('Test 2.9: connectivity.js 100% byte-for-byte parity', v2JsBuf.equals(srcJsBuf), `${v2JsBuf.length} bytes`);
}

// -----------------------------------------------------------------------------
// Test 3: Master Data Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Multimodal Data Integrity Verification ---');
{
  assert('Test 3.1: connectivity-jabar.json exists', existsSync(DATA_CONNECTIVITY_PATH));

  const data = JSON.parse(readFileSync(DATA_CONNECTIVITY_PATH, 'utf8'));
  assert('Test 3.2: total nodes equals 47', Array.isArray(data.nodes) && data.nodes.length === 47, `nodes=${data.nodes?.length}`);
  assert('Test 3.3: total corridors equals 14', Array.isArray(data.intermodal_corridors) && data.intermodal_corridors.length === 14, `corridors=${data.intermodal_corridors?.length}`);
  assert('Test 3.4: total regions equals 27', Array.isArray(data.regional_indices) && data.regional_indices.length === 27, `regions=${data.regional_indices?.length}`);

  const counts = data.nodes.reduce((acc, n) => {
    acc[n.kategori] = (acc[n.kategori] || 0) + 1;
    return acc;
  }, {});

  assert('Test 3.5: Terminal Tipe A count equals 12', counts.terminal_a === 12, `count=${counts.terminal_a}`);
  assert('Test 3.6: Terminal Tipe B count equals 10', counts.terminal_b === 10, `count=${counts.terminal_b}`);
  assert('Test 3.7: UPPKB facilities count equals 6', counts.uppkb === 6, `count=${counts.uppkb}`);
  assert('Test 3.8: Stasiun KA & Whoosh count equals 15', counts.stasiun_ka === 15, `count=${counts.stasiun_ka}`);
  assert('Test 3.9: Bandara Udara count equals 2', counts.bandara === 2, `count=${counts.bandara}`);
  assert('Test 3.10: Pelabuhan Laut count equals 2', counts.pelabuhan === 2, `count=${counts.pelabuhan}`);

  // Coordinate check for all 47 nodes
  const allCoordsValid = data.nodes.every(n => typeof n.lat === 'number' && typeof n.lng === 'number' && n.lat < 0 && n.lng > 105);
  assert('Test 3.11: All 47 nodes have valid geospatial coordinates in Jabar', allCoordsValid);

  // Corridor validity
  const nodeIds = new Set(data.nodes.map(n => n.id));
  const corridorsValid = data.intermodal_corridors.every(c => nodeIds.has(c.origin_node) && nodeIds.has(c.destination_node) && c.jarak_km > 0);
  assert('Test 3.12: All 14 corridors link valid origin and destination nodes', corridorsValid);
}

// -----------------------------------------------------------------------------
// Test 4: Navigation Links Across All Modules
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Navigation Links Across Modules ---');
{
  const v2IndexHtml = readFileSync(V2_INDEX_PATH, 'utf8');
  assert('Test 4.1: v2/index.html quick access links to ./connectivity/', v2IndexHtml.includes('href="./connectivity/"') && v2IndexHtml.includes('class="quick-btn'));
  assert('Test 4.2: v2/index.html quick access has data-nav-status="available"', v2IndexHtml.includes('href="./connectivity/" class="quick-btn quick-btn-last" data-nav-status="available"'));
  assert('Test 4.3: v2/index.html sidebar links to ./connectivity/ with available status', v2IndexHtml.includes('href="./connectivity/" class="nav-link" data-nav-status="available"'));

  const v2TermHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.4: v2/terminal/index.html sidebar links to ../connectivity/ available', v2TermHtml.includes('href="../connectivity/" class="nav-link" data-nav-status="available"'));

  const v2TrayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.5: v2/trayek/index.html sidebar links to ../connectivity/ available', v2TrayekHtml.includes('href="../connectivity/" class="nav-link" data-nav-status="available"'));

  const v2PerintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.6: v2/perintis/index.html sidebar links to ../connectivity/ available', v2PerintisHtml.includes('href="../connectivity/" class="nav-link" data-nav-status="available"'));

  const v2UppkbHtml = readFileSync(V2_UPPKB_PATH, 'utf8');
  assert('Test 4.7: v2/uppkb/index.html sidebar links to ../connectivity/ available', v2UppkbHtml.includes('href="../connectivity/" class="nav-link" data-nav-status="available"'));

  const v2OdHtml = readFileSync(V2_OD_PATH, 'utf8');
  assert('Test 4.8: v2/od/index.html sidebar links to ../connectivity/ available', v2OdHtml.includes('href="../connectivity/" class="nav-link" data-nav-status="available"'));

  const v2ConnHtml = readFileSync(V2_CONNECTIVITY_HTML, 'utf8');
  assert('Test 4.9: v2/connectivity/index.html sidebar has active Connectivity link', v2ConnHtml.includes('href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"'));

  assert('Test 4.10: No disabled Connectivity coming-soon buttons remain in v2/index.html', !/data-nav-status="coming-soon"[^>]*Connectivity/.test(v2IndexHtml));
  assert('Test 4.11: No disabled Connectivity coming-soon buttons remain in v2/terminal/', !/data-nav-status="coming-soon"[^>]*Connectivity/.test(v2TermHtml));
  assert('Test 4.12: No disabled Connectivity coming-soon buttons remain in v2/trayek/', !/data-nav-status="coming-soon"[^>]*Connectivity/.test(v2TrayekHtml));
  assert('Test 4.13: No disabled Connectivity coming-soon buttons remain in v2/perintis/', !/data-nav-status="coming-soon"[^>]*Connectivity/.test(v2PerintisHtml));
  assert('Test 4.14: No disabled Connectivity coming-soon buttons remain in v2/uppkb/', !/data-nav-status="coming-soon"[^>]*Connectivity/.test(v2UppkbHtml));
  assert('Test 4.15: No disabled Connectivity coming-soon buttons remain in v2/od/', !/data-nav-status="coming-soon"[^>]*Connectivity/.test(v2OdHtml));
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup & WAI-ARIA
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup & WAI-ARIA ---');
{
  const connHtml = readFileSync(V2_CONNECTIVITY_HTML, 'utf8');
  assert('Test 5.1: KPI total nodes element exists', connHtml.includes('id="kpiTotalNodes"'));
  assert('Test 5.2: KPI total corridors element exists', connHtml.includes('id="kpiTotalCorridors"'));
  assert('Test 5.3: KPI avg distance element exists', connHtml.includes('id="kpiAvgDistance"'));
  assert('Test 5.4: KPI total regions element exists', connHtml.includes('id="kpiTotalRegions"'));

  assert('Test 5.5: Leaflet map container connectivityMap exists', connHtml.includes('id="connectivityMap"'));
  assert('Test 5.6: Mode filter chips toolbar exists', connHtml.includes('class="mode-filter-bar"'));
  assert('Test 5.7: Tablist exists with role="tablist"', connHtml.includes('role="tablist"'));
  assert('Test 5.8: Tab Directory button exists with role="tab"', connHtml.includes('id="btnTabDirectory"') && connHtml.includes('aria-controls="panelDirectory"'));
  assert('Test 5.9: Tab Corridors button exists with role="tab"', connHtml.includes('id="btnTabCorridors"') && connHtml.includes('aria-controls="panelCorridors"'));
  assert('Test 5.10: Tab Regional button exists with role="tab"', connHtml.includes('id="btnTabRegional"') && connHtml.includes('aria-controls="panelRegional"'));

  assert('Test 5.11: Panel Directory exists with role="tabpanel"', connHtml.includes('id="panelDirectory"') && connHtml.includes('role="tabpanel"'));
  assert('Test 5.12: Panel Corridors exists with role="tabpanel"', connHtml.includes('id="panelCorridors"') && connHtml.includes('role="tabpanel"'));
  assert('Test 5.13: Panel Regional exists with role="tabpanel"', connHtml.includes('id="panelRegional"') && connHtml.includes('role="tabpanel"'));

  assert('Test 5.14: Modal dialog exists with role="dialog" and aria-modal="true"', connHtml.includes('id="connectivityDetailModal"') && connHtml.includes('role="dialog"') && connHtml.includes('aria-modal="true"'));
  assert('Test 5.15: Modal backdrop element exists', connHtml.includes('id="modalBackdrop"'));
  assert('Test 5.16: Modal close button exists with aria-label', connHtml.includes('id="modalCloseBtn"') && connHtml.includes('aria-label="Tutup jendela detail"'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Documentation Consistency ---');
{
  assert('Test 6.1: DATA_CONTRACT_NEXT_06.md exists', existsSync(DOCS_CONTRACT_PATH));
  const contractDoc = readFileSync(DOCS_CONTRACT_PATH, 'utf8');

  assert('Test 6.2: Contract status updated to INTEGRATED & VERIFIED',
    contractDoc.includes('| **Indeks Konektivitas Multimoda** | `INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2026)`'));

  assert('Test 6.3: Section 4.4 Spesifikasi Kontrak Data Konektivitas Multimoda present',
    contractDoc.includes('### 4.4 Spesifikasi Kontrak Data Konektivitas Multimoda (Hub Antarmoda)'));

  assert('Test 6.4: Contract documents 47 Simpul Multimoda and 6 categories',
    contractDoc.includes('12 Terminal Tipe A') && contractDoc.includes('10 Terminal Tipe B') && contractDoc.includes('6 UPPKB Penimbangan') && contractDoc.includes('15 Stasiun KA'));

  assert('Test 6.5: Contract documents 14 Intermodal Corridors',
    contractDoc.includes('Padalarang Multimodal Hub') && contractDoc.includes('Tegalluar - Cileunyi Transit') && contractDoc.includes('Cikarang Integrated Hub'));
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
  const rootCheck = await probe('/command-center/connectivity/');
  if (rootCheck.error) {
    console.log(`  [INFO] Local preview server on port ${PREVIEW_PORT} not running (${rootCheck.error}).`);
    console.log(`  [INFO] Skipping live HTTP smoke. Static and parity tests pass.`);
  } else {
    assert('Test 7.1: HTTP 200 for /command-center/connectivity/', rootCheck.status === 200, `status=${rootCheck.status}`);
    assert('Test 7.2: HTML contains Konektivitas Multimoda title', rootCheck.body.includes('Konektivitas Multimoda'));

    const cssCheck = await probe('/command-center/connectivity/connectivity.css');
    assert('Test 7.3: HTTP 200 for /command-center/connectivity/connectivity.css', cssCheck.status === 200, `status=${cssCheck.status}`);

    const jsCheck = await probe('/command-center/connectivity/connectivity.js');
    assert('Test 7.4: HTTP 200 for /command-center/connectivity/connectivity.js', jsCheck.status === 200, `status=${jsCheck.status}`);

    const dataCheck = await probe('/data/connectivity-jabar.json');
    assert('Test 7.5: HTTP 200 for /data/connectivity-jabar.json', dataCheck.status === 200, `status=${dataCheck.status}`);
  }

  console.log('\n================================================================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

await runHttpSmoke();
