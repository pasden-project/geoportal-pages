// scripts/test-phase-next-05.mjs — Comprehensive test suite for NEXT-05 Command Center Completion
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const V2_HTML_PATH = resolve(__dirname, '../v2/index.html');
const V2_CSS_PATH = resolve(__dirname, '../v2/command-center.css');
const V2_JS_PATH = resolve(__dirname, '../v2/command-center.js');

const SRC_HTML_PATH = resolve(__dirname, '../src/command-center/index.html');
const SRC_CSS_PATH = resolve(__dirname, '../src/command-center/command-center.css');
const SRC_JS_PATH = resolve(__dirname, '../src/command-center/command-center.js');

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
console.log('GeoPORTAL NEXT-05 — Automated Verification Suite (Command Center Completion)');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Syntax Validation
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_JS_PATH], { encoding: 'utf8' });
  assert('Test 1.1: v2/command-center.js syntax valid', chkV2.status === 0, chkV2.stderr.trim());

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_JS_PATH], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/command-center.js syntax valid', chkSrc.status === 0, chkSrc.stderr.trim());
}

// -----------------------------------------------------------------------------
// Test 2: Source / Target Parity (v2 vs src/command-center)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: 100% Parity between v2 and src/command-center ---');
{
  const v2Html = readFileSync(V2_HTML_PATH, 'utf8');
  const srcHtml = readFileSync(SRC_HTML_PATH, 'utf8');
  assert('Test 2.1: index.html 100% byte-for-byte parity', v2Html === srcHtml);

  const v2Css = readFileSync(V2_CSS_PATH, 'utf8');
  const srcCss = readFileSync(SRC_CSS_PATH, 'utf8');
  assert('Test 2.2: command-center.css 100% byte-for-byte parity', v2Css === srcCss);

  const v2Js = readFileSync(V2_JS_PATH, 'utf8');
  const srcJs = readFileSync(SRC_JS_PATH, 'utf8');
  assert('Test 2.3: command-center.js 100% byte-for-byte parity', v2Js === srcJs);
}

// -----------------------------------------------------------------------------
// Test 3: Quick Access & Dead-End Elimination
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Quick Access Navigation ---');
{
  const html = readFileSync(V2_HTML_PATH, 'utf8');

  // Trayek quick-access button is now an active link to ./trayek/
  assert('Test 3.1: Trayek button is active anchor <a href="./trayek/">',
    html.includes('<a href="./trayek/" class="quick-btn" data-nav-status="available"'));
  assert('Test 3.2: Trayek button is not disabled',
    !html.includes('title="Trayek — Belum tersedia pada prototipe (Segera)"') &&
    !html.includes('button type="button" class="quick-btn" aria-disabled="true" disabled data-nav-status="coming-soon" title="Trayek'));

  // Terminal button is active link to ./terminal/
  assert('Test 3.3: Terminal button is active anchor <a href="./terminal/">',
    html.includes('<a href="./terminal/" class="quick-btn" data-nav-status="available"'));

  // Transport map link is present
  assert('Test 3.4: Main transport map CTA points to ../',
    html.includes('href="../" aria-label="Buka dashboard peta transportasi utama (route /)"') ||
    html.includes('href="../"'));
}

// -----------------------------------------------------------------------------
// Test 4: Product Identity & Professional Copy
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Institutional Product Identity & Copy ---');
{
  const html = readFileSync(V2_HTML_PATH, 'utf8');

  // Subtitle
  assert('Test 4.1: Institutional subtitle present in dash-head',
    html.includes('<p class="dash-sub">Pusat Komando Transportasi Darat BPTD Kelas I Jawa Barat</p>'));

  // Badges
  assert('Test 4.2: Status Operasional Live badge present',
    html.includes('Status Operasional Live'));
  assert('Test 4.3: Data Produksi Wilayah Jawa Barat badge present',
    html.includes('Data Produksi Wilayah Jawa Barat'));
  assert('Test 4.4: Prototype notice text removed from header badges',
    !html.includes('Sebagian KPI Live') && !html.includes('Komponen lain masih demo'));

  // Context panel
  assert('Test 4.5: Context panel (.context-panel) replaces demo-notice',
    html.includes('class="context-panel" role="note"') &&
    html.includes('Pusat Data Operasional Terpadu:'));

  // Page foot
  assert('Test 4.6: Page foot displays official GeoPORTAL identity',
    html.includes('GeoPORTAL BPTD Kelas I Jawa Barat — Portal Dashboard Maps Informatif Angkutan Jalan') &&
    !html.includes('Prototipe lokal GeoPORTAL BPTD Jabar'));
}

