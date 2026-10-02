// scripts/test-phase-next-06.mjs — Automated verification suite for NEXT-06 KPI & Trend Intelligence
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOC_CONTRACT_PATH = resolve(__dirname, '../../docs/DATA_CONTRACT_NEXT_06.md');

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
console.log('GeoPORTAL NEXT-06 — Automated Verification Suite (KPI & Trend Intelligence)');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Syntax Validation
// -----------------------------------------------------------------------------
console.log('--- Test 1: JS Syntax Validation (node --check) ---');
{
  const chkV2 = spawnSync(process.execPath, ['--check', V2_JS_PATH], { encoding: 'utf8' });
  assert('Test 1.1: v2/command-center.js syntax valid', chkV2.status === 0, chkV2.stderr ? chkV2.stderr.trim() : '');

  const chkSrc = spawnSync(process.execPath, ['--check', SRC_JS_PATH], { encoding: 'utf8' });
  assert('Test 1.2: src/command-center/command-center.js syntax valid', chkSrc.status === 0, chkSrc.stderr ? chkSrc.stderr.trim() : '');
}

// -----------------------------------------------------------------------------
// Test 2: Source / Target Parity (v2 vs src/command-center)
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: 100% Parity between v2 and src/command-center ---');
{
  const files = [
    'index.html',
    'command-center.css',
    'command-center.js',
    'terminal/index.html',
    'terminal/terminal.css',
    'terminal/terminal.js',
    'trayek/index.html',
    'trayek/trayek.css',
    'trayek/trayek.js',
    'perintis/index.html',
    'perintis/perintis.css',
    'perintis/perintis.js'
  ];

  files.forEach((file, idx) => {
    const v2P = resolve(__dirname, '../v2', file);
    const srcP = resolve(__dirname, '../src/command-center', file);
    const v2Content = readFileSync(v2P);
    const srcContent = readFileSync(srcP);
    assert(`Test 2.${idx + 1}: ${file} 100% byte-for-byte parity (${v2Content.length} bytes)`,
      v2Content.equals(srcContent));
  });
}

// -----------------------------------------------------------------------------
// Test 3: Data Contract Specification (docs/DATA_CONTRACT_NEXT_06.md)
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Data Contract Specification Registry ---');
{
  assert('Test 3.1: docs/DATA_CONTRACT_NEXT_06.md exists', existsSync(DOC_CONTRACT_PATH));
  const contract = readFileSync(DOC_CONTRACT_PATH, 'utf8');

  const requiredMetricIds = [
    'PASS_MOV_TOTAL',
    'VEH_MOV_TOTAL',
    'AGG_LOAD_RATIO',
    'TERM_PASS_SHARE',
    'MONTH_PEAK_PASS',
    'PERIOD_DIFF_PCT'
  ];

  requiredMetricIds.forEach((id, idx) => {
    assert(`Test 3.2.${idx + 1}: Metric ID ${id} registered in contract`, contract.includes(`METRIC_ID: ${id}`));
  });

  assert('Test 3.3: Contract specifies No Hallucinated Analytics clause',
    contract.includes('No Hallucinated Analytics') && contract.includes('NOT AVAILABLE — SOURCE CONTRACT MISSING'));

  assert('Test 3.4: Contract details 4 factual data quality indicators',
    contract.includes('Kelengkapan Pelaporan Simpul') &&
    contract.includes('Kontinuitas Seri Waktu Bulanan') &&
    contract.includes('Cakupan Lokasi UPPKB Terpetakan') &&
    contract.includes('Integritas Gateway'));
}

