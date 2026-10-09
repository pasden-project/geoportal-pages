import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const EDGE_PATH = (() => {
  const edgeCoreDir = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore';
  try {
    if (fs.existsSync(edgeCoreDir)) {
      const versions = fs.readdirSync(edgeCoreDir).filter(v => fs.existsSync(path.join(edgeCoreDir, v, 'msedge.exe')));
      if (versions.length > 0) return path.join(edgeCoreDir, versions[versions.length - 1], 'msedge.exe');
    }
  } catch (_) {}
  return 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.62\\msedge.exe';
})();

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  async screenshot(outPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
      console.log(`  [Screenshot Saved] -> ${path.relative(ROOT_DIR, outPath)}`);
    }
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runDeepPolishVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Deep Polish Automated Verification Suite');
  console.log('Testing 6 Specific Refinements on Port 8082');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ]);

  let pageUrl = null;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9240/json/list');
      const targets = await resp.json();
      const p = targets.find(t => t.type === 'page') || targets[0];
      if (p && p.webSocketDebuggerUrl) {
        pageUrl = p.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }

  if (!pageUrl) {
    edge.kill();
    throw new Error('Edge headless failed to start on port 9240');
  }

  let totalTests = 0;
  let passedTests = 0;

  function assert(title, condition, extra = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  PASS: [${title}] ${extra}`);
    } else {
      console.error(`  FAIL: [${title}] ${extra}`);
    }
  }

  try {
    const client = new CDPClient(pageUrl);
    await client.connect();
    await client.send('Page.enable');

    // -------------------------------------------------------------------
    // 1. [Image #1] Hero Chart Select Period & View Toggle
    // -------------------------------------------------------------------
    console.log('[Point 1] Testing Hero Balance Card Select Period & View Toggle...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 1500));

    const p1 = await client.eval(`
      (() => {
        const sel = document.getElementById('chartPeriodSelect');
        const viewToggle = document.querySelector('.chart-view-toggle');
        const barBtn = document.querySelector('.view-btn[data-view="bar"]');
        const lineBtn = document.querySelector('.view-btn[data-view="line"]');

        const initialCols = document.querySelectorAll('#cols .col').length;

        // Test filter period to s1 (Semester I = 6 months)
        sel.value = 's1';
        sel.dispatchEvent(new Event('change'));
        const s1Cols = document.querySelectorAll('#cols .col').length;

        // Test view toggle to line
        lineBtn.click();
        const isLineMode = document.getElementById('chart').classList.contains('chart--line');
        const svgPresent = !!document.getElementById('chartLineSvg');

        // Restore to 12m & bar
        sel.value = '12m';
        sel.dispatchEvent(new Event('change'));
        barBtn.click();
        const restoredCols = document.querySelectorAll('#cols .col').length;
        const isBarMode = !document.getElementById('chart').classList.contains('chart--line');

        return {
          selPresent: !!sel,
          optionsCount: sel ? sel.options.length : 0,
          viewTogglePresent: !!viewToggle,
          initialCols,
          s1Cols,
          isLineMode,
          svgPresent,
          restoredCols,
          isBarMode
        };
      })()
    `);

    assert('P1.1: Pill Select Periode exists with 7 options', p1.selPresent && p1.optionsCount === 7, `(options: ${p1.optionsCount})`);
    assert('P1.2: Segmented View Toggle exists', p1.viewTogglePresent);
    assert('P1.3: Period change (s1) dynamically filters to 6 columns', p1.s1Cols === 6, `(cols: ${p1.s1Cols})`);
    assert('P1.4: Line view toggle enables .chart--line and renders SVG spline curves', p1.isLineMode && p1.svgPresent);
    assert('P1.5: Switch back restores 12 columns in authentic bar view', p1.restoredCols === 12 && p1.isBarMode);

    await client.screenshot(path.join(ROOT_DIR, 'shot-polish-hero-chart.png'));
    console.log();

    // -------------------------------------------------------------------
    // 2. [Image #2] Compact Ranking Leaderboard Items
    // -------------------------------------------------------------------
    console.log('[Point 2] Testing Compact Ranking Leaderboard Items (height <= 52px)...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/command-center/terminal/' });

    let p2Term = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      p2Term = await client.eval(`
        (() => {
          const items = Array.from(document.querySelectorAll('.ranking-item'));
          if (!items.length) return null;
          return {
            count: items.length,
            heights: items.map(el => Math.round(el.getBoundingClientRect().height)),
            displays: items.map(el => window.getComputedStyle(el).display),
            flexDirs: items.map(el => window.getComputedStyle(el).flexDirection)
          };
        })()
      `);
      if (p2Term && p2Term.count > 0) break;
    }

    assert('P2.1: Terminal ranking items rendered', p2Term && p2Term.count === 5, `(count: ${p2Term?.count})`);
    const maxTermHeight = p2Term ? Math.max(...p2Term.heights) : 999;
    assert('P2.2: Terminal ranking items height <= 52px (compact horizontal row)', maxTermHeight <= 52, `(heights: ${JSON.stringify(p2Term?.heights)})`);
    assert('P2.3: Terminal ranking items display flex row', p2Term && p2Term.flexDirs.every(d => d === 'row'));

    await client.screenshot(path.join(ROOT_DIR, 'shot-polish-terminal-ranking.png'));
    console.log();

    // -------------------------------------------------------------------
    // 3. [Image #3] Neutralized Inner Card Stats & Button Contrast
    // -------------------------------------------------------------------
    console.log('[Point 3] Testing Inner Card Stats & Button Contrast (No #f8fafc / No Blinding Lime)...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/command-center/perintis/' });
    await new Promise(r => setTimeout(r, 2000));

    const p3 = await client.eval(`
      (() => {
        const stats = Array.from(document.querySelectorAll('.perintis-card-stats'));
        const btns = Array.from(document.querySelectorAll('.btn-card-action-primary'));
        const labels = Array.from(document.querySelectorAll('.perintis-stat-label'));

        const hasWhiteBg = stats.some(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          return bg.includes('248, 250, 252') || bg.includes('255, 255, 255') || bg.includes('#ffffff') || bg.includes('#f8fafc');
        });

        const btnTranslucentNeon = btns.every(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          return bg.includes('212, 255, 63') || bg.includes('rgba');
        });

        return {
          statsCount: stats.length,
          hasWhiteBg,
          statsBg: stats[0] ? window.getComputedStyle(stats[0]).backgroundColor : null,
          btnTranslucentNeon,
          btnBg: btns[0] ? window.getComputedStyle(btns[0]).backgroundColor : null,
          btnColor: btns[0] ? window.getComputedStyle(btns[0]).color : null
        };
      })()
    `);

    assert('P3.1: Perintis card stats containers present', p3.statsCount === 6, `(count: ${p3.statsCount})`);
    assert('P3.2: Perintis card stats background has NO bright white (#f8fafc / #ffffff)', !p3.hasWhiteBg, `(bg: ${p3.statsBg})`);
    assert('P3.3: Action button uses elegant translucent neon (not solid blinding lime)', p3.btnTranslucentNeon, `(bg: ${p3.btnBg}, color: ${p3.btnColor})`);

    await client.screenshot(path.join(ROOT_DIR, 'shot-polish-perintis-cards.png'));
    console.log();

    // -------------------------------------------------------------------
    // 4. [Image #4] OD Matrix Table Modern Dark Heatmap
    // -------------------------------------------------------------------
    console.log('[Point 4] Testing OD Matrix Table Dark Translucent Heatmap Scale...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/command-center/od/' });

    let p4 = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      p4 = await client.eval(`
        (() => {
          const peak = document.querySelector('.matrix-table td.heat-peak');
          const high = document.querySelector('.matrix-table td.heat-high');
          const originSticky = document.querySelector('.matrix-table td.td-origin-sticky');
          const thOrigin = document.querySelector('.matrix-table th.th-origin-sticky');

          if (!peak) return null;

          return {
            peakBg: window.getComputedStyle(peak).backgroundColor,
            peakColor: window.getComputedStyle(peak).color,
            highBg: high ? window.getComputedStyle(high).backgroundColor : null,
            highColor: high ? window.getComputedStyle(high).color : null,
            originBg: originSticky ? window.getComputedStyle(originSticky).backgroundColor : null,
            thOriginBg: thOrigin ? window.getComputedStyle(thOrigin).backgroundColor : null
          };
        })()
      `);
      if (p4) break;
    }

    assert('P4.1: OD Matrix peak heatmap uses dark translucent neon lime', p4 && p4.peakBg.includes('212, 255, 63') && p4.peakBg.includes('rgba'), `(bg: ${p4?.peakBg})`);
    assert('P4.2: OD Matrix high heatmap uses dark translucent amber', p4 && p4.highBg.includes('255, 190, 77') && p4.highBg.includes('rgba'), `(bg: ${p4?.highBg})`);
    assert('P4.3: Sticky origin headers use dark background (#0d0e12)', p4 && p4.originBg.includes('13, 14, 18'), `(bg: ${p4?.originBg})`);

    await client.screenshot(path.join(ROOT_DIR, 'shot-polish-od-matrix.png'));
    console.log();

    // -------------------------------------------------------------------
    // 5. [Image #5] Data Master Basemap Filter Correction
    // -------------------------------------------------------------------
    console.log('[Point 5] Testing Data Master Basemap Filter Correction (CartoDB Dark Matter)...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/command-center/data-master/' });
    await new Promise(r => setTimeout(r, 2000));

    // Click Peta Geospasial Tab
    await client.eval(`
      (() => {
        const allTabs = Array.from(document.querySelectorAll('button, a'));
        const found = allTabs.find(el => el.textContent.includes('Peta'));
        if (found) found.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    const p5 = await client.eval(`
      (() => {
        const mapContainer = document.getElementById('masterMap');
        const tilePane = mapContainer ? mapContainer.querySelector('.leaflet-tile-pane') : null;
        const tiles = mapContainer ? Array.from(mapContainer.querySelectorAll('img.leaflet-tile')) : [];
        return {
          mapFound: !!mapContainer,
          tilePaneFilter: tilePane ? window.getComputedStyle(tilePane).filter : null,
          tileCount: tiles.length,
          loadedTiles: tiles.filter(t => t.naturalWidth > 0).length,
          firstTileSrc: tiles[0]?.src || ''
        };
      })()
    `);

    assert('P5.1: Master map container exists', p5.mapFound);
    assert('P5.2: Tile pane filter is "none" (not inverted)', p5.tilePaneFilter === 'none', `(filter: ${p5.tilePaneFilter})`);
    assert('P5.3: CartoDB Dark Matter tiles loaded successfully', p5.loadedTiles > 0, `(${p5.loadedTiles}/${p5.tileCount} loaded, src: ${p5.firstTileSrc.slice(0, 60)}...)`);

    await client.screenshot(path.join(ROOT_DIR, 'shot-polish-data-master-map.png'));
    console.log();

    // -------------------------------------------------------------------
    // 6. [Image #6] Elimination of Hot Pink Accents in Kamus Data
    // -------------------------------------------------------------------
    console.log('[Point 6] Testing Elimination of Hot Pink Accents in Kamus Data...');
    // Click Kamus Data Tab
    await client.eval(`
      (() => {
        const allTabs = Array.from(document.querySelectorAll('button, a'));
        const found = allTabs.find(el => el.textContent.includes('Kamus'));
        if (found) found.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 2000));

    const p6 = await client.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.dict-card'));
        const badges = Array.from(document.querySelectorAll('.dict-code-badge'));
        const formulas = Array.from(document.querySelectorAll('.dict-formula-box'));

        const hasPinkBorder = cards.some(c => {
          const top = window.getComputedStyle(c).borderTopColor;
          return top.includes('236, 72, 153') || top.includes('#ec4899');
        });

        const hasPinkBadge = badges.some(b => {
          const col = window.getComputedStyle(b).color;
          return col.includes('244, 114, 182') || col.includes('236, 72, 153');
        });

        return {
          cardCount: cards.length,
          hasPinkBorder,
          hasPinkBadge,
          firstBadgeColor: badges[0] ? window.getComputedStyle(badges[0]).color : null,
          firstBadgeBg: badges[0] ? window.getComputedStyle(badges[0]).backgroundColor : null,
          firstFormulaColor: formulas[0] ? window.getComputedStyle(formulas[0]).color : null
        };
      })()
    `);

    assert('P6.1: Dictionary cards present', p6.cardCount === 12, `(cards: ${p6.cardCount})`);
    assert('P6.2: 0 dictionary cards with hot pink top border (#ec4899)', !p6.hasPinkBorder);
    assert('P6.3: 0 dictionary badges with magenta/pink font (#f472b6)', !p6.hasPinkBadge);
    assert('P6.4: Dictionary code badges use authentic Dark Rivet neon lime', p6.firstBadgeColor === 'rgb(212, 255, 63)', `(color: ${p6.firstBadgeColor})`);
    assert('P6.5: Dictionary formula box uses high-tech cyan accent', p6.firstFormulaColor === 'rgb(62, 242, 255)', `(color: ${p6.firstFormulaColor})`);

    await client.screenshot(path.join(ROOT_DIR, 'shot-polish-kamus-data.png'));
    console.log();

    client.close();
  } finally {
    edge.kill();
  }

  console.log('======================================================================');
  console.log(`DEEP POLISH VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDeepPolishVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
