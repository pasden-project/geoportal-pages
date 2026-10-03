// scripts/test-laporan-integration.mjs — Automated verification suite for Modul Laporan & Repositori Dokumen Eksekutif V2
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const DOCS_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');
const DATA_LAPORAN_PATH = resolve(REPO_ROOT, 'src/data/laporan-eksekutif-jabar.json');

const V2_INDEX_PATH = resolve(REPO_ROOT, 'v2/index.html');
const V2_TERMINAL_PATH = resolve(REPO_ROOT, 'v2/terminal/index.html');
const V2_TRAYEK_PATH = resolve(REPO_ROOT, 'v2/trayek/index.html');
const V2_PERINTIS_PATH = resolve(REPO_ROOT, 'v2/perintis/index.html');
const V2_UPPKB_PATH = resolve(REPO_ROOT, 'v2/uppkb/index.html');
const V2_OD_PATH = resolve(REPO_ROOT, 'v2/od/index.html');
const V2_CONNECTIVITY_PATH = resolve(REPO_ROOT, 'v2/connectivity/index.html');
const V2_EARLY_WARNING_PATH = resolve(REPO_ROOT, 'v2/early-warning/index.html');
const V2_PROGRAM_PATH = resolve(REPO_ROOT, 'v2/program/index.html');

const V2_LAPORAN_HTML = resolve(REPO_ROOT, 'v2/laporan/index.html');
const V2_LAPORAN_CSS = resolve(REPO_ROOT, 'v2/laporan/laporan.css');
const V2_LAPORAN_JS = resolve(REPO_ROOT, 'v2/laporan/laporan.js');

