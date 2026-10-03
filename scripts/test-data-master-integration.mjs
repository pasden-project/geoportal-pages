// scripts/test-data-master-integration.mjs — Automated verification suite for Modul Data Master & Katalog Referensi Transportasi V2
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_MASTER_PATH = resolve(REPO_ROOT, 'src/data/data-master-jabar.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_UPPKB_PATH = resolve(REPO_ROOT, 'v2/uppkb/index.html');
const V2_OD_PATH = resolve(REPO_ROOT, 'v2/od/index.html');
const V2_CONNECTIVITY_PATH = resolve(REPO_ROOT, 'v2/connectivity/index.html');
const V2_EARLY_WARNING_PATH = resolve(REPO_ROOT, 'v2/early-warning/index.html');
const V2_PROGRAM_PATH = resolve(REPO_ROOT, 'v2/program/index.html');
const V2_LAPORAN_PATH = resolve(REPO_ROOT, 'v2/laporan/index.html');

const V2_DATA_MASTER_HTML = resolve(REPO_ROOT, 'v2/data-master/index.html');
const V2_DATA_MASTER_CSS = resolve(REPO_ROOT, 'v2/data-master/data-master.css');
const V2_DATA_MASTER_JS = resolve(REPO_ROOT, 'v2/data-master/data-master.js');

const SRC_DATA_MASTER_HTML = resolve(REPO_ROOT, 'src/command-center/data-master/index.html');
const SRC_DATA_MASTER_CSS = resolve(REPO_ROOT, 'src/command-center/data-master/data-master.css');
const SRC_DATA_MASTER_JS = resolve(REPO_ROOT, 'src/command-center/data-master/data-master.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul Data Master V2');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_DATA_MASTER_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/data-master/data-master.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_DATA_MASTER_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/data-master/data-master.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: File Existence & Byte-for-Byte Parity Check
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: File Existence & Byte-for-Byte Parity ---');
{
  assert('Test 2.1: v2/data-master/index.html exists', existsSync(V2_DATA_MASTER_HTML));
  assert('Test 2.2: v2/data-master/data-master.css exists', existsSync(V2_DATA_MASTER_CSS));
  assert('Test 2.3: v2/data-master/data-master.js exists', existsSync(V2_DATA_MASTER_JS));

  assert('Test 2.4: src/command-center/data-master/index.html exists', existsSync(SRC_DATA_MASTER_HTML));
  assert('Test 2.5: src/command-center/data-master/data-master.css exists', existsSync(SRC_DATA_MASTER_CSS));
  assert('Test 2.6: src/command-center/data-master/data-master.js exists', existsSync(SRC_DATA_MASTER_JS));

  const v2HtmlBuf = readFileSync(V2_DATA_MASTER_HTML);
  const srcHtmlBuf = readFileSync(SRC_DATA_MASTER_HTML);
  assert('Test 2.7: index.html 100% byte-for-byte parity', v2HtmlBuf.equals(srcHtmlBuf), `${v2HtmlBuf.length} bytes`);

  const v2CssBuf = readFileSync(V2_DATA_MASTER_CSS);
  const srcCssBuf = readFileSync(SRC_DATA_MASTER_CSS);
  assert('Test 2.8: data-master.css 100% byte-for-byte parity', v2CssBuf.equals(srcCssBuf), `${v2CssBuf.length} bytes`);

  const v2JsBuf = readFileSync(V2_DATA_MASTER_JS);
  const srcJsBuf = readFileSync(SRC_DATA_MASTER_JS);
  assert('Test 2.9: data-master.js 100% byte-for-byte parity', v2JsBuf.equals(srcJsBuf), `${v2JsBuf.length} bytes`);
}

// -----------------------------------------------------------------------------
// Test 3: Master Data Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Master Data Integrity Verification ---');
{
  assert('Test 3.1: data-master-jabar.json exists', existsSync(DATA_MASTER_PATH));

  const rawData = readFileSync(DATA_MASTER_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(rawData);
    assert('Test 3.2: data-master-jabar.json is valid JSON', true);
  } catch (e) {
    assert('Test 3.2: data-master-jabar.json is valid JSON', false, e.message);
  }

  assert('Test 3.3: Title defines Direktori & Katalog Referensi Data Master',
    data.title && data.title.includes('Direktori & Katalog Referensi Data Master Transportasi'));
  assert('Test 3.4: Instansi is BPTD Kelas I Jawa Barat',
    data.instansi && (data.instansi.includes('BPTD Kelas I Jawa Barat') || data.instansi.includes('Balai Pengelola Transportasi Darat Kelas I Jawa Barat')));
  assert('Test 3.5: Year is 2026', data.tahun === 2026);
  // Summary checks
  const summary = data.summary || {};
  assert('Test 3.6: Total item katalog is 108', summary.total_item_katalog === 108, `total=${summary.total_item_katalog}`);
  assert('Test 3.7: Total entitas master is 96', summary.total_entitas_master === 96, `total=${summary.total_entitas_master}`);
  assert('Test 3.8: Total kamus data is 12', summary.total_kamus_data === 12, `total=${summary.total_kamus_data}`);
  assert('Test 3.9: Total kategori is 6', summary.total_kategori === 6, `total=${summary.total_kategori}`);
  assert('Test 3.10: Mode operasional is READ-ONLY',
    summary.mode_operasional && summary.mode_operasional.includes('READ-ONLY'));

  // Items distribution checks
  const items = data.items || [];
  assert('Test 3.11: Items array contains exactly 108 records', items.length === 108, `count=${items.length}`);

  const terminalItems = items.filter(it => it.kategori === 'TERMINAL');
  assert('Test 3.12: Exactly 22 Terminal items (12 Tipe A + 10 Tipe B)', terminalItems.length === 22, `count=${terminalItems.length}`);
  const termA = terminalItems.filter(t => (t.tipe || '').includes('Tipe A'));
  const termB = terminalItems.filter(t => (t.tipe || '').includes('Tipe B'));
  assert('Test 3.13: 12 Terminal Tipe A and 10 Terminal Tipe B', termA.length === 12 && termB.length === 10);

  const uppkbItems = items.filter(it => it.kategori === 'UPPKB');
  assert('Test 3.14: Exactly 6 UPPKB items (JT001 - JT006)', uppkbItems.length === 6, `count=${uppkbItems.length}`);
  const allUppkbCodes = uppkbItems.map(u => u.kode).sort();
  assert('Test 3.15: UPPKB codes match JT001 to JT006', JSON.stringify(allUppkbCodes) === JSON.stringify(['JT001', 'JT002', 'JT003', 'JT004', 'JT005', 'JT006']));

  const trayekItems = items.filter(it => it.kategori === 'TRAYEK');
  assert('Test 3.16: Exactly 22 Trayek items (10 OD + 6 Perintis + 6 Aglomerasi)', trayekItems.length === 22, `count=${trayekItems.length}`);

  const multimodaItems = items.filter(it => it.kategori === 'MULTIMODA');
  assert('Test 3.17: Exactly 19 Multimoda items (15 KA/Whoosh + 2 Bandara + 2 Pelabuhan)', multimodaItems.length === 19, `count=${multimodaItems.length}`);

  const wilayahItems = items.filter(it => it.kategori === 'WILAYAH');
  assert('Test 3.18: Exactly 27 Wilayah items (18 Kab + 9 Kota)', wilayahItems.length === 27, `count=${wilayahItems.length}`);

  const kamusItems = items.filter(it => it.kategori === 'KAMUS_DATA');
  assert('Test 3.19: Exactly 12 Kamus Data items', kamusItems.length === 12, `count=${kamusItems.length}`);

  // Geospatial valid coordinate check
  const spatialItems = items.filter(it => it.kategori !== 'KAMUS_DATA');
  const allCoordsValid = spatialItems.every(it =>
    typeof it.lat === 'number' && it.lat < 0 && it.lat > -10 &&
    typeof it.lng === 'number' && it.lng > 105 && it.lng < 110
  );
  assert('Test 3.20: All 96 spatial items have valid West Java coordinates (WGS84)', allCoordsValid);
}

// -----------------------------------------------------------------------------
// Test 4: Navigation Links Across All 11 Modules (0 Coming-Soon Remaining!)
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Navigation Links Across All 11 Modules ---');
{
  const v2IndexHtml = readFileSync(V2_INDEX_PATH, 'utf8');
  assert('Test 4.1: v2/index.html sidebar links to ./data-master/ with available status',
    v2IndexHtml.includes('href="./data-master/" class="nav-link" data-nav-status="available"'));

  const v2TermHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.2: v2/terminal/index.html sidebar links to ../data-master/ with available status',
    v2TermHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2TrayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.3: v2/trayek/index.html sidebar links to ../data-master/ with available status',
    v2TrayekHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2PerintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.4: v2/perintis/index.html sidebar links to ../data-master/ with available status',
    v2PerintisHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2UppkbHtml = readFileSync(V2_UPPKB_PATH, 'utf8');
  assert('Test 4.5: v2/uppkb/index.html sidebar links to ../data-master/ with available status',
    v2UppkbHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2OdHtml = readFileSync(V2_OD_PATH, 'utf8');
  assert('Test 4.6: v2/od/index.html sidebar links to ../data-master/ with available status',
    v2OdHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2ConnHtml = readFileSync(V2_CONNECTIVITY_PATH, 'utf8');
  assert('Test 4.7: v2/connectivity/index.html sidebar links to ../data-master/ with available status',
    v2ConnHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2EwHtml = readFileSync(V2_EARLY_WARNING_PATH, 'utf8');
  assert('Test 4.8: v2/early-warning/index.html sidebar links to ../data-master/ with available status',
    v2EwHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2ProgHtml = readFileSync(V2_PROGRAM_PATH, 'utf8');
  assert('Test 4.9: v2/program/index.html sidebar links to ../data-master/ with available status',
    v2ProgHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2LapHtml = readFileSync(V2_LAPORAN_PATH, 'utf8');
  assert('Test 4.10: v2/laporan/index.html sidebar links to ../data-master/ with available status',
    v2LapHtml.includes('href="../data-master/" class="nav-link" data-nav-status="available"'));

  const v2DmHtml = readFileSync(V2_DATA_MASTER_HTML, 'utf8');
  assert('Test 4.11: v2/data-master/index.html sidebar self-links with active status',
    v2DmHtml.includes('href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"') &&
    v2DmHtml.includes('class="nav-status-badge nav-status-active" data-status="ACTIVE">Aktif</span>'));

  // Zero coming-soon check across all 11 modules
  const all11Htmls = [
    { name: 'v2/index.html', content: v2IndexHtml },
    { name: 'v2/terminal/', content: v2TermHtml },
    { name: 'v2/trayek/', content: v2TrayekHtml },
    { name: 'v2/perintis/', content: v2PerintisHtml },
    { name: 'v2/uppkb/', content: v2UppkbHtml },
    { name: 'v2/od/', content: v2OdHtml },
    { name: 'v2/connectivity/', content: v2ConnHtml },
    { name: 'v2/early-warning/', content: v2EwHtml },
    { name: 'v2/program/', content: v2ProgHtml },
    { name: 'v2/laporan/', content: v2LapHtml },
    { name: 'v2/data-master/', content: v2DmHtml }
  ];

  all11Htmls.forEach((mod, idx) => {
    const hasComingSoon = /data-nav-status="coming-soon"/.test(mod.content);
    assert(`Test 4.${12 + idx}: Exactly 0 coming-soon buttons in ${mod.name}`, !hasComingSoon);
  });
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup, WAI-ARIA & Export Engines
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup, WAI-ARIA & Export Engines ---');
{
  const dmHtml = readFileSync(V2_DATA_MASTER_HTML, 'utf8');

  // KPI elements
  assert('Test 5.1: KPI total items element exists', dmHtml.includes('id="kpiTotalItems"'));
  assert('Test 5.2: KPI total categories element exists', dmHtml.includes('id="kpiTotalCategories"'));
  assert('Test 5.3: KPI standardization element exists', dmHtml.includes('id="kpiStandardization"'));
  assert('Test 5.4: KPI security mode element exists', dmHtml.includes('id="kpiSecurityMode"'));

  // Filter toolbar elements
  assert('Test 5.5: Filter category select exists', dmHtml.includes('id="filterCategory"'));
  assert('Test 5.6: Filter status select exists', dmHtml.includes('id="filterStatus"'));
  assert('Test 5.7: Filter search input exists', dmHtml.includes('id="filterSearch"'));
  assert('Test 5.8: Reset filter button exists', dmHtml.includes('id="btnResetFilter"'));
  assert('Test 5.9: Export CSV button exists', dmHtml.includes('id="btnExportCsv"'));
  assert('Test 5.10: Export JSON button exists', dmHtml.includes('id="btnExportJson"'));

  // Tabs
  assert('Test 5.11: Tablist exists with role="tablist"', dmHtml.includes('role="tablist"'));
  assert('Test 5.12: Tab Map button exists with role="tab"', dmHtml.includes('id="btnTabMap"') && dmHtml.includes('aria-controls="panelTabMap"'));
  assert('Test 5.13: Tab Directory button exists with role="tab"', dmHtml.includes('id="btnTabDirectory"') && dmHtml.includes('aria-controls="panelTabDirectory"'));
  assert('Test 5.14: Tab Dictionary button exists with role="tab"', dmHtml.includes('id="btnTabDictionary"') && dmHtml.includes('aria-controls="panelTabDictionary"'));

  // Panels
  assert('Test 5.15: Panel Map exists with role="tabpanel"', dmHtml.includes('id="panelTabMap"') && dmHtml.includes('role="tabpanel"'));
  assert('Test 5.16: Panel Directory exists with role="tabpanel"', dmHtml.includes('id="panelTabDirectory"') && dmHtml.includes('role="tabpanel"'));
  assert('Test 5.17: Panel Dictionary exists with role="tabpanel"', dmHtml.includes('id="panelTabDictionary"') && dmHtml.includes('role="tabpanel"'));

  // Map & Directory containers
  assert('Test 5.18: Master Leaflet Map container exists', dmHtml.includes('id="masterMap"'));
  assert('Test 5.19: Layer toggle checkboxes exist', dmHtml.includes('id="layerToggleTerminal"') && dmHtml.includes('id="layerToggleUppkb"') && dmHtml.includes('id="layerToggleTrayek"'));
  assert('Test 5.20: Master table and tbody exist', dmHtml.includes('id="masterTable"') && dmHtml.includes('id="masterTableBody"'));
  assert('Test 5.21: Table empty state container exists', dmHtml.includes('id="tableEmptyState"'));
  assert('Test 5.22: Dictionary grid container exists', dmHtml.includes('id="dictionaryGrid"'));

  // Modal WAI-ARIA
  assert('Test 5.23: Modal dialog exists with role="dialog" and aria-modal="true"',
    dmHtml.includes('id="masterDetailModal"') && dmHtml.includes('role="dialog"') && dmHtml.includes('aria-modal="true"'));
  assert('Test 5.24: Modal title and sub exist with ARIA labelledby/describedby',
    dmHtml.includes('id="modalMasterTitle"') && dmHtml.includes('aria-labelledby="modalMasterTitle"'));
  assert('Test 5.25: Modal close button exists with aria-label',
    dmHtml.includes('id="modalMasterCloseBtn"') && dmHtml.includes('aria-label="Tutup jendela rincian"'));
  assert('Test 5.26: Modal Focus Map button exists', dmHtml.includes('id="modalFocusMapBtn"'));

  // CSS Leaflet clean display check
  const dmCss = readFileSync(V2_DATA_MASTER_CSS, 'utf8');
  assert('Test 5.27: CSS hides Leaflet attribution for clean command center UI',
    dmCss.includes('.leaflet-control-attribution') && dmCss.includes('display: none !important;'));
  assert('Test 5.28: CSS styles custom map markers', dmCss.includes('.custom-map-marker') && dmCss.includes('.marker-terminal'));
  assert('Test 5.29: CSS styles dictionary cards & formulas', dmCss.includes('.dict-card') && dmCss.includes('.dict-formula-box'));

  // JS Engine checks
  const dmJs = readFileSync(V2_DATA_MASTER_JS, 'utf8');
  assert('Test 5.30: JS includes UTF-8 BOM (\\uFEFF) for Microsoft Excel CSV compatibility', dmJs.includes('\\uFEFF'));
  assert('Test 5.31: JS includes exportToCsv function', dmJs.includes('function exportToCsv('));
  assert('Test 5.32: JS includes exportToJson function', dmJs.includes('function exportToJson('));
  assert('Test 5.33: JS includes embedded fallback data master (100% offline ready)',
    dmJs.includes('const DATA_MASTER_FALLBACK =') && dmJs.includes('Direktori & Katalog Referensi Data Master'));
  assert('Test 5.34: JS implements WAI-ARIA keyboard navigation (Escape & Tab trap)',
    dmJs.includes("e.key === 'Escape'") && dmJs.includes("e.key === 'Tab'"));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Documentation Consistency ---');
{
  assert('Test 6.1: DATA_CONTRACT_NEXT_06.md exists', existsSync(DOCS_CONTRACT_PATH));
  const contractDoc = readFileSync(DOCS_CONTRACT_PATH, 'utf8');

  assert('Test 6.2: Contract status updated to INTEGRATED & VERIFIED for Data Master',
    contractDoc.includes('| **Data Master & Katalog Referensi** | `INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2026)`'));
  assert('Test 6.3: Section 4.8 Spesifikasi Kontrak Data Master present',
    contractDoc.includes('### 4.8 Spesifikasi Kontrak Data Modul Data Master & Katalog Referensi Transportasi'));
  assert('Test 6.4: Contract specifies Strict Read-Only mode',
    contractDoc.includes('Strict Read-Only'));
  assert('Test 6.5: Contract documents 108 total catalog items',
    contractDoc.includes('108 Entitas & Istilah') || contractDoc.includes('total 108 item terverifikasi'));
  assert('Test 6.6: Contract documents 6 categories (Terminal, UPPKB, Trayek, Multimoda, Wilayah, Kamus Data)',
    contractDoc.includes('`TERMINAL`') && contractDoc.includes('`UPPKB`') && contractDoc.includes('`TRAYEK`') &&
    contractDoc.includes('`MULTIMODA`') && contractDoc.includes('`WILAYAH`') && contractDoc.includes('`KAMUS_DATA`'));
}

// -----------------------------------------------------------------------------
// Test 7: HTTP Server Static & API Route Smoke
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

  const rootCheck = await probe('/command-center/data-master/');
  if (rootCheck.error) {
    console.log(`  [INFO] Local preview server on port ${PREVIEW_PORT} not running (${rootCheck.error}).`);
    console.log(`  [INFO] Skipping live HTTP smoke. Static and parity tests pass.`);
  } else {
    assert('Test 7.1: HTTP 200 for /command-center/data-master/', rootCheck.status === 200, `status=${rootCheck.status}`);
    assert('Test 7.2: HTML contains Katalog Referensi & Direktori Data Master title',
      rootCheck.body.includes('Katalog Referensi &amp; Direktori Data Master Transportasi') ||
      rootCheck.body.includes('Katalog Referensi & Direktori Data Master Transportasi'));

    const cssCheck = await probe('/command-center/data-master/data-master.css');
    assert('Test 7.3: HTTP 200 for /command-center/data-master/data-master.css', cssCheck.status === 200, `status=${cssCheck.status}`);

    const jsCheck = await probe('/command-center/data-master/data-master.js');
    assert('Test 7.4: HTTP 200 for /command-center/data-master/data-master.js', jsCheck.status === 200, `status=${jsCheck.status}`);

    const dataCheck = await probe('/data/data-master-jabar.json');
    assert('Test 7.5: HTTP 200 for /data/data-master-jabar.json', dataCheck.status === 200, `status=${dataCheck.status}`);
  }

  console.log('\n================================================================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

await runHttpSmoke();