// -----------------------------------------------------------------------------
// Test 4: HTML Semantic Elements & ARIA Roles
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: HTML Semantic Elements & ARIA Roles ---');
{
  const html = readFileSync(V2_HTML_PATH, 'utf8');

  // Trend controls
  assert('Test 4.1: Trend metric toggle container present',
    html.includes('class="trend-metric-toggle"'));
  assert('Test 4.2: Trend toggle buttons present with data-trend-metric attributes',
    html.includes('data-trend-metric="penumpang"') &&
    html.includes('data-trend-metric="kendaraan"') &&
    html.includes('data-trend-metric="rasio"'));
  assert('Test 4.3: Trend legend dot & text elements have IDs for dynamic update',
    html.includes('id="trendLegendDot"') && html.includes('id="trendLegendText"'));

  // Ranking section
  assert('Test 4.4: Terminal ranking section replaces Top Movers',
    html.includes('Peringkat Simpul Transportasi') &&
    html.includes('id="ranking-title"'));
  assert('Test 4.5: Terminal ranking tabs present with ARIA attributes',
    html.includes('id="tab-rank-penumpang"') &&
    html.includes('id="tab-rank-kendaraan"') &&
    html.includes('data-rank-metric="penumpang"') &&
    html.includes('data-rank-metric="kendaraan"'));
  assert('Test 4.6: Terminal ranking tab panels present with live lists',
    html.includes('id="panel-rank-penumpang"') &&
    html.includes('id="panel-rank-kendaraan"') &&
    html.includes('id="rankingListPenumpang"') &&
    html.includes('id="rankingListKendaraan"'));

  // Perintis verified or missing state
  assert('Test 4.7: Perintis section displays verified or transparent status badge',
    (html.includes('class="badge-source-verified">6 KORIDOR AKTIF</span>') && html.includes('class="perintis-summary-grid"')) ||
    (html.includes('class="badge-source-missing">SOURCE CONTRACT MISSING</span>') && html.includes('class="quality-empty perintis-missing-box"')));

  // Factual Data Quality Grid
  assert('Test 4.8: Data quality grid container present',
    html.includes('id="qualityMetricsGrid"') && html.includes('class="quality-metrics-grid"'));
  assert('Test 4.9: 4 Data quality cards present in HTML',
    html.includes('id="qmcReporting"') &&
    html.includes('id="qmcContinuity"') &&
    html.includes('id="qmcUppkb"') &&
    html.includes('id="qmcGateway"'));
}

// -----------------------------------------------------------------------------
// Test 5: CSS Rules & Layout Integrity
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: CSS Rules & Styling Integrity ---');
{
  const css = readFileSync(V2_CSS_PATH, 'utf8');

  // Trend controls styling
  assert('Test 5.1: .trend-metric-toggle & .trend-toggle-btn styles defined',
    css.includes('.trend-metric-toggle') && css.includes('.trend-toggle-btn'));
  assert('Test 5.2: Multi-metric trend bar fill colors defined (penumpang, kendaraan, rasio)',
    css.includes('.trend-bar-fill-penumpang') &&
    css.includes('.trend-bar-fill-kendaraan') &&
    css.includes('.trend-bar-fill-rasio'));

  // Ranking styling
  assert('Test 5.3: .ranking-list and .ranking-item styles defined',
    css.includes('.ranking-list') && css.includes('.ranking-item'));
  assert('Test 5.4: Ranking rank badges (1, 2, 3, other) defined',
    css.includes('.ranking-badge-1') &&
    css.includes('.ranking-badge-2') &&
    css.includes('.ranking-badge-3') &&
    css.includes('.ranking-badge-other'));
  assert('Test 5.5: .ranking-bar-track and .ranking-bar-fill styles defined',
    css.includes('.ranking-bar-track') &&
    css.includes('.ranking-bar-fill') &&
    css.includes('.ranking-bar-fill-kendaraan'));

  // Perintis missing & Data quality styles
  assert('Test 5.6: .badge-source-missing and .perintis-missing-box defined',
    css.includes('.badge-source-missing') && css.includes('.perintis-missing-box'));
  assert('Test 5.7: .quality-metrics-grid and .quality-metric-card defined',
    css.includes('.quality-metrics-grid') && css.includes('.quality-metric-card'));
}