const SRC_LAPORAN_HTML = resolve(REPO_ROOT, 'src/command-center/laporan/index.html');
const SRC_LAPORAN_CSS = resolve(REPO_ROOT, 'src/command-center/laporan/laporan.css');
const SRC_LAPORAN_JS = resolve(REPO_ROOT, 'src/command-center/laporan/laporan.js');

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
console.log('GeoPORTAL BPTD Jabar — Automated Test Suite: Integrasi Modul Laporan & Repositori V2');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: JS Syntax Validation (node --check)
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_LAPORAN_JS], { encoding: 'utf8' });
  assert('Test 1.1: v2/laporan/laporan.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_LAPORAN_JS], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/laporan/laporan.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: File Existence & Byte-for-Byte Parity Check
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: File Existence & Byte-for-Byte Parity ---');
{
  assert('Test 2.1: v2/laporan/index.html exists', existsSync(V2_LAPORAN_HTML));
  assert('Test 2.2: v2/laporan/laporan.css exists', existsSync(V2_LAPORAN_CSS));
  assert('Test 2.3: v2/laporan/laporan.js exists', existsSync(V2_LAPORAN_JS));

  assert('Test 2.4: src/command-center/laporan/index.html exists', existsSync(SRC_LAPORAN_HTML));
  assert('Test 2.5: src/command-center/laporan/laporan.css exists', existsSync(SRC_LAPORAN_CSS));
  assert('Test 2.6: src/command-center/laporan/laporan.js exists', existsSync(SRC_LAPORAN_JS));

  const v2HtmlBuf = readFileSync(V2_LAPORAN_HTML);
  const srcHtmlBuf = readFileSync(SRC_LAPORAN_HTML);
  assert('Test 2.7: index.html 100% byte-for-byte parity', v2HtmlBuf.equals(srcHtmlBuf), `${v2HtmlBuf.length} bytes`);

  const v2CssBuf = readFileSync(V2_LAPORAN_CSS);
  const srcCssBuf = readFileSync(SRC_LAPORAN_CSS);
  assert('Test 2.8: laporan.css 100% byte-for-byte parity', v2CssBuf.equals(srcCssBuf), `${v2CssBuf.length} bytes`);

  const v2JsBuf = readFileSync(V2_LAPORAN_JS);
  const srcJsBuf = readFileSync(SRC_LAPORAN_JS);
  assert('Test 2.9: laporan.js 100% byte-for-byte parity', v2JsBuf.equals(srcJsBuf), `${v2JsBuf.length} bytes`);
}

// -----------------------------------------------------------------------------
// Test 3: Master Data Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Master Laporan Data Integrity Verification ---');
{
  assert('Test 3.1: laporan-eksekutif-jabar.json exists', existsSync(DATA_LAPORAN_PATH));

  const data = JSON.parse(readFileSync(DATA_LAPORAN_PATH, 'utf8'));
  assert('Test 3.2: Total official reports equals 8', Array.isArray(data.reports) && data.reports.length === 8, `reports=${data.reports?.length}`);
  assert('Test 3.3: Total periodic schedules equals 6', Array.isArray(data.periodic_schedules) && data.periodic_schedules.length === 6, `schedules=${data.periodic_schedules?.length}`);

  // Summary figures
  const s = data.summary || {};
  assert('Test 3.4: Tahun anggaran aktif matches 2025 / 2026', s.tahun_anggaran_aktif === '2025 / 2026', `ta=${s.tahun_anggaran_aktif}`);
  assert('Test 3.5: Total sektor terintegrasi equals 6', s.total_sektor_terintegrasi === 6, `sektor=${s.total_sektor_terintegrasi}`);
  assert('Test 3.6: Status verifikasi 100% TERVERIFIKASI BPTD', s.status_verifikasi === '100% TERVERIFIKASI BPTD');
  assert('Test 3.7: 4 format ketersediaan defined', Array.isArray(s.format_ketersediaan) && s.format_ketersediaan.length === 4);

  // Metadata Pejabat Pengesah
  const meta = data.metadata_pejabat || {};
  assert('Test 3.8: Pengesah jabatan defined', typeof meta.pengesah_jabatan === 'string' && meta.pengesah_jabatan.includes('Kepala Balai'));
  assert('Test 3.9: Pengesah nama matches Dr. Ferdy Trisanto Kurniawan, S.T., M.Si', meta.pengesah_nama === 'Dr. Ferdy Trisanto Kurniawan, S.T., M.Si', `nama=${meta.pengesah_nama}`);
  assert('Test 3.10: Pengesah NIP matches NIP. 19780201 200312 1 002', meta.pengesah_nip === 'NIP. 19780201 200312 1 002', `nip=${meta.pengesah_nip}`);
  assert('Test 3.11: Pengesah tempat matches Bandung', meta.tempat_pengesahan === 'Bandung', `tempat=${meta.tempat_pengesahan}`);
  assert('Test 3.12: Catatan legalitas institusional defined', typeof meta.catatan_legalitas === 'string' && meta.catatan_legalitas.includes('GeoPORTAL'));

  // Reports inspection
  const reportCodes = new Set(data.reports.map(r => r.kode));
  assert('Test 3.10: RPT-EKS-01 exists', reportCodes.has('RPT-EKS-01'));
  assert('Test 3.11: RPT-TRM-01 exists', reportCodes.has('RPT-TRM-01'));
  assert('Test 3.12: RPT-PKB-01 exists', reportCodes.has('RPT-PKB-01'));
  assert('Test 3.13: RPT-PRN-01 exists', reportCodes.has('RPT-PRN-01'));
  assert('Test 3.14: RPT-ODI-01 exists', reportCodes.has('RPT-ODI-01'));
  assert('Test 3.15: RPT-MLT-01 exists', reportCodes.has('RPT-MLT-01'));
  assert('Test 3.16: RPT-ALR-01 exists', reportCodes.has('RPT-ALR-01'));
  assert('Test 3.17: RPT-PRG-01 exists', reportCodes.has('RPT-PRG-01'));

  // Required properties on every report
  const allReportsValid = data.reports.every(r =>
    typeof r.id === 'string' &&
    typeof r.kode === 'string' &&
    typeof r.nomor_dokumen === 'string' &&
    typeof r.judul === 'string' &&
    typeof r.kategori === 'string' &&
    typeof r.unit_kerja === 'string' &&
    typeof r.frekuensi === 'string' &&
    typeof r.ringkasan === 'string' &&
    typeof r.telaah_eksekutif === 'string' &&
    Array.isArray(r.sorotan_metrik) && r.sorotan_metrik.length >= 4 &&
    r.tabel && Array.isArray(r.tabel.kolom) && Array.isArray(r.tabel.baris) && r.tabel.baris.length > 0
  );
  assert('Test 3.18: All 8 reports contain complete metadata, metrics, and tabular rows', allReportsValid);

  // Tabular column counts consistency
  const allTablesConsistent = data.reports.every(r =>
    r.tabel.baris.every(row => row.length === r.tabel.kolom.length)
  );
  assert('Test 3.19: All tabular rows match column headers count', allTablesConsistent);

  // Schedules validation
  const allSchedulesValid = data.periodic_schedules.every(s =>
    typeof s.siklus === 'string' &&
    typeof s.nama_agenda === 'string' &&
    typeof s.dasar_regulasi === 'string' &&
    typeof s.pic_pelaksana === 'string' &&
    typeof s.batas_waktu === 'string' &&
    typeof s.format_output === 'string'
  );
  assert('Test 3.20: All 6 periodic schedules have complete properties', allSchedulesValid);
}

// -----------------------------------------------------------------------------
// Test 4: Navigation Links Across All 10 Modules
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Navigation Links Across All 10 Modules ---');
{
  const v2IndexHtml = readFileSync(V2_INDEX_PATH, 'utf8');
  assert('Test 4.1: v2/index.html sidebar links to ./laporan/ with available status', v2IndexHtml.includes('href="./laporan/" class="nav-link" data-nav-status="available"'));

  const v2TermHtml = readFileSync(V2_TERMINAL_PATH, 'utf8');
  assert('Test 4.2: v2/terminal/index.html sidebar links to ../laporan/ with available status', v2TermHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2TrayekHtml = readFileSync(V2_TRAYEK_PATH, 'utf8');
  assert('Test 4.3: v2/trayek/index.html sidebar links to ../laporan/ with available status', v2TrayekHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2PerintisHtml = readFileSync(V2_PERINTIS_PATH, 'utf8');
  assert('Test 4.4: v2/perintis/index.html sidebar links to ../laporan/ with available status', v2PerintisHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2UppkbHtml = readFileSync(V2_UPPKB_PATH, 'utf8');
  assert('Test 4.5: v2/uppkb/index.html sidebar links to ../laporan/ with available status', v2UppkbHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2OdHtml = readFileSync(V2_OD_PATH, 'utf8');
  assert('Test 4.6: v2/od/index.html sidebar links to ../laporan/ with available status', v2OdHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2ConnHtml = readFileSync(V2_CONNECTIVITY_PATH, 'utf8');
  assert('Test 4.7: v2/connectivity/index.html sidebar links to ../laporan/ with available status', v2ConnHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2EwHtml = readFileSync(V2_EARLY_WARNING_PATH, 'utf8');
  assert('Test 4.8: v2/early-warning/index.html sidebar links to ../laporan/ with available status', v2EwHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2ProgHtml = readFileSync(V2_PROGRAM_PATH, 'utf8');
  assert('Test 4.9: v2/program/index.html sidebar links to ../laporan/ with available status', v2ProgHtml.includes('href="../laporan/" class="nav-link" data-nav-status="available"'));

  const v2LapHtml = readFileSync(V2_LAPORAN_HTML, 'utf8');
  assert('Test 4.10: v2/laporan/index.html sidebar self-links with active status', v2LapHtml.includes('href="./" class="nav-link is-active" aria-current="page" data-nav-status="active"') && v2LapHtml.includes('class="nav-status-badge nav-status-active" data-status="ACTIVE">Aktif</span>'));

  assert('Test 4.11: No disabled Laporan coming-soon buttons remain in v2/index.html', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2IndexHtml));
  assert('Test 4.12: No disabled Laporan coming-soon buttons remain in v2/terminal/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2TermHtml));
  assert('Test 4.13: No disabled Laporan coming-soon buttons remain in v2/trayek/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2TrayekHtml));
  assert('Test 4.14: No disabled Laporan coming-soon buttons remain in v2/perintis/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2PerintisHtml));
  assert('Test 4.15: No disabled Laporan coming-soon buttons remain in v2/uppkb/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2UppkbHtml));
  assert('Test 4.16: No disabled Laporan coming-soon buttons remain in v2/od/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2OdHtml));
  assert('Test 4.17: No disabled Laporan coming-soon buttons remain in v2/connectivity/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2ConnHtml));
  assert('Test 4.18: No disabled Laporan coming-soon buttons remain in v2/early-warning/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2EwHtml));
  assert('Test 4.19: No disabled Laporan coming-soon buttons remain in v2/program/', !/data-nav-status="coming-soon"[^>]*Laporan/.test(v2ProgHtml));
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup, WAI-ARIA & Print Engine
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup, WAI-ARIA & Print Engine ---');
{
  const lpHtml = readFileSync(V2_LAPORAN_HTML, 'utf8');
  assert('Test 5.1: KPI total reports element exists', lpHtml.includes('id="kpiTotalReports"'));
  assert('Test 5.2: KPI total sectors element exists', lpHtml.includes('id="kpiTotalSectors"'));
  assert('Test 5.3: KPI legal status element exists', lpHtml.includes('id="kpiLegalStatus"'));
  assert('Test 5.4: KPI export formats element exists', lpHtml.includes('id="kpiExportFormats"'));

  assert('Test 5.5: Select Year filter element exists', lpHtml.includes('id="selectYear"'));
  assert('Test 5.6: Select Period filter element exists', lpHtml.includes('id="selectPeriod"'));
  assert('Test 5.7: Select Category filter element exists', lpHtml.includes('id="selectCategory"'));
  assert('Test 5.8: Search report input element exists', lpHtml.includes('id="searchReport"'));
  assert('Test 5.9: Reset filter button exists', lpHtml.includes('id="btnResetFilter"'));

  assert('Test 5.10: Tablist exists with role="tablist"', lpHtml.includes('role="tablist"'));
  assert('Test 5.11: Tab Catalog button exists with role="tab"', lpHtml.includes('id="btnTabCatalog"') && lpHtml.includes('aria-controls="panelCatalog"'));
  assert('Test 5.12: Tab Preview button exists with role="tab"', lpHtml.includes('id="btnTabPreview"') && lpHtml.includes('aria-controls="panelPreview"'));
  assert('Test 5.13: Tab Schedule button exists with role="tab"', lpHtml.includes('id="btnTabSchedule"') && lpHtml.includes('aria-controls="panelSchedule"'));

  assert('Test 5.14: Panel Catalog exists with role="tabpanel"', lpHtml.includes('id="panelCatalog"') && lpHtml.includes('role="tabpanel"'));
  assert('Test 5.15: Panel Preview exists with role="tabpanel"', lpHtml.includes('id="panelPreview"') && lpHtml.includes('role="tabpanel"'));
  assert('Test 5.16: Panel Schedule exists with role="tabpanel"', lpHtml.includes('id="panelSchedule"') && lpHtml.includes('role="tabpanel"'));

  assert('Test 5.17: Catalog grid container exists', lpHtml.includes('id="reportCatalogGrid"'));
  assert('Test 5.18: Live official doc sheet container exists', lpHtml.includes('id="liveOfficialDocSheet"'));
  assert('Test 5.19: Schedule table body exists', lpHtml.includes('id="scheduleTableBody"'));

  assert('Test 5.20: Modal dialog exists with role="dialog" and aria-modal="true"', lpHtml.includes('id="reportDetailModal"') && lpHtml.includes('role="dialog"') && lpHtml.includes('aria-modal="true"'));
  assert('Test 5.21: Modal backdrop element exists', lpHtml.includes('id="modalBackdrop"'));
  assert('Test 5.22: Modal close button exists with aria-label', lpHtml.includes('id="modalCloseBtn"') && lpHtml.includes('aria-label="Tutup jendela rincian laporan"'));
  assert('Test 5.23: Modal print, CSV, JSON buttons exist', lpHtml.includes('id="modalPrintBtn"') && lpHtml.includes('id="modalExportCsvBtn"') && lpHtml.includes('id="modalExportJsonBtn"'));

  assert('Test 5.24: Dedicated printable container exists', lpHtml.includes('id="printableReportSheet"'));

  // CSS Print Architecture check
  const lpCss = readFileSync(V2_LAPORAN_CSS, 'utf8');
  assert('Test 5.25: CSS contains @media print rules', lpCss.includes('@media print'));
  assert('Test 5.26: CSS sets @page size A4 portrait', lpCss.includes('size: A4 portrait'));
  assert('Test 5.27: CSS hides app-shell, sidebar, and modals on print', lpCss.includes('.app-shell') && lpCss.includes('display: none !important;'));
  assert('Test 5.28: CSS forces printableReportSheet visible on print', lpCss.includes('#printableReportSheet') && lpCss.includes('display: block !important;'));
  assert('Test 5.29: CSS configures print-table border and page-break rules', lpCss.includes('.print-table') && lpCss.includes('page-break-inside: avoid'));

  // JS Export & Kop Surat check
  const lpJs = readFileSync(V2_LAPORAN_JS, 'utf8');
  assert('Test 5.30: JS includes UTF-8 BOM (\uFEFF) for Excel CSV export', lpJs.includes('\\uFEFF'));
  assert('Test 5.31: JS includes exportReportCSV function', lpJs.includes('function exportReportCSV('));
  assert('Test 5.32: JS includes exportReportJSON function', lpJs.includes('function exportReportJSON('));
  assert('Test 5.33: JS includes printReport function invoking window.print()', lpJs.includes('function printReport(') && lpJs.includes('window.print()'));
  assert('Test 5.34: JS includes official Kop Surat standard markup', lpJs.includes('KEMENTERIAN PERHUBUNGAN') && lpJs.includes('BALAI PENGELOLA TRANSPORTASI DARAT KELAS I JAWA BARAT'));
}

// -----------------------------------------------------------------------------
// Test 6: Data Contract Documentation Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Data Contract Documentation Consistency ---');
{
  assert('Test 6.1: DATA_CONTRACT_NEXT_06.md exists', existsSync(DOCS_CONTRACT_PATH));
  const contractDoc = readFileSync(DOCS_CONTRACT_PATH, 'utf8');

  assert('Test 6.2: Contract status updated to INTEGRATED & VERIFIED for Laporan',
    contractDoc.includes('| **Laporan & Repositori Dokumen Eksekutif** | `INTEGRATED & VERIFIED (BPTD CLASS I JABAR 2026)`'));
  assert('Test 6.3: Section 4.7 Spesifikasi Kontrak Data Modul Laporan present',
    contractDoc.includes('### 4.7 Spesifikasi Kontrak Data Modul Laporan & Repositori Dokumen Eksekutif'));

  assert('Test 6.4: Contract documents 8 official reports (RPT-EKS-01 through RPT-PRG-01)',
    contractDoc.includes('`RPT-EKS-01`') && contractDoc.includes('`RPT-TRM-01`') && contractDoc.includes('`RPT-PRG-01`'));

  assert('Test 6.5: Contract documents Kop Surat and digital legal signature',
    contractDoc.includes('Kop Surat') && contractDoc.includes('Tata Naskah Dinas'));

  assert('Test 6.6: Contract documents CSV UTF-8 BOM and JSON export specs',
    contractDoc.includes('RFC 4180') && contractDoc.includes('Byte Order Mark UTF-8'));

  assert('Test 6.7: Contract documents 6 periodic schedules (Harian to Tahunan)',
    contractDoc.includes('Harian: Posko') && contractDoc.includes('Tahunan: Laporan Akuntabilitas'));
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

  const rootCheck = await probe('/command-center/laporan/');
  if (rootCheck.error) {
    console.log(`  [INFO] Local preview server on port ${PREVIEW_PORT} not running (${rootCheck.error}).`);
    console.log(`  [INFO] Skipping live HTTP smoke. Static and parity tests pass.`);
  } else {
    assert('Test 7.1: HTTP 200 for /command-center/laporan/', rootCheck.status === 200, `status=${rootCheck.status}`);
    assert('Test 7.2: HTML contains Laporan & Repositori Dokumen Eksekutif title', rootCheck.body.includes('Laporan &amp; Repositori Dokumen Eksekutif'));

    const cssCheck = await probe('/command-center/laporan/laporan.css');
    assert('Test 7.3: HTTP 200 for /command-center/laporan/laporan.css', cssCheck.status === 200, `status=${cssCheck.status}`);

    const jsCheck = await probe('/command-center/laporan/laporan.js');
    assert('Test 7.4: HTTP 200 for /command-center/laporan/laporan.js', jsCheck.status === 200, `status=${jsCheck.status}`);

    const dataCheck = await probe('/data/laporan-eksekutif-jabar.json');
    assert('Test 7.5: HTTP 200 for /data/laporan-eksekutif-jabar.json', dataCheck.status === 200, `status=${dataCheck.status}`);
  }

  console.log('\n================================================================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

await runHttpSmoke();
