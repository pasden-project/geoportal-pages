import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

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

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runVerification() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Quad Cards Replacement Automated Verification');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--window-size=1440,1050',
    '--hide-scrollbars',
    'http://localhost:8082/'
  ]);

  let passCount = 0;
  let failCount = 0;
  const consoleErrors = [];

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${title} ${detail ? '(' + detail + ')' : ''}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${title} ${detail ? '(' + detail + ')' : ''}`);
      failCount++;
    }
  }

  try {
    let targetTab = null;
    for (let retry = 0; retry < 15; retry++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch('http://127.0.0.1:9225/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8082'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9225');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();

    // Listen to console errors
    cdp.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        consoleErrors.push(msg.params.args?.map(a => a.value || a.description).join(' '));
      }
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 2200));
    console.log('--- Test 0: Grid Layout Order in .module-grid--left ---');
    const layoutData = await cdp.eval(`
      (() => {
        const leftGrid = document.querySelector('.module-grid--left');
        if (!leftGrid) return null;
        const children = Array.from(leftGrid.children).map((el, idx) => ({
          idx,
          id: el.id || '',
          isWide: el.classList.contains('card-module--wide'),
          title: el.querySelector('.card-module__title')?.textContent?.trim() || ''
        }));
        return children;
      })()
    `);

    assert('Test 0.1: .module-grid--left contains 5 children', layoutData && layoutData.length === 5, `count: ${layoutData?.length}`);
    assert('Test 0.2: Child 1 (Row 1, Col 1) is Terminal Rank', layoutData && layoutData[0]?.id === 'cardTerminalRank', layoutData?.[0]?.title);
    assert('Test 0.3: Child 2 (Row 1, Col 2) is Trayek Rank', layoutData && layoutData[1]?.id === 'cardTrayekRank', layoutData?.[1]?.title);
    assert('Test 0.4: Child 3 (Row 2, Wide Span) is OD Rank', layoutData && layoutData[2]?.id === 'cardOdRank' && layoutData[2]?.isWide, layoutData?.[2]?.title);
    assert('Test 0.5: Child 4 (Row 3, Col 1) is Perintis PSO', layoutData && layoutData[3]?.title.includes('Perintis'), layoutData?.[3]?.title);
    assert('Test 0.6: Child 5 (Row 3, Col 2) is UPPKB', layoutData && layoutData[4]?.title.includes('UPPKB'), layoutData?.[4]?.title);

    console.log('\n--- Test 1: Card 1 (Peringkat Simpul Terminal) ---');
    const c1Data = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardTerminalRank');
        if (!card) return null;
        const title = card.querySelector('.card-module__title')?.textContent?.trim() || '';
        const tabs = Array.from(card.querySelectorAll('#terminalRankTabs .rank-tab-btn')).map(b => ({
          text: b.textContent.trim(),
          metric: b.getAttribute('data-metric'),
          active: b.classList.contains('is-active')
        }));
        const items = Array.from(card.querySelectorAll('#terminalRankList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          sub: el.querySelector('.rank-item__sub')?.textContent?.trim() || '',
          val: el.querySelector('.rank-item__val')?.textContent?.trim() || '',
          share: el.querySelector('.rank-item__share')?.textContent?.trim() || ''
        }));
        const link = card.querySelector('.card-module__link')?.getAttribute('href') || '';
        return { title, tabs, items, link };
      })()
    `);
    assert('Test 1.1: Card 1 exists with correct title', c1Data && c1Data.title.includes('Peringkat Terminal'), c1Data?.title);
    assert('Test 1.2: Card 1 has Penumpang & Kendaraan tabs', c1Data && c1Data.tabs.length === 2 && c1Data.tabs[0].metric === 'penumpang' && c1Data.tabs[1].metric === 'kendaraan');
    assert('Test 1.3: Penumpang tab is active by default', c1Data && c1Data.tabs[0].active === true);
    assert('Test 1.4: Card 1 displays top 5 terminals for Penumpang', c1Data && c1Data.items.length === 5, `count: ${c1Data?.items?.length}`);
    assert('Test 1.5: Top terminals include Leuwipanjang and Guntur Melati', c1Data && c1Data.items.some(i => i.name.toUpperCase().includes('GUNTUR') || i.name.toUpperCase().includes('LEUWIPANJANG')));
    assert('Test 1.6: Card 1 link navigates to /command-center/terminal/', c1Data && c1Data.link === '/command-center/terminal/');

    // Click Kendaraan tab in Card 1
    console.log('\n--- Test 1.B: Card 1 Kendaraan Tab Switcher Interaction ---');
    await cdp.eval(`
      (() => {
        const btnKendaraan = document.querySelector('#terminalRankTabs .rank-tab-btn[data-metric="kendaraan"]');
        if (btnKendaraan) btnKendaraan.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const c1Kendaraan = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardTerminalRank');
        const activeTab = card?.querySelector('#terminalRankTabs .rank-tab-btn.is-active')?.getAttribute('data-metric');
        const items = Array.from(card.querySelectorAll('#terminalRankList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          val: el.querySelector('.rank-item__val')?.textContent?.trim() || ''
        }));
        return { activeTab, items };
      })()
    `);
    assert('Test 1.7: Kendaraan tab is now active', c1Kendaraan && c1Kendaraan.activeTab === 'kendaraan');
    assert('Test 1.8: Top 1 vehicle terminal is Leuwipanjang', c1Kendaraan && c1Kendaraan.items[0]?.name.toUpperCase().includes('LEUWIPANJANG'), c1Kendaraan?.items[0]?.name);
    assert('Test 1.9: Values display with "knd" unit', c1Kendaraan && c1Kendaraan.items[0]?.val.includes('knd'), c1Kendaraan?.items[0]?.val);

    // Switch back to Penumpang tab
    await cdp.eval(`
      (() => {
        const btnPnp = document.querySelector('#terminalRankTabs .rank-tab-btn[data-metric="penumpang"]');
        if (btnPnp) btnPnp.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 300));

    console.log('\n--- Test 2: Card 2 (Top Trayek Terpadat) ---');
    const c2Data = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardTrayekRank');
        if (!card) return null;
        const title = card.querySelector('.card-module__title')?.textContent?.trim() || '';
        const tabs = Array.from(card.querySelectorAll('#trayekRankTabs .rank-tab-btn')).map(b => ({
          cat: b.getAttribute('data-cat'),
          active: b.classList.contains('is-active')
        }));
        const items = Array.from(card.querySelectorAll('#trayekRankList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          pill: el.querySelector('.trayek-cat-pill')?.textContent?.trim() || '',
          val: el.querySelector('.rank-item__val')?.textContent?.trim() || ''
        }));
        const link = card.querySelector('.card-module__link')?.getAttribute('href') || '';
        return { title, tabs, items, link };
      })()
    `);

    assert('Test 2.1: Card 2 exists with correct title', c2Data && c2Data.title.includes('Top Trayek Terpadat'), c2Data?.title);
    assert('Test 2.2: Card 2 has Semua, AKAP, AKDP tabs', c2Data && c2Data.tabs.length === 3);
    assert('Test 2.3: "Semua" tab is active by default', c2Data && c2Data.tabs[0].cat === 'semua' && c2Data.tabs[0].active);
    assert('Test 2.4: Card 2 displays top 3 routes for Semua', c2Data && c2Data.items.length === 3);
    assert('Test 2.5: Route #1 is Bandung - Sukabumi (452.046 pnp)', c2Data && c2Data.items[0]?.name.includes('Bandung') && c2Data.items[0]?.name.includes('Sukabumi'), c2Data?.items[0]?.name);
    assert('Test 2.6: Card 2 link navigates to /command-center/trayek/', c2Data && c2Data.link === '/command-center/trayek/');

    // Click AKAP tab
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('#trayekRankTabs .rank-tab-btn[data-cat="akap"]');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    const c2Akap = await cdp.eval(`
      (() => {
        const items = Array.from(document.querySelectorAll('#trayekRankList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          pill: el.querySelector('.trayek-cat-pill')?.textContent?.trim() || ''
        }));
        return items;
      })()
    `);
    assert('Test 2.7: AKAP tab renders 3 AKAP routes', c2Akap && c2Akap.length === 3 && c2Akap.every(i => i.pill === 'AKAP'));
    assert('Test 2.8: Top AKAP route is Kp. Rambutan - Guntur Melati', c2Akap && c2Akap[0]?.name.includes('Kp. Rambutan'), c2Akap?.[0]?.name);

    // Click AKDP tab
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('#trayekRankTabs .rank-tab-btn[data-cat="akdp"]');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    const c2Akdp = await cdp.eval(`
      (() => {
        const items = Array.from(document.querySelectorAll('#trayekRankList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          pill: el.querySelector('.trayek-cat-pill')?.textContent?.trim() || ''
        }));
        return items;
      })()
    `);
    assert('Test 2.9: AKDP tab renders 3 AKDP routes', c2Akdp && c2Akdp.length === 3 && c2Akdp.every(i => i.pill === 'AKDP'));
    assert('Test 2.10: Top AKDP route is Bandung - Sukabumi', c2Akdp && c2Akdp[0]?.name.includes('Sukabumi'), c2Akdp?.[0]?.name);

    // Reset to Semua tab
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('#trayekRankTabs .rank-tab-btn[data-cat="semua"]');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 300));

    console.log('\n--- Test 3: Card 3 (5 Bangkitan & Tarikan Terbesar OD) ---');
    const c3Data = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardOdRank');
        if (!card) return null;
        const title = card.querySelector('.card-module__title')?.textContent?.trim() || '';
        const bItems = Array.from(card.querySelectorAll('#odBangkitanList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          val: el.querySelector('.rank-item__val')?.textContent?.trim() || ''
        }));
        const tItems = Array.from(card.querySelectorAll('#odTarikanList .rank-item')).map(el => ({
          name: el.querySelector('.rank-item__name')?.textContent?.trim() || '',
          val: el.querySelector('.rank-item__val')?.textContent?.trim() || ''
        }));
        const link = card.querySelector('.card-module__link')?.getAttribute('href') || '';
        return { title, bItems, tItems, link };
      })()
    `);

    assert('Test 3.1: Card 3 exists with correct title', c3Data && c3Data.title.includes('Bangkitan & Tarikan'), c3Data?.title);
    assert('Test 3.2: 5 Bangkitan (Origin) items rendered', c3Data && c3Data.bItems.length === 5, `count: ${c3Data?.bItems?.length}`);
    assert('Test 3.3: Top 1 Bangkitan is Kota Bandung (676.598 pnp)', c3Data && c3Data.bItems[0]?.name === 'Kota Bandung' && c3Data.bItems[0]?.val.includes('676.598'));
    assert('Test 3.4: 5 Tarikan (Destination) items rendered', c3Data && c3Data.tItems.length === 5, `count: ${c3Data?.tItems?.length}`);
    assert('Test 3.5: Top 1 Tarikan is Kota Bandung (713.190 pnp)', c3Data && c3Data.tItems[0]?.name === 'Kota Bandung' && c3Data.tItems[0]?.val.includes('713.190'));
    assert('Test 3.6: Card 3 link navigates to /command-center/od/', c3Data && c3Data.link === '/command-center/od/');

    console.log('\n--- Test 4: Card 4 (Health Score Anatomy, Gauge & Breakdown Bars) ---');
    const c4Data = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardHealthScore');
        if (!card) return null;
        const title = card.querySelector('.card-module__title')?.textContent?.trim() || '';
        const bigScore = card.querySelector('#healthBigScore')?.textContent?.trim() || '';
        const gaugeVal = card.querySelector('#healthGaugeVal')?.textContent?.trim() || '';
        const arc = card.querySelector('#healthGaugeArc');
        const dasharray = arc?.getAttribute('stroke-dasharray');
        const computedDasharray = arc ? window.getComputedStyle(arc).strokeDasharray : '';
        const computedDashoffset = arc ? window.getComputedStyle(arc).strokeDashoffset : '';
        const filterAttr = arc?.getAttribute('filter');
        const track = card.querySelector('.health-gauge__track');
        const trackStroke = track?.getAttribute('stroke');
        const guide = card.querySelector('.health-gauge__guide');
        const scaleLabels = Array.from(card.querySelectorAll('.health-gauge__scale')).map(s => s.textContent.trim());
        const bars = Array.from(card.querySelectorAll('.health-breakdown-bar__fill')).map(b => b.style.width);
        const details = Array.from(card.querySelectorAll('.card-module__detail-row')).map(row => ({
          k: row.querySelector('.card-module__detail-key')?.textContent?.trim() || '',
          v: row.querySelector('.card-module__detail-val')?.textContent?.trim() || ''
        }));
        const link = card.querySelector('.card-module__link')?.getAttribute('href') || '';
        return { title, bigScore, gaugeVal, dasharray, computedDasharray, computedDashoffset, filterAttr, trackStroke, guide: !!guide, scaleLabels, bars, details, link };
      })()
    `);

    assert('Test 4.1: Card 4 exists with title Health Score', c4Data && c4Data.title.includes('Health Score'), c4Data?.title);
    assert('Test 4.2: Big score is 88,2/100', c4Data && c4Data.bigScore.includes('88,2'), c4Data?.bigScore);
    assert('Test 4.3: Gauge center score displays 88%', c4Data && c4Data.gaugeVal === '88%', c4Data?.gaugeVal);
    assert('Test 4.4: Arc gauge has stroke-dasharray attribute >= 251', c4Data && c4Data.dasharray && c4Data.dasharray.startsWith('251'), c4Data?.dasharray);
    assert('Test 4.4b: Arc gauge computed stroke-dasharray is locked to 251.36px (NOT 100px split)', c4Data && c4Data.computedDasharray.includes('251.36'), c4Data?.computedDasharray);
    assert('Test 4.5: Arc gauge has neon glow filter', c4Data && c4Data.filterAttr && c4Data.filterAttr.includes('neonGlow'), c4Data?.filterAttr);
    assert('Test 4.6: Track background has high contrast stroke #232634', c4Data && c4Data.trackStroke === '#232634', c4Data?.trackStroke);
    assert('Test 4.7: Outer guide arc exists', c4Data && c4Data.guide === true);
    assert('Test 4.8: Scale labels 0% and 100% exist', c4Data && c4Data.scaleLabels.includes('0%') && c4Data.scaleLabels.includes('100%'), c4Data?.scaleLabels?.join(', '));
    assert('Test 4.9: 3 breakdown progress bars exist', c4Data && c4Data.bars.length === 3, `bars: ${c4Data?.bars?.length}`);
    assert('Test 4.10: Breakdown progress bar widths match metrics (87.4%, 91.8%, 91.4%)', c4Data && c4Data.bars[0] === '87.4%' && c4Data.bars[1] === '91.8%' && c4Data.bars[2] === '91.4%', c4Data?.bars?.join(', '));
    assert('Test 4.11: SPM Terminal detail is 87,4%', c4Data && c4Data.details.some(d => d.k.includes('SPM') && d.v.includes('87,4%')));
    assert('Test 4.12: Kepatuhan WIM detail is 91,8%', c4Data && c4Data.details.some(d => d.k.includes('WIM') && d.v.includes('91,8%')));
    assert('Test 4.13: Ketercapaian DIPA detail is 91,4%', c4Data && c4Data.details.some(d => d.k.includes('DIPA') && d.v.includes('91,4%')));
    assert('Test 4.14: Card 4 link navigates to /command-center/program/', c4Data && c4Data.link === '/command-center/program/');
    console.log('\n--- Test 5: Unaffected Cards Integrity ---');
    const otherCards = await cdp.eval(`
      (() => {
        const allCards = Array.from(document.querySelectorAll('.card-module')).map(c => ({
          id: c.id || '',
          title: c.querySelector('.card-module__title')?.textContent?.trim() || '',
          link: c.querySelector('.card-module__link')?.getAttribute('href') || ''
        }));
        return allCards;
      })()
    `);
    assert('Test 5.1: 7 cards in total', otherCards && otherCards.length === 7, `count: ${otherCards?.length}`);
    assert('Test 5.2: Perintis PSO card is active', otherCards && otherCards.some(c => c.title.includes('Perintis') && c.link.includes('/perintis/')));
    assert('Test 5.3: UPPKB card is active', otherCards && otherCards.some(c => c.title.includes('UPPKB') && c.link.includes('/uppkb/')));
    assert('Test 5.4: Early Warning System card is active', otherCards && otherCards.some(c => c.title.includes('Early Warning') && c.link.includes('/early-warning/')));

    console.log('\n--- Test 6: Zero Browser Console Errors ---');
    assert('Test 6.1: Zero browser console errors detected', consoleErrors.length === 0, consoleErrors.join('; '));

    console.log('\n--- Test 7: Screenshot Capture ---');
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('Geo12-pages/shot-swapped-cards-top.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    assert('Test 7.1: Top layout verification screenshot saved', fs.existsSync(shotPath), `saved: ${shotPath}`);

    // Scroll to Card 4 (Perintis & UPPKB) & Card 7 (Health Score)
    await cdp.eval(`
      (() => {
        const cardHealth = document.getElementById('cardHealthScore');
        if (cardHealth) cardHealth.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `);
    await new Promise(r => setTimeout(r, 400));
    const shotBottom = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotBottomPath = path.resolve('Geo12-pages/shot-swapped-cards-bottom.png');
    fs.writeFileSync(shotBottomPath, Buffer.from(shotBottom.data, 'base64'));
    assert('Test 7.2: Bottom scrolled screenshot (Perintis, UPPKB & Health) saved', fs.existsSync(shotBottomPath), `saved: ${shotBottomPath}`);

    // Capture dedicated close-up of Health Score Card
    const healthBox = await cdp.eval(`
      (() => {
        const card = document.getElementById('cardHealthScore');
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return { x: Math.max(0, rect.x - 4), y: Math.max(0, rect.y - 4), width: rect.width + 8, height: rect.height + 8 };
      })()
    `);
    if (healthBox) {
      const shotClose = await cdp.send('Page.captureScreenshot', { clip: { ...healthBox, scale: 2 } });
      const shotClosePath = path.resolve('Geo12-pages/shot-health-score-gauge-closeup.png');
      fs.writeFileSync(shotClosePath, Buffer.from(shotClose.data, 'base64'));
      assert('Test 7.3: Health Score dedicated close-up screenshot saved', fs.existsSync(shotClosePath), `saved: ${shotClosePath}`);
    }

    cdp.close();
  } catch (err) {
    console.error('CDP verification error:', err);
    failCount++;
  } finally {
    edge.kill();
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passCount} passed, ${failCount} failed.`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runVerification();