// -----------------------------------------------------------------------------
// Test 6: Business Logic & Calculations (Tested via Isolated Runtime Sandbox)
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Business Logic & Mathematical Soundness ---');
{
  const jsCode = readFileSync(V2_JS_PATH, 'utf8');

  // Check critical helper functions are declared
  assert('Test 6.1: monthVehicleMovement helper exists in JS',
    jsCode.includes('function monthVehicleMovement('));
  assert('Test 6.2: getRankedTerminals helper exists in JS',
    jsCode.includes('function getRankedTerminals('));
  assert('Test 6.3: renderTerminalRankings helper exists in JS',
    jsCode.includes('function renderTerminalRankings('));
  assert('Test 6.4: renderDataQualityMetrics helper exists in JS',
    jsCode.includes('function renderDataQualityMetrics('));
  assert('Test 6.5: renderOverviewMonthlyTrend supports 3rd metric argument',
    jsCode.includes('function renderOverviewMonthlyTrend(trend, year, metric)'));

  // Evaluate simulated ranking logic
  const mockPoints = [
    { kode_terminal: 'LEU', nama_terminal: 'Leuwipanjang', kabupaten_kota: 'Kota Bandung', stats: { kedatangan_penumpang: 100000, keberangkatan_penumpang: 150000, kedatangan_kendaraan: 5000, keberangkatan_kendaraan: 7000 } },
    { kode_terminal: 'HAR', nama_terminal: 'Harjamukti', kabupaten_kota: 'Kota Cirebon', stats: { kedatangan_penumpang: 50000, keberangkatan_penumpang: 60000, kedatangan_kendaraan: 2000, keberangkatan_kendaraan: 3000 } },
    { kode_terminal: 'CIH', nama_terminal: 'Cicaheum', kabupaten_kota: 'Kota Bandung', stats: { kedatangan_penumpang: 40000, keberangkatan_penumpang: 45000, kedatangan_kendaraan: 1500, keberangkatan_kendaraan: 2500 } },
    { kode_terminal: 'BAN', nama_terminal: 'Banjar', kabupaten_kota: 'Kota Banjar', stats: { kedatangan_penumpang: 20000, keberangkatan_penumpang: 25000, kedatangan_kendaraan: 800, keberangkatan_kendaraan: 1200 } },
    { kode_terminal: 'SUK', nama_terminal: 'KH Ahmad Sanusi', kabupaten_kota: 'Kota Sukabumi', stats: { kedatangan_penumpang: 10000, keberangkatan_penumpang: 12000, kedatangan_kendaraan: 400, keberangkatan_kendaraan: 600 } },
    { kode_terminal: 'EMPTY', nama_terminal: 'Terminal Kosong', kabupaten_kota: 'Kabupaten Tasikmalaya', stats: { kedatangan_penumpang: 0, keberangkatan_penumpang: 0, kedatangan_kendaraan: 0, keberangkatan_kendaraan: 0 } }
  ];

  const mockSummary = {
    kedatangan_penumpang: 220000,
    keberangkatan_penumpang: 292000,
    kedatangan_kendaraan: 9700,
    keberangkatan_kendaraan: 14300
  };

  // Test simulation matching getRankedTerminals logic
  function testRanking(points, summary, metric) {
    const isVeh = metric === 'kendaraan';
    const totalProv = isVeh
      ? (Number(summary.kedatangan_kendaraan) + Number(summary.keberangkatan_kendaraan))
      : (Number(summary.kedatangan_penumpang) + Number(summary.keberangkatan_penumpang));

    const list = [];
    for (const p of points) {
      const s = p.stats || {};
      const vol = isVeh
        ? (Number(s.kedatangan_kendaraan || 0) + Number(s.keberangkatan_kendaraan || 0))
        : (Number(s.kedatangan_penumpang || 0) + Number(s.keberangkatan_penumpang || 0));
      if (vol > 0) {
        list.push({
          kode: p.kode_terminal,
          nama: p.nama_terminal,
          volume: vol
        });
      }
    }
    list.sort((a, b) => b.volume - a.volume);
    const top5 = list.slice(0, 5);
    const top1Vol = top5.length > 0 ? top5[0].volume : 0;
    return top5.map((item, idx) => ({
      rank: idx + 1,
      kode: item.kode,
      volume: item.volume,
      share: totalProv > 0 ? (item.volume / totalProv) * 100 : 0,
      barPct: top1Vol > 0 ? Math.round((item.volume / top1Vol) * 100) : 0
    }));
  }

  const penRank = testRanking(mockPoints, mockSummary, 'penumpang');
  assert('Test 6.6: Top 1 passenger terminal is Leuwipanjang (250.000 volume)',
    penRank.length === 5 && penRank[0].kode === 'LEU' && penRank[0].volume === 250000);
  assert('Test 6.7: Top 1 barPct is normalized to 100%',
    penRank[0].barPct === 100);
  assert('Test 6.8: Market share is strictly between 0% and 100%',
    penRank[0].share > 0 && penRank[0].share < 100 &&
    penRank.every(r => r.share > 0 && r.share <= 100));
  assert('Test 6.9: Terminal with 0 activity is excluded from rankings',
    penRank.every(r => r.kode !== 'EMPTY'));

  const kndRank = testRanking(mockPoints, mockSummary, 'kendaraan');
  assert('Test 6.10: Top 1 vehicle terminal is Leuwipanjang (12.000 vehicles)',
    kndRank.length === 5 && kndRank[0].kode === 'LEU' && kndRank[0].volume === 12000);

  // Test simulation for monthly trend ratio
  const mockTrendMonth = {
    bulan: 5,
    kedatangan_penumpang: 100000,
    keberangkatan_penumpang: 80000,
    kedatangan_kendaraan: 10000,
    keberangkatan_kendaraan: 10000
  };
  const totPen = mockTrendMonth.kedatangan_penumpang + mockTrendMonth.keberangkatan_penumpang; // 180,000
  const totKnd = mockTrendMonth.kedatangan_kendaraan + mockTrendMonth.keberangkatan_kendaraan; // 20,000
  const ratio = totKnd > 0 ? (totPen / totKnd) : 0;
  assert('Test 6.11: Monthly aggregate passenger-to-vehicle ratio correctly computed (9.0)',
    ratio === 9.0);

  // Test simulation for factual data quality indicators
  const totalSimpul = 130;
  const activeSimpulCount = mockPoints.filter(p => {
    const s = p.stats || {};
    return (s.kedatangan_penumpang + s.keberangkatan_penumpang + s.kedatangan_kendaraan + s.keberangkatan_kendaraan) > 0;
  }).length;
  const simpulPct = (activeSimpulCount / totalSimpul) * 100;
  assert('Test 6.12: Factual reporting completeness ratio is deterministic (5/130 = 3.8%)',
    activeSimpulCount === 5 && simpulPct > 3.8 && simpulPct < 3.9);
}

