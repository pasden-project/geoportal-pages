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
    if (res && res.exceptionDetails) {
      console.error('[CDP Eval Exception]', res.exceptionDetails);
    }
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

async function runPolishV2Verification() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Deep Polish V2 Automated Verification Suite');
  console.log('Verifying 4 Core Requirements on Port 8082');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ]);

  let pageUrl = null;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9241/json/list');
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
    throw new Error('Edge headless failed to start on port 9241');
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
    // Test 1: Laporan Contrast
    // -------------------------------------------------------------------
    console.log('[Test 1] Testing Laporan High-Contrast Dark Obsidian Cards...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/command-center/laporan/?embed=1' });
    for (let i = 0; i < 30; i++) {
      const count = await client.eval(`document.querySelectorAll('.report-card').length`);
      if (count && count > 0) break;
      await new Promise(r => setTimeout(r, 200));
    }

    const t1 = await client.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.report-card'));
        if (cards.length === 0) return { error: 'No report cards found' };

        const whiteCards = cards.filter(c => {
          const bg = window.getComputedStyle(c).backgroundColor;
          return bg === 'rgb(255, 255, 255)' || bg === '#ffffff';
        });

        const firstCard = cards[0];
        const cardBg = window.getComputedStyle(firstCard).backgroundColor;
        const header = firstCard.querySelector('.report-card-header');
        const headerBg = header ? window.getComputedStyle(header).backgroundColor : '';
        const miniChip = firstCard.querySelector('.metric-mini-chip');
        const chipBg = miniChip ? window.getComputedStyle(miniChip).backgroundColor : '';

        const previewBtn = firstCard.querySelector('.btn-act-preview');
        const previewColor = previewBtn ? window.getComputedStyle(previewBtn).color : '';
        const previewBg = previewBtn ? window.getComputedStyle(previewBtn).backgroundColor : '';

        const badges = Array.from(document.querySelectorAll('.badge-cat-eksekutif, .badge-cat-terminal, .badge-cat-uppkb, .badge-cat-perintis, .badge-cat-od, .badge-cat-konektivitas, .badge-cat-early-warning, .badge-cat-program'));
        const badgeColors = badges.map(b => window.getComputedStyle(b).color);

        return {
          totalCards: cards.length,
          whiteCardsCount: whiteCards.length,
          cardBg,
          headerBg,
          chipBg,
          previewColor,
          previewBg,
          badgesFound: badges.length
        };
      })()
    `);

    assert('Laporan Total Cards', t1.totalCards === 8, `Found ${t1.totalCards} cards`);
    assert('Laporan No White Cards', t1.whiteCardsCount === 0, `White cards: ${t1.whiteCardsCount}`);
    assert('Laporan Dark Card Background', t1.cardBg === 'rgb(13, 14, 18)', `Card bg: ${t1.cardBg}`);
    assert('Laporan Dark Header Background', t1.headerBg === 'rgb(17, 19, 24)', `Header bg: ${t1.headerBg}`);
    assert('Laporan Dark Mini Chip Background', t1.chipBg === 'rgb(20, 23, 32)', `Chip bg: ${t1.chipBg}`);
    assert('Laporan Translucent Preview Button', t1.previewColor.includes('212, 255, 63') || t1.previewColor === 'rgb(212, 255, 63)', `Preview btn text: ${t1.previewColor}`);

    const shot1 = path.join(ROOT_DIR, 'shot-v2-laporan-contrast.png');
    await client.screenshot(shot1);

    // -------------------------------------------------------------------
    // Test 2: Data Master Clean Map (Watermark Free OSM)
    // -------------------------------------------------------------------
    console.log('\n[Test 2] Testing Data Master Basemap & Watermark Elimination...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/command-center/data-master/?embed=1' });
    for (let i = 0; i < 30; i++) {
      const count = await client.eval(`document.querySelectorAll('#masterMap .leaflet-tile-pane img').length`);
      if (count && count > 0) break;
      await new Promise(r => setTimeout(r, 250));
    }

    const t2 = await client.eval(`
      (() => {
        const mapEl = document.getElementById('masterMap');
        if (!mapEl) return { error: 'masterMap element not found' };

        const tilePane = mapEl.querySelector('.leaflet-tile-pane');
        const tileFilter = tilePane ? window.getComputedStyle(tilePane).filter : '';

        const tiles = Array.from(mapEl.querySelectorAll('.leaflet-tile-pane img.leaflet-tile'));
        const cartoTiles = tiles.filter(img => (img.src || '').includes('cartocdn.com'));
        const osmTiles = tiles.filter(img => (img.src || '').includes('tile.openstreetmap.org'));

        // Check if any element or text in map contains REQUIRED maps/apikey
        const mapText = mapEl.innerText || '';
        const hasWatermarkText = mapText.includes('REQUIRED maps/apikey') || mapText.includes('apikey');

        return {
          tilePaneExists: !!tilePane,
          tileFilterHasInvert: tileFilter.includes('invert'),
          totalTiles: tiles.length,
          cartoTilesCount: cartoTiles.length,
          osmTilesCount: osmTiles.length,
          hasWatermarkText
        };
      })()
    `);

    assert('Data Master Tile Pane Exists', t2.tilePaneExists === true);
    assert('Data Master Dark Obsidian Filter', t2.tileFilterHasInvert === true, 'Tile pane has dark invert filter');
    assert('Data Master No CartoDB Tiles', t2.cartoTilesCount === 0, `CartoDB tiles: ${t2.cartoTilesCount}`);
    assert('Data Master OSM Tiles Active', t2.osmTilesCount > 0, `OSM tiles loaded: ${t2.osmTilesCount}`);
    assert('Data Master No Watermark Text', t2.hasWatermarkText === false, 'No REQUIRED maps/apikey detected');

    const shot2 = path.join(ROOT_DIR, 'shot-v2-data-master-clean-map.png');
    await client.screenshot(shot2);

    // -------------------------------------------------------------------
    // Test 3: Single Persistent Sidebar / SPA Shell Navigation
    // -------------------------------------------------------------------
    console.log('\n[Test 3] Testing Single Persistent Sidebar (SPA Shell Navigation)...');
    await client.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 2000));

    // Pasang token sesi permanen pada window shell induk
    await client.eval(`window.__spaCanary = 'active-spa-session-v2-canary';`);

    const t3Init = await client.eval(`
      (() => {
        const board = document.querySelector('.board');
        const frame = document.getElementById('submoduleFrame');
        const activeLink = document.querySelector('.nav__item.is-active');
        return {
          canary: window.__spaCanary,
          boardVisible: board ? window.getComputedStyle(board).display !== 'none' : false,
          frameHidden: frame ? window.getComputedStyle(frame).display === 'none' : true,
          activeText: activeLink ? activeLink.textContent.trim() : ''
        };
      })()
    `);

    assert('SPA Shell Initial Dashboard State', t3Init.boardVisible && t3Init.frameHidden, 'Board visible, frame hidden');
    assert('SPA Shell Dashboard Link Active', t3Init.activeText.includes('Dashboard'), `Active link: ${t3Init.activeText}`);

    // Klik menu "Terminal" di sidebar
    await client.eval(`
      (() => {
        const termLink = document.querySelector('a[href="/command-center/terminal/"]');
        if (termLink) termLink.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    const t3NavTerminal = await client.eval(`
      (() => {
        const board = document.querySelector('.board');
        const frame = document.getElementById('submoduleFrame');
        const activeLink = document.querySelector('a[href="/command-center/terminal/"].is-active');
        return {
          canary: window.__spaCanary,
          currentPath: window.location.pathname,
          boardHidden: board ? window.getComputedStyle(board).display === 'none' : false,
          frameVisible: frame ? window.getComputedStyle(frame).display !== 'none' : false,
          frameSrc: frame ? frame.getAttribute('src') : '',
          isTerminalActive: !!activeLink
        };
      })()
    `);

    assert('SPA Shell No Page Reload (Canary Intact)', t3NavTerminal.canary === 'active-spa-session-v2-canary', 'window.__spaCanary preserved');
    assert('SPA Shell URL Updated', t3NavTerminal.currentPath === '/command-center/terminal/', `URL: ${t3NavTerminal.currentPath}`);
    assert('SPA Shell Board Hidden', t3NavTerminal.boardHidden === true);
    assert('SPA Shell Frame Visible', t3NavTerminal.frameVisible === true);
    assert('SPA Shell Frame Embedded Route', t3NavTerminal.frameSrc.includes('/command-center/terminal/') && t3NavTerminal.frameSrc.includes('embed=1'), `Frame src: ${t3NavTerminal.frameSrc}`);
    assert('SPA Shell Terminal Menu Highlighted', t3NavTerminal.isTerminalActive === true);

    // Klik menu "Laporan Realisasi"
    await client.eval(`
      (() => {
        const lapLink = document.querySelector('a[href="/command-center/laporan/"]');
        if (lapLink) lapLink.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    const t3NavLaporan = await client.eval(`
      (() => {
        const frame = document.getElementById('submoduleFrame');
        const activeLink = document.querySelector('a[href="/command-center/laporan/"].is-active');
        return {
          canary: window.__spaCanary,
          currentPath: window.location.pathname,
          frameSrc: frame ? (frame.dataset.currentRoute || frame.contentWindow?.location?.href || frame.getAttribute('src') || '') : '',
          isLaporanActive: !!activeLink
        };
      })()
    `);

    assert('SPA Shell No Reload on 2nd Navigation', t3NavLaporan.canary === 'active-spa-session-v2-canary');
    assert('SPA Shell URL Changed to Laporan', t3NavLaporan.currentPath === '/command-center/laporan/', `URL: ${t3NavLaporan.currentPath}`);
    assert('SPA Shell Frame Loaded Laporan', t3NavLaporan.frameSrc.includes('/command-center/laporan/') && t3NavLaporan.frameSrc.includes('embed=1'));
    assert('SPA Shell Laporan Menu Highlighted', t3NavLaporan.isLaporanActive === true);

    // Tes browser history Back
    await client.eval(`window.history.back();`);
    await new Promise(r => setTimeout(r, 1200));

    const t3Back = await client.eval(`
      (() => {
        const frame = document.getElementById('submoduleFrame');
        return {
          canary: window.__spaCanary,
          currentPath: window.location.pathname,
          frameSrc: frame ? frame.getAttribute('src') : ''
        };
      })()
    `);
    assert('SPA Shell Popstate Back Intact', t3Back.canary === 'active-spa-session-v2-canary');
    assert('SPA Shell Back to Terminal Route', t3Back.currentPath === '/command-center/terminal/', `URL: ${t3Back.currentPath}`);

    const shot3 = path.join(ROOT_DIR, 'shot-v2-persistent-sidebar.png');
    await client.screenshot(shot3);

    // -------------------------------------------------------------------
    // Test 4: Mini Popup Grafik / Image #1
    // -------------------------------------------------------------------
    console.log('\n[Test 4] Testing Floating Mini Popup Chart Card (Image #1)...');
    // Kembali ke Dashboard utama
    await client.eval(`
      (() => {
        const dashLink = document.querySelector('a[href="./"]');
        if (dashLink) dashLink.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Trigger hover pada kolom Mei (kolom ke-5 / indeks 4)
    const t4Hover = await client.eval(`
      (() => {
        const cols = document.querySelectorAll('#cols .col');
        if (cols.length === 0) return { error: 'No columns found' };

        const targetCol = cols[4] || cols[0];
        targetCol.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

        const tip = document.getElementById('tip');
        const tipDay = document.getElementById('tipMonth');
        const tipDatang = document.getElementById('tipDatang');
        const tipBerangkat = document.getElementById('tipBerangkat');
        const chart = document.getElementById('chart');

        const tipStyle = window.getComputedStyle(tip);
        const colClass = targetCol.className;
        const chartClass = chart ? chart.className : '';

        return {
          colIsOn: colClass.includes('is-on'),
          chartIsHover: chartClass.includes('is-hover'),
          tipIsOpen: tip.classList.contains('is-open'),
          tipOpacity: tipStyle.opacity,
          tipBg: tipStyle.backgroundColor,
          tipColor: tipStyle.color,
          tipTransform: tip.style.transform,
          tipDayText: tipDay ? tipDay.textContent : '',
          tipDatangText: tipDatang ? tipDatang.textContent : '',
          tipBerangkatText: tipBerangkat ? tipBerangkat.textContent : ''
        };
      })()
    `);

    assert('Chart Col Marked is-on', t4Hover.colIsOn === true);
    assert('Chart Container Marked is-hover', t4Hover.chartIsHover === true);
    assert('Tip Marked is-open', t4Hover.tipIsOpen === true);
    assert('Tip Opacity Visible', t4Hover.tipOpacity === '1', `Opacity: ${t4Hover.tipOpacity}`);
    assert('Tip White Card Background', t4Hover.tipBg === 'rgb(255, 255, 255)', `Tip bg: ${t4Hover.tipBg}`);
    assert('Tip Dark Text Color', t4Hover.tipColor === 'rgb(9, 10, 13)', `Tip text color: ${t4Hover.tipColor}`);
    assert('Tip Floating Transform Calculated', t4Hover.tipTransform.includes('translate'), `Transform: ${t4Hover.tipTransform}`);
    assert('Tip Month Day Text Populated', t4Hover.tipDayText.length > 0, `Month text: ${t4Hover.tipDayText}`);
    assert('Tip Data Values Populated', t4Hover.tipBerangkatText.length > 0, `Berangkat: ${t4Hover.tipBerangkatText}, Datang: ${t4Hover.tipDatangText}`);

    const shot4 = path.join(ROOT_DIR, 'shot-v2-chart-mini-popup.png');
    await client.screenshot(shot4);

    // Unhover test
    const t4Leave = await client.eval(`
      (() => {
        const cols = document.querySelectorAll('#cols .col');
        const targetCol = cols[4] || cols[0];
        targetCol.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

        const tip = document.getElementById('tip');
        const chart = document.getElementById('chart');

        return {
          colIsOn: targetCol.classList.contains('is-on'),
          tipIsOpen: tip ? tip.classList.contains('is-open') : false,
          chartIsHover: chart ? chart.classList.contains('is-hover') : false
        };
      })()
    `);

    assert('Col is-on Cleared on Leave', t4Leave.colIsOn === false);
    assert('Tip is-open Cleared on Leave', t4Leave.tipIsOpen === false);
    assert('Chart is-hover Cleared on Leave', t4Leave.chartIsHover === false);

    console.log('\n======================================================================');
    console.log(`Deep Polish V2 Verification Results: ${passedTests}/${totalTests} Passed (${totalTests - passedTests} Failed)`);
    console.log('======================================================================');

    client.close();
    edge.kill();

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    edge.kill();
    process.exit(1);
  }
}

runPolishV2Verification();