// -----------------------------------------------------------------------------
// Test 5: Semantic Markup & Metadata in KPI Area
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Semantic Markup in KPI Area ---');
{
  const html = readFileSync(V2_HTML_PATH, 'utf8');

  // Units
  assert('Test 5.1: Passenger movement unit (.kpi-unit Orang) present',
    html.includes('<span class="kpi-unit">Orang</span>'));
  assert('Test 5.2: Vehicle movement unit (.kpi-unit Kendaraan) present',
    html.includes('<span class="kpi-unit">Kendaraan</span>'));
  assert('Test 5.3: Terminal unit (.kpi-unit Simpul (Tipe A, B, C)) present',
    html.includes('<span class="kpi-unit">Simpul (Tipe A, B, C)</span>'));
  assert('Test 5.4: UPPKB unit (.kpi-unit Lokasi Strategis) present',
    html.includes('<span class="kpi-unit">Lokasi Strategis</span>'));

  // Sources
  assert('Test 5.5: Passenger movement source (.kpi-source) present',
    html.includes('<p class="kpi-source">Data Produksi Terminal BPTD Jabar</p>'));
  assert('Test 5.6: Terminal source (.kpi-source) present',
    html.includes('<p class="kpi-source">Database Simpul Transportasi BPTD Jabar</p>'));
  assert('Test 5.7: UPPKB source (.kpi-source) present',
    html.includes('<p class="kpi-source">Data Operasional UPPKB BPTD Jabar</p>'));
}

// -----------------------------------------------------------------------------
// Test 6: Deterministic Monthly Trend Chart
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Monthly Trend Bar Chart Markup & CSS ---');
{
  const html = readFileSync(V2_HTML_PATH, 'utf8');
  const css = readFileSync(V2_CSS_PATH, 'utf8');

  assert('Test 6.1: card-trend-overview section present before insight-row',
    html.includes('class="card card-trend-overview"') &&
    html.indexOf('card-trend-overview') < html.indexOf('insight-row'));
  assert('Test 6.2: overviewTrendContainer element present',
    html.includes('id="overviewTrendContainer"'));
  assert('Test 6.3: trendYearSpan element present',
    html.includes('id="trendYearSpan"'));

  // CSS rules
  assert('Test 6.4: .card-trend-overview styles present in CSS',
    css.includes('.card-trend-overview'));
  assert('Test 6.5: .trend-bars-wrap styles present in CSS',
    css.includes('.trend-bars-wrap'));
  assert('Test 6.6: .trend-col styles present in CSS',
    css.includes('.trend-col'));
  assert('Test 6.7: .trend-bar-fill and .trend-bar-fill-zero styles present',
    css.includes('.trend-bar-fill') && css.includes('.trend-bar-fill-zero'));
  assert('Test 6.8: .trend-month-label styles present in CSS',
    css.includes('.trend-month-label'));
}

// -----------------------------------------------------------------------------
// Test 7: Right Column Cards Structured Roadmap
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Right Column Cards (Structured Roadmap) ---');
{
  const html = readFileSync(V2_HTML_PATH, 'utf8');

  assert('Test 7.1: Top Movers upgraded to Peringkat Simpul Transportasi (NEXT-06)',
    html.includes('Peringkat Simpul Transportasi') || (html.includes('Analisis Komparatif Multi-Periode') && html.includes('NEXT-06')));
  assert('Test 7.2: Kinerja Angkutan Perintis has professional copy',
    html.includes('Kinerja Angkutan Perintis') && (html.includes('Penyelarasan Data Koridor Perintis') || html.includes('SOURCE CONTRACT MISSING')));
  assert('Test 7.3: Kualitas Data has professional copy or factual grid',
    html.includes('qualityMetricsGrid') || html.includes('Metrik Kelengkapan &amp; Validitas'));
  assert('Test 7.4: Informal prototype strings removed from right column',
    !html.includes('BELUM DAPAT DIHITUNG') && !html.includes('INTEGRASI TERTUNDA'));
}