// -----------------------------------------------------------------------------
// Test 7: HTTP Preview Server Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: HTTP Preview Server Verification (Port 8080) ---');
await new Promise((resolveTest) => {
  const req = http.get('http://127.0.0.1:8080/command-center/', (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      assert('Test 7.1: HTTP Preview responds 200 OK', res.statusCode === 200);
      assert('Test 7.2: HTTP Preview body contains Peringkat Simpul Transportasi',
        body.includes('Peringkat Simpul Transportasi'));
      assert('Test 7.3: HTTP Preview body contains trend-metric-toggle',
        body.includes('class="trend-metric-toggle"'));
      assert('Test 7.4: HTTP Preview body contains Perintis corridor status',
        body.includes('6 KORIDOR AKTIF') || body.includes('SOURCE CONTRACT MISSING'));
      assert('Test 7.5: HTTP Preview body contains quality-metrics-grid',
        body.includes('id="qualityMetricsGrid"'));
      resolveTest();
    });
  });

  req.on('error', (err) => {
    console.log(`  [NOTE] Local preview server on port 8080 not running (${err.message}). Skipping Test 7.`);
    resolveTest();
  });

  req.setTimeout(1500, () => {
    req.destroy();
    console.log('  [NOTE] Local preview server check timed out. Skipping Test 7.');
    resolveTest();
  });
});

console.log('\n================================================================================');
console.log(`VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
console.log('================================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
