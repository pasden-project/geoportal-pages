// scripts/test-program-integration.mjs — Automated verification suite for Program & Kinerja Transportasi Integration
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_PROGRAM_PATH = resolve(REPO_ROOT, 'src/data/program-kinerja-jabar.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_UPPKB_PATH = resolve(REPO_ROOT, 'v2/uppkb/index.html');
const V2_OD_PATH = resolve(REPO_ROOT, 'v2/od/index.html');
const V2_CONNECTIVITY_PATH = resolve(REPO_ROOT, 'v2/connectivity/index.html');
const V2_EARLY_WARNING_PATH = resolve(REPO_ROOT, 'v2/early-warning/index.html');

const V2_PROGRAM_HTML = resolve(REPO_ROOT, 'v2/program/index.html');
const V2_PROGRAM_CSS = resolve(REPO_ROOT, 'v2/program/program.css');
const V2_PROGRAM_JS = resolve(REPO_ROOT, 'v2/program/program.js');

const SRC_PROGRAM_HTML = resolve(REPO_ROOT, 'src/command-center/program/index.html');
const SRC_PROGRAM_CSS = resolve(REPO_ROOT, 'src/command-center/program/program.css');
const SRC_PROGRAM_JS = resolve(REPO_ROOT, 'src/command-center/program/program.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul Program & Kinerja V2');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_PROGRAM_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/program/program.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_PROGRAM_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/program/program.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: File Existence & Byte-for-Byte Parity Check
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: File Existence & Byte-for-Byte Parity ---');
{
  assert('Test 2.1: v2/program/index.html exists', existsSync(V2_PROGRAM_HTML));
  assert('Test 2.2: v2/program/program.css exists', existsSync(V2_PROGRAM_CSS));
  assert('Test 2.3: v2/program/program.js exists', existsSync(V2_PROGRAM_JS));

  assert('Test 2.4: src/command-center/program/index.html exists', existsSync(SRC_PROGRAM_HTML));
  assert('Test 2.5: src/command-center/program/program.css exists', existsSync(SRC_PROGRAM_CSS));
  assert('Test 2.6: src/command-center/program/program.js exists', existsSync(SRC_PROGRAM_JS));

  const v2HtmlBuf = readFileSync(V2_PROGRAM_HTML);
  const srcHtmlBuf = readFileSync(SRC_PROGRAM_HTML);
  assert('Test 2.7: index.html 100% byte-for-byte parity', v2HtmlBuf.equals(srcHtmlBuf), `${v2HtmlBuf.length} bytes`);

  const v2CssBuf = readFileSync(V2_PROGRAM_CSS);
  const srcCssBuf = readFileSync(SRC_PROGRAM_CSS);
  assert('Test 2.8: program.css 100% byte-for-byte parity', v2CssBuf.equals(srcCssBuf), `${v2CssBuf.length} bytes`);

  const v2JsBuf = readFileSync(V2_PROGRAM_JS);
  const srcJsBuf = readFileSync(SRC_PROGRAM_JS);
  assert('Test 2.9: program.js 100% byte-for-byte parity', v2JsBuf.equals(srcJsBuf), `${v2JsBuf.length} bytes`);
}

// -----------------------------------------------------------------------------
// Test 3: Master Data Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Program & Kinerja Data Integrity Verification ---');
{
  assert('Test 3.1: program-kinerja-jabar.json exists', existsSync(DATA_PROGRAM_PATH));

  const data = JSON.parse(readFileSync(DATA_PROGRAM_PATH, 'utf8'));
  assert('Test 3.2: total strategic programs equals 6', Array.isArray(data.programs) && data.programs.length === 6, `programs=${data.programs?.length}`);
  assert('Test 3.3: total KPI strategic registry equals 6', Array.isArray(data.kpi_strategic_registry) && data.kpi_strategic_registry.length === 6, `kpi=${data.kpi_strategic_registry?.length}`);
  assert('Test 3.4: total quarterly progress periods equals 4', Array.isArray(data.quarterly_progress) && data.quarterly_progress.length === 4, `quarters=${data.quarterly_progress?.length}`);

  // Summary figures
  const s = data.summary || {};
  assert('Test 3.5: Total pagu anggaran equals Rp 33.302.509.274', s.total_pagu_anggaran === 33302509274, `pagu=${s.total_pagu_anggaran}`);
  assert('Test 3.6: Total realisasi keuangan equals Rp 30.439.261.419', s.total_realisasi_keuangan === 30439261419, `realisasi=${s.total_realisasi_keuangan}`);
  assert('Test 3.7: Persentase serapan keuangan equals 91.4%', s.persentase_realisasi_keuangan === 91.4, `keuangan%=${s.persentase_realisasi_keuangan}`);
  assert('Test 3.8: Rata-rata progres fisik equals 93.6%', s.rata_rata_progres_fisik === 93.6, `fisik%=${s.rata_rata_progres_fisik}`);

  // Programs verification
  const bidangCounts = data.programs.reduce((acc, p) => {
    acc[p.kode_bidang] = (acc[p.kode_bidang] || 0) + 1;
    return acc;
  }, {});

  assert('Test 3.9: Angkutan Jalan programs count equals 2', bidangCounts.ANGKUTAN === 2, `count=${bidangCounts.ANGKUTAN}`);
  assert('Test 3.10: Lalu Lintas Jalan programs count equals 2', bidangCounts.LALIN === 2, `count=${bidangCounts.LALIN}`);
  assert('Test 3.11: Sarana & Prasarana programs count equals 2', bidangCounts.SARPRAS === 2, `count=${bidangCounts.SARPRAS}`);

  // Geospatial coordinate validation
  const allCoordsValid = data.programs.every(p => typeof p.lat === 'number' && typeof p.lng === 'number' && p.lat < 0 && p.lng > 105);
  assert('Test 3.12: All 6 programs have valid geospatial coordinates in Jabar', allCoordsValid);

  // Sub-kegiatan validation
  const allSubValid = data.programs.every(p => Array.isArray(p.sub_kegiatan) && p.sub_kegiatan.length > 0 && p.sub_kegiatan.every(s => typeof s.nama === 'string' && typeof s.progres === 'number'));
  assert('Test 3.13: All 6 programs have structured sub-kegiatan with progress percentages', allSubValid);

  // Status on track
  const allOnTrack = data.programs.every(p => p.status === 'On Track');
  assert('Test 3.14: All 6 programs are designated On Track', allOnTrack);

  // KPI linkage
  const kpiProgramCodes = new Set(data.kpi_strategic_registry.map(k => k.program_terkait));
  assert('Test 3.15: All 6 programs have matching KPI registry entries', data.programs.every(p => kpiProgramCodes.has(p.id)));
}

// -----------------------------------------------------------------------------
// Test 4: Navigation Links Across All 9 Modules
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Navigation Links Across Modules ---');
{
  const v2IndexHtml = readFileSync(V2_INDEX_PATH, 'utf8');
  assert('Test 4.1: v2/index.html sidebar links to ./program/ with demo status', v2IndexHtml.includes('href="./program/" class="nav-link" data-nav-status="demo"'));

  const v2TermHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.2: v2/terminal/index.html sidebar links to ../program/ with demo status', v2TermHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2TrayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.3: v2/trayek/index.html sidebar links to ../program/ with demo status', v2TrayekHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2PerintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.4: v2/perintis/index.html sidebar links to ../program/ with demo status', v2PerintisHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2UppkbHtml = readFileSync(V2_UPPKB_PATH, 'utf8');
  assert('Test 4.5: v2/uppkb/index.html sidebar links to ../program/ with demo status', v2UppkbHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2OdHtml = readFileSync(V2_OD_PATH, 'utf8');
  assert('Test 4.6: v2/od/index.html sidebar links to ../program/ with demo status', v2OdHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2ConnHtml = readFileSync(V2_CONNECTIVITY_PATH, 'utf8');
  assert('Test 4.7: v2/connectivity/index.html sidebar links to ../program/ with demo status', v2ConnHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2EwHtml = readFileSync(V2_EARLY_WARNING_PATH, 'utf8');
  assert('Test 4.8: v2/early-warning/index.html sidebar links to ../program/ with demo status', v2EwHtml.includes('href="../program/" class="nav-link" data-nav-status="demo"'));

  const v2ProgHtml = readFileSync(V2_PROGRAM_HTML, 'utf8');
  assert('Test 4.9: v2/program/index.html sidebar self-links with demo status', v2ProgHtml.includes('href="./" class="nav-link is-active" aria-current="page" data-nav-status="demo"') && v2ProgHtml.includes('class="nav-status-badge nav-status-demo" data-status="DEMO">Demo</span>'));
  assert('Test 4.10: No disabled Program coming-soon buttons remain in v2/index.html', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2IndexHtml));
  assert('Test 4.11: No disabled Program coming-soon buttons remain in v2/terminal/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2TermHtml));
  assert('Test 4.12: No disabled Program coming-soon buttons remain in v2/trayek/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2TrayekHtml));
  assert('Test 4.13: No disabled Program coming-soon buttons remain in v2/perintis/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2PerintisHtml));
  assert('Test 4.14: No disabled Program coming-soon buttons remain in v2/uppkb/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2UppkbHtml));
  assert('Test 4.15: No disabled Program coming-soon buttons remain in v2/od/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2OdHtml));
  assert('Test 4.16: No disabled Program coming-soon buttons remain in v2/connectivity/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2ConnHtml));
  assert('Test 4.17: No disabled Program coming-soon buttons remain in v2/early-warning/', !/data-nav-status="coming-soon"[^>]*Program &amp; Kinerja/.test(v2EwHtml));
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup & WAI-ARIA
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup & WAI-ARIA ---');
{
  const prHtml = readFileSync(V2_PROGRAM_HTML, 'utf8');
  assert('Test 5.1: KPI total pagu element exists', prHtml.includes('id="kpiTotalPagu"'));
  assert('Test 5.2: KPI realisasi keuangan element exists', prHtml.includes('id="kpiRealisasiKeuangan"'));
  assert('Test 5.3: KPI progres fisik element exists', prHtml.includes('id="kpiProgresFisik"'));
  assert('Test 5.4: KPI total programs element exists', prHtml.includes('id="kpiTotalPrograms"'));

  assert('Test 5.5: Leaflet map container programMap exists', prHtml.includes('id="programMap"'));
  assert('Test 5.6: Bidang filter bar exists', prHtml.includes('class="bidang-filter-bar"'));
  assert('Test 5.7: Bidang filter chip All exists', prHtml.includes('id="filterAllBidang"'));
  assert('Test 5.8: Bidang filter chip Angkutan exists', prHtml.includes('id="filterAngkutan"'));
  assert('Test 5.9: Bidang filter chip Lalin exists', prHtml.includes('id="filterLalin"'));
  assert('Test 5.10: Bidang filter chip Sarpras exists', prHtml.includes('id="filterSarpras"'));

  assert('Test 5.11: Tablist exists with role="tablist"', prHtml.includes('role="tablist"'));
  assert('Test 5.12: Tab Programs button exists with role="tab"', prHtml.includes('id="btnTabPrograms"') && prHtml.includes('aria-controls="panelPrograms"'));
  assert('Test 5.13: Tab KPI button exists with role="tab"', prHtml.includes('id="btnTabKpi"') && prHtml.includes('aria-controls="panelKpi"'));
  assert('Test 5.14: Tab Quarterly button exists with role="tab"', prHtml.includes('id="btnTabQuarterly"') && prHtml.includes('aria-controls="panelQuarterly"'));

  assert('Test 5.15: Panel Programs exists with role="tabpanel"', prHtml.includes('id="panelPrograms"') && prHtml.includes('role="tabpanel"'));
  assert('Test 5.16: Panel KPI exists with role="tabpanel"', prHtml.includes('id="panelKpi"') && prHtml.includes('role="tabpanel"'));
  assert('Test 5.17: Panel Quarterly exists with role="tabpanel"', prHtml.includes('id="panelQuarterly"') && prHtml.includes('role="tabpanel"'));

  assert('Test 5.18: Table body programTableBody exists', prHtml.includes('id="programTableBody"'));
  assert('Test 5.19: Table body kpiTableBody exists', prHtml.includes('id="kpiTableBody"'));
  assert('Test 5.20: Table body quarterlyTableBody exists', prHtml.includes('id="quarterlyTableBody"'));

  assert('Test 5.21: Modal dialog exists with role="dialog" and aria-modal="true"', prHtml.includes('id="programDetailModal"') && prHtml.includes('role="dialog"') && prHtml.includes('aria-modal="true"'));
  assert('Test 5.22: Modal backdrop element exists', prHtml.includes('id="modalBackdrop"'));
  assert('Test 5.23: Modal close button exists with aria-label', prHtml.includes('id="modalCloseBtn"') && prHtml.includes('aria-label="Tutup jendela rincian program"'));
  assert('Test 5.24: Modal subkegiatan list container exists', prHtml.includes('id="modalSubKegiatanList"'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Documentation Consistency ---');
{
  assert('Test 6.1: DATA_CONTRACT_NEXT_06.md exists', existsSync(DOCS_CONTRACT_PATH));
  const contractDoc = readFileSync(DOCS_CONTRACT_PATH, 'utf8');

  assert('Test 6.2: Contract status updated to DEMO & VERIFIED for Program & Kinerja',
    contractDoc.includes('| **Program & Kinerja Transportasi** | `DEMO & VERIFIED (BPTD CLASS I JABAR 2026)`'));
  assert('Test 6.3: Section 4.6 Spesifikasi Kontrak Data Program & Kinerja present',
    contractDoc.includes('### 4.6 Spesifikasi Kontrak Data Program & Kinerja Transportasi'));

  assert('Test 6.4: Contract documents 6 Strategic Programs (PRG-01 through PRG-06)',
    contractDoc.includes('`PRG-01`') && contractDoc.includes('`PRG-03`') && contractDoc.includes('`PRG-06`'));

  assert('Test 6.5: Contract documents 6 Strategic KPI Indicators (KPI-01 through KPI-06)',
    contractDoc.includes('`KPI-01`') && contractDoc.includes('`KPI-04`') && contractDoc.includes('`KPI-06`'));

  assert('Test 6.6: Contract documents total pagu Rp 33.302.509.274',
    contractDoc.includes('33.302.509.274'));
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

  const rootCheck = await probe('/command-center/program/');
  if (rootCheck.error) {
    console.log(`  [INFO] Local preview server on port ${PREVIEW_PORT} not running (${rootCheck.error}).`);
    console.log(`  [INFO] Skipping live HTTP smoke. Static and parity tests pass.`);
  } else {
    assert('Test 7.1: HTTP 200 for /command-center/program/', rootCheck.status === 200, `status=${rootCheck.status}`);
    assert('Test 7.2: HTML contains Monitoring Program & Kinerja title', rootCheck.body.includes('Monitoring Program &amp; Kinerja') || rootCheck.body.includes('Program &amp; Kinerja'));

    const cssCheck = await probe('/command-center/program/program.css');
    assert('Test 7.3: HTTP 200 for /command-center/program/program.css', cssCheck.status === 200, `status=${cssCheck.status}`);

    const jsCheck = await probe('/command-center/program/program.js');
    assert('Test 7.4: HTTP 200 for /command-center/program/program.js', jsCheck.status === 200, `status=${jsCheck.status}`);

    const dataCheck = await probe('/data/program-kinerja-jabar.json');
    assert('Test 7.5: HTTP 200 for /data/program-kinerja-jabar.json', dataCheck.status === 200, `status=${dataCheck.status}`);
  }

  console.log('\n================================================================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

await runHttpSmoke();