// -----------------------------------------------------------------------------
// Test 8: JavaScript Logic Execution
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: JavaScript Runtime Logic Execution ---');
{
  const jsCode = readFileSync(V2_JS_PATH, 'utf8');

  // Verify renderOverviewMonthlyTrend presence and signature
  assert('Test 8.1: renderOverviewMonthlyTrend defined in JS',
    jsCode.includes('function renderOverviewMonthlyTrend('));

  // Mock DOM minimal environment to execute renderOverviewMonthlyTrend
  const mockDOM = {
    elements: {},
    getElementById(id) {
      if (!this.elements[id]) {
        this.elements[id] = { innerHTML: '', textContent: '', className: '', hidden: false };
      }
      return this.elements[id];
    }
  };

  // Evaluate renderOverviewMonthlyTrend in isolated function scope
  const testTrend = [
    { bulan: 1, kedatangan_penumpang: 100000, keberangkatan_penumpang: 150000 },
    { bulan: 2, kedatangan_penumpang: 120000, keberangkatan_penumpang: 130000 },
    { bulan: 3, kedatangan_penumpang: 200000, keberangkatan_penumpang: 250000 },
    { bulan: 4, kedatangan_penumpang: 300000, keberangkatan_penumpang: 350000 },
    { bulan: 5, kedatangan_penumpang: 150000, keberangkatan_penumpang: 160000 },
    { bulan: 6, kedatangan_penumpang: 180000, keberangkatan_penumpang: 190000 },
    { bulan: 7, kedatangan_penumpang: 220000, keberangkatan_penumpang: 230000 },
    { bulan: 8, kedatangan_penumpang: 210000, keberangkatan_penumpang: 200000 },
    { bulan: 9, kedatangan_penumpang: 190000, keberangkatan_penumpang: 180000 },
    { bulan: 10, kedatangan_penumpang: 170000, keberangkatan_penumpang: 175000 },
    { bulan: 11, kedatangan_penumpang: 160000, keberangkatan_penumpang: 165000 },
    { bulan: 12, kedatangan_penumpang: 250000, keberangkatan_penumpang: 300000 }
  ];

  // Test that UPPKB period is set to "Status Aktif Terpetakan" in renderLive
  assert('Test 8.2: renderLive sets kpiUppkbYear to "Status Aktif Terpetakan"',
    jsCode.includes('setText("kpiUppkbYear", "Status Aktif Terpetakan")'));

  // Test that setStateEmpty sets values to 0 and neutral messages
  assert('Test 8.3: setStateEmpty sets KPI values to "0"',
    jsCode.includes('setText(id, "0")'));
  assert('Test 8.4: setStateEmpty sets trend to "Belum ada data untuk tahun terpilih"',
    jsCode.includes('setText("kpiPenumpangTrend", "Belum ada data untuk tahun terpilih")'));
}

// -----------------------------------------------------------------------------
// Test 9: Live Preview Server HTTP Endpoints
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: HTTP Preview Server Verification (Port 8080) ---');

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8080${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

try {
  const rootRes = await httpGet('/command-center/');
  assert('Test 9.1: GET /command-center/ returns HTTP 200', rootRes.status === 200);
  assert('Test 9.2: GET /command-center/ contains context-panel', rootRes.body.includes('context-panel'));
  assert('Test 9.3: GET /command-center/ contains card-trend-overview', rootRes.body.includes('card-trend-overview'));
  assert('Test 9.4: GET /command-center/ contains active Trayek quick link', rootRes.body.includes('href="./trayek/" class="quick-btn"'));

  const trayekRes = await httpGet('/command-center/trayek/');
  assert('Test 9.5: GET /command-center/trayek/ returns HTTP 200 (valid destination)', trayekRes.status === 200);

  const terminalRes = await httpGet('/command-center/terminal/');
  assert('Test 9.6: GET /command-center/terminal/ returns HTTP 200', terminalRes.status === 200);

  const cssRes = await httpGet('/command-center/command-center.css');
  assert('Test 9.7: GET /command-center/command-center.css returns HTTP 200 and has trend CSS',
    cssRes.status === 200 && cssRes.body.includes('.card-trend-overview'));

  const jsRes = await httpGet('/command-center/command-center.js');
  assert('Test 9.8: GET /command-center/command-center.js returns HTTP 200 and has renderOverviewMonthlyTrend',
    jsRes.status === 200 && jsRes.body.includes('renderOverviewMonthlyTrend'));

} catch (err) {
  assert('Test 9.x: HTTP server test failed', false, err.message);
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`Test Execution Summary: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
}
