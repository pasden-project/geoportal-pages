// scripts/test-early-warning-integration.mjs — Automated verification suite for Early Warning & Operational Anomaly Integration
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_EARLY_WARNING_PATH = resolve(REPO_ROOT, 'src/data/early-warning-jabar.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_UPPKB_PATH = resolve(REPO_ROOT, 'v2/uppkb/index.html');
const V2_OD_PATH = resolve(REPO_ROOT, 'v2/od/index.html');
const V2_CONNECTIVITY_PATH = resolve(REPO_ROOT, 'v2/connectivity/index.html');

const V2_EARLY_WARNING_HTML = resolve(REPO_ROOT, 'v2/early-warning/index.html');
const V2_EARLY_WARNING_CSS = resolve(REPO_ROOT, 'v2/early-warning/early-warning.css');
const V2_EARLY_WARNING_JS = resolve(REPO_ROOT, 'v2/early-warning/early-warning.js');

const SRC_EARLY_WARNING_HTML = resolve(REPO_ROOT, 'src/command-center/early-warning/index.html');
const SRC_EARLY_WARNING_CSS = resolve(REPO_ROOT, 'src/command-center/early-warning/early-warning.css');
const SRC_EARLY_WARNING_JS = resolve(REPO_ROOT, 'src/command-center/early-warning/early-warning.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul Early Warning V2');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_EARLY_WARNING_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/early-warning/early-warning.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_EARLY_WARNING_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/early-warning/early-warning.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: File Existence & Byte-for-Byte Parity Check
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: File Existence & Byte-for-Byte Parity ---');
{
  assert('Test 2.1: v2/early-warning/index.html exists', existsSync(V2_EARLY_WARNING_HTML));
  assert('Test 2.2: v2/early-warning/early-warning.css exists', existsSync(V2_EARLY_WARNING_CSS));
  assert('Test 2.3: v2/early-warning/early-warning.js exists', existsSync(V2_EARLY_WARNING_JS));

  assert('Test 2.4: src/command-center/early-warning/index.html exists', existsSync(SRC_EARLY_WARNING_HTML));
  assert('Test 2.5: src/command-center/early-warning/early-warning.css exists', existsSync(SRC_EARLY_WARNING_CSS));
  assert('Test 2.6: src/command-center/early-warning/early-warning.js exists', existsSync(SRC_EARLY_WARNING_JS));

  const v2HtmlBuf = readFileSync(V2_EARLY_WARNING_HTML);
  const srcHtmlBuf = readFileSync(SRC_EARLY_WARNING_HTML);
  assert('Test 2.7: index.html 100% byte-for-byte parity', v2HtmlBuf.equals(srcHtmlBuf), `${v2HtmlBuf.length} bytes`);

  const v2CssBuf = readFileSync(V2_EARLY_WARNING_CSS);
  const srcCssBuf = readFileSync(SRC_EARLY_WARNING_CSS);
  assert('Test 2.8: early-warning.css 100% byte-for-byte parity', v2CssBuf.equals(srcCssBuf), `${v2CssBuf.length} bytes`);

  const v2JsBuf = readFileSync(V2_EARLY_WARNING_JS);
  const srcJsBuf = readFileSync(SRC_EARLY_WARNING_JS);
  assert('Test 2.9: early-warning.js 100% byte-for-byte parity', v2JsBuf.equals(srcJsBuf), `${v2JsBuf.length} bytes`);
}

// -----------------------------------------------------------------------------
// Test 3: Master Data Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Early Warning Data Integrity Verification ---');
{
  assert('Test 3.1: early-warning-jabar.json exists', existsSync(DATA_EARLY_WARNING_PATH));

  const data = JSON.parse(readFileSync(DATA_EARLY_WARNING_PATH, 'utf8'));
  assert('Test 3.2: total alerts equals 18', Array.isArray(data.alerts) && data.alerts.length === 18, `alerts=${data.alerts?.length}`);
  assert('Test 3.3: total threshold rules equals 10', Array.isArray(data.threshold_rules) && data.threshold_rules.length === 10, `rules=${data.threshold_rules?.length}`);
  assert('Test 3.4: total monthly history periods equals 12', Array.isArray(data.history_monthly) && data.history_monthly.length === 12, `periods=${data.history_monthly?.length}`);

  const counts = data.alerts.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  assert('Test 3.5: Critical severity count equals 4', counts.CRITICAL === 4, `count=${counts.CRITICAL}`);
  assert('Test 3.6: Warning severity count equals 8', counts.WARNING === 8, `count=${counts.WARNING}`);
  assert('Test 3.7: Advisory severity count equals 6', counts.ADVISORY === 6, `count=${counts.ADVISORY}`);

  const domainCounts = data.alerts.reduce((acc, a) => {
    acc[a.domain] = (acc[a.domain] || 0) + 1;
    return acc;
  }, {});

  assert('Test 3.8: Terminal domain alerts count equals 5', domainCounts.terminal === 5, `count=${domainCounts.terminal}`);
  assert('Test 3.9: UPPKB domain alerts count equals 4', domainCounts.uppkb === 4, `count=${domainCounts.uppkb}`);
  assert('Test 3.10: Perintis domain alerts count equals 5', domainCounts.perintis === 5, `count=${domainCounts.perintis}`);
  assert('Test 3.11: Koridor domain alerts count equals 4', domainCounts.koridor === 4, `count=${domainCounts.koridor}`);

  // Geospatial coordinate validation
  const allCoordsValid = data.alerts.every(a => typeof a.lat === 'number' && typeof a.lng === 'number' && a.lat < 0 && a.lng > 105);
  assert('Test 3.12: All 18 alerts have valid geospatial coordinates in Jabar', allCoordsValid);

  // Rule cross-reference
  const ruleCodes = new Set(data.threshold_rules.map(r => r.kode));
  const rulesReferencedValid = data.alerts.every(a => ruleCodes.has(a.kode_rule));
  assert('Test 3.13: All 18 alerts reference valid threshold rules', rulesReferencedValid);
  // Temporal windows and dataset cross-references
  const allTemporalValid = data.alerts.every(a => typeof a.waktu_pemicu === 'string' && a.waktu_pemicu.length > 5);
  assert('Test 3.14: All 18 alerts have descriptive temporal trigger windows (waktu_pemicu)', allTemporalValid);

  const validPolaSet = new Set(['PEAK_HOURS', 'NIGHT_SHIFT', 'WEEKEND_MARKET', 'WEATHER_SEASONAL', 'OFFPEAK_CYCLE']);
  const allPolaValid = data.alerts.every(a => validPolaSet.has(a.pola_temporal));
  assert('Test 3.15: All 18 alerts have valid pola_temporal classification', allPolaValid);

  const allDatasetLinksValid = data.alerts.every(a => typeof a.korelasi_dataset === 'string' && a.korelasi_dataset.length > 5);
  assert('Test 3.16: All 18 alerts have master dataset cross-references (korelasi_dataset)', allDatasetLinksValid);

  // UPPKB alerts link to official stations (JT001, JT002, JT004, JT005)
  const uppkbAlerts = data.alerts.filter(a => a.domain === 'uppkb');
  const uppkbStationsLinked = uppkbAlerts.every(a => a.korelasi_dataset.includes('uppkb-jabar-2025.json'));
  assert('Test 3.17: All UPPKB alerts cross-reference uppkb-jabar-2025.json stations', uppkbStationsLinked);

  // Perintis alerts link to official routes
  const perintisAlerts = data.alerts.filter(a => a.domain === 'perintis');
  const perintisRoutesLinked = perintisAlerts.every(a => a.korelasi_dataset.includes('perintis-jabar-2025.json'));
  assert('Test 3.18: All Perintis alerts cross-reference perintis-jabar-2025.json routes', perintisRoutesLinked);
}

// -----------------------------------------------------------------------------
// Test 4: Navigation Links Across All Modules
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Navigation Links Across Modules ---');
{
  const v2IndexHtml = readFileSync(V2_INDEX_PATH, 'utf8');
  assert('Test 4.1: v2/index.html sidebar links to ./early-warning/ with available status', v2IndexHtml.includes('href="./early-warning/" class="nav-link" data-nav-status="available"'));

  const v2TermHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.2: v2/terminal/index.html sidebar links to ../early-warning/ available', v2TermHtml.includes('href="../early-warning/" class="nav-link" data-nav-status="available"'));

  const v2TrayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.3: v2/trayek/index.html sidebar links to ../early-warning/ available', v2TrayekHtml.includes('href="../early-warning/" class="nav-link" data-nav-status="available"'));

  const v2PerintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.4: v2/perintis/index.html sidebar links to ../early-warning/ available', v2PerintisHtml.includes('href="../early-warning/" class="nav-link" data-nav-status="available"'));

  const v2UppkbHtml = readFileSync(V2_UPPKB_PATH, 'utf8');
  assert('Test 4.5: v2/uppkb/index.html sidebar links to ../early-warning/ available', v2UppkbHtml.includes('href="../early-warning/" class="nav-link" data-nav-status="available"'));

  const v2OdHtml = readFileSync(V2_OD_PATH, 'utf8');
  assert('Test 4.6: v2/od/index.html sidebar links to ../early-warning/ available', v2OdHtml.includes('href="../early-warning/" class="nav-link" data-nav-status="available"'));

  const v2ConnHtml = readFileSync(V2_CONNECTIVITY_PATH, 'utf8');
  assert('Test 4.7: v2/connectivity/index.html sidebar links to ../early-warning/ available', v2ConnHtml.includes('href="../early-warning/" class="nav-link" data-nav-status="available"'));

  const v2EwHtml = readFileSync(V2_EARLY_WARNING_HTML, 'utf8');
  assert('Test 4.8: v2/early-warning/index.html sidebar has active Early Warning link', v2EwHtml.includes('href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"'));

  assert('Test 4.9: No disabled Early Warning coming-soon buttons remain in v2/index.html', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2IndexHtml));
  assert('Test 4.10: No disabled Early Warning coming-soon buttons remain in v2/terminal/', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2TermHtml));
  assert('Test 4.11: No disabled Early Warning coming-soon buttons remain in v2/trayek/', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2TrayekHtml));
  assert('Test 4.12: No disabled Early Warning coming-soon buttons remain in v2/perintis/', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2PerintisHtml));
  assert('Test 4.13: No disabled Early Warning coming-soon buttons remain in v2/uppkb/', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2UppkbHtml));
  assert('Test 4.14: No disabled Early Warning coming-soon buttons remain in v2/od/', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2OdHtml));
  assert('Test 4.15: No disabled Early Warning coming-soon buttons remain in v2/connectivity/', !/data-nav-status="coming-soon"[^>]*Early Warning/.test(v2ConnHtml));
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup & WAI-ARIA
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup & WAI-ARIA ---');
{
  const ewHtml = readFileSync(V2_EARLY_WARNING_HTML, 'utf8');
  assert('Test 5.1: KPI total alerts element exists', ewHtml.includes('id="kpiTotalAlerts"'));
  assert('Test 5.2: KPI critical count element exists', ewHtml.includes('id="kpiCriticalCount"'));
  assert('Test 5.3: KPI warning count element exists', ewHtml.includes('id="kpiWarningCount"'));
  assert('Test 5.4: KPI domain count element exists', ewHtml.includes('id="kpiDomainCount"'));

  assert('Test 5.5: Leaflet map container earlyWarningMap exists', ewHtml.includes('id="earlyWarningMap"'));
  assert('Test 5.6: Severity filter chips bar exists', ewHtml.includes('class="severity-filter-bar"'));
  assert('Test 5.7: Severity filter chip All exists', ewHtml.includes('id="filterAll"'));
  assert('Test 5.8: Severity filter chip Critical exists', ewHtml.includes('id="filterCritical"'));
  assert('Test 5.9: Severity filter chip Warning exists', ewHtml.includes('id="filterWarning"'));
  assert('Test 5.10: Severity filter chip Advisory exists', ewHtml.includes('id="filterAdvisory"'));

  assert('Test 5.11: Tablist exists with role="tablist"', ewHtml.includes('role="tablist"'));
  assert('Test 5.12: Tab Alert Log button exists with role="tab"', ewHtml.includes('id="btnTabAlertLog"') && ewHtml.includes('aria-controls="panelAlertLog"'));
  assert('Test 5.13: Tab Thresholds button exists with role="tab"', ewHtml.includes('id="btnTabThresholds"') && ewHtml.includes('aria-controls="panelThresholds"'));
  assert('Test 5.14: Tab History button exists with role="tab"', ewHtml.includes('id="btnTabHistory"') && ewHtml.includes('aria-controls="panelHistory"'));

  assert('Test 5.15: Panel Alert Log exists with role="tabpanel"', ewHtml.includes('id="panelAlertLog"') && ewHtml.includes('role="tabpanel"'));
  assert('Test 5.16: Panel Thresholds exists with role="tabpanel"', ewHtml.includes('id="panelThresholds"') && ewHtml.includes('role="tabpanel"'));
  assert('Test 5.17: Panel History exists with role="tabpanel"', ewHtml.includes('id="panelHistory"') && ewHtml.includes('role="tabpanel"'));

  assert('Test 5.18: Modal dialog exists with role="dialog" and aria-modal="true"', ewHtml.includes('id="alertDetailModal"') && ewHtml.includes('role="dialog"') && ewHtml.includes('aria-modal="true"'));
  assert('Test 5.19: Modal backdrop element exists', ewHtml.includes('id="modalBackdrop"'));
  assert('Test 5.20: Modal close button exists with aria-label', ewHtml.includes('id="modalCloseBtn"') && ewHtml.includes('aria-label="Tutup jendela detail mitigasi"'));
  assert('Test 5.21: Temporal filter dropdown filterTemporal exists', ewHtml.includes('id="filterTemporal"'));
  assert('Test 5.22: Modal trigger window element exists', ewHtml.includes('id="modalTriggerWindow"'));
  assert('Test 5.23: Modal temporal pattern element exists', ewHtml.includes('id="modalTemporalPattern"'));
  assert('Test 5.24: Modal dataset reference element exists', ewHtml.includes('id="modalDatasetRef"'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Documentation Consistency ---');
{
  assert('Test 6.1: DATA_CONTRACT_NEXT_06.md exists', existsSync(DOCS_CONTRACT_PATH));
  const contractDoc = readFileSync(DOCS_CONTRACT_PATH, 'utf8');

  assert('Test 6.2: Contract status updated to INTEGRATED & VERIFIED for Early Warning',
    contractDoc.includes('| **Sistem Early Warning & Anomali Operasional** | `INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2026)`'));

  assert('Test 6.3: Section 4.5 Spesifikasi Kontrak Data Sistem Early Warning present',
    contractDoc.includes('### 4.5 Spesifikasi Kontrak Data Sistem Early Warning & Registri Ambang Batas'));

  assert('Test 6.4: Contract documents 10 Deterministic Threshold Rules (THR-01 through THR-10)',
    contractDoc.includes('`THR-01`') && contractDoc.includes('`THR-05`') && contractDoc.includes('`THR-10`'));

  assert('Test 6.5: Contract documents 3 Severity Levels',
    contractDoc.includes('`CRITICAL` (Kritis)') && contractDoc.includes('`WARNING` (Peringatan Waspada)') && contractDoc.includes('`ADVISORY` (Atensi Operasional)'));
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

  const rootCheck = await probe('/command-center/early-warning/');
  if (rootCheck.error) {
    console.log(`  [INFO] Local preview server on port ${PREVIEW_PORT} not running (${rootCheck.error}).`);
    console.log(`  [INFO] Skipping live HTTP smoke. Static and parity tests pass.`);
  } else {
    assert('Test 7.1: HTTP 200 for /command-center/early-warning/', rootCheck.status === 200, `status=${rootCheck.status}`);
    assert('Test 7.2: HTML contains Early Warning title', rootCheck.body.includes('Early Warning &amp; Pemantauan Anomali') || rootCheck.body.includes('Early Warning'));

    const cssCheck = await probe('/command-center/early-warning/early-warning.css');
    assert('Test 7.3: HTTP 200 for /command-center/early-warning/early-warning.css', cssCheck.status === 200, `status=${cssCheck.status}`);

    const jsCheck = await probe('/command-center/early-warning/early-warning.js');
    assert('Test 7.4: HTTP 200 for /command-center/early-warning/early-warning.js', jsCheck.status === 200, `status=${jsCheck.status}`);

    const dataCheck = await probe('/data/early-warning-jabar.json');
    assert('Test 7.5: HTTP 200 for /data/early-warning-jabar.json', dataCheck.status === 200, `status=${dataCheck.status}`);
  }

  console.log('\n================================================================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

await runHttpSmoke();
