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
  console.log('GeoPORTAL DARK RIVET — 7 Module Cards Automated Verification Suite');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
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
        const res = await fetch('http://127.0.0.1:9224/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8082'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9224');

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
    await new Promise(r => setTimeout(r, 2000));

    console.log('--- Test 1: DOM Elements Count & Structural Integrity ---');
    const cardStats = await cdp.eval(`
      (() => {
        const leftGrid = document.querySelector('.module-grid--left');
        const rightStack = document.querySelector('.module-stack--right');
        const leftCards = leftGrid ? Array.from(leftGrid.querySelectorAll('.card-module')) : [];
        const rightCards = rightStack ? Array.from(rightStack.querySelectorAll('.card-module')) : [];
        const allCards = Array.from(document.querySelectorAll('.card-module'));
        return {
          total: allCards.length,
          leftCount: leftCards.length,
          rightCount: rightCards.length,
          hasOldRow2: !!document.querySelector('.row--2'),
          hasOldRow3: !!document.querySelector('.row--3'),
          hasOldActions: !!document.querySelector('.actions'),
          hasOldTxList: !!document.getElementById('txList')
        };
      })()
    `);

    assert('Test 1.1: Exact 7 .card-module elements exist in DOM', cardStats.total === 7, `found ${cardStats.total}`);
    assert('Test 1.2: Left grid has exactly 5 cards', cardStats.leftCount === 5, `found ${cardStats.leftCount}`);
    assert('Test 1.3: Right stack has exactly 2 cards', cardStats.rightCount === 2, `found ${cardStats.rightCount}`);
    assert('Test 1.4: Old Row 2 completely removed', cardStats.hasOldRow2 === false);
    assert('Test 1.5: Old Row 3 completely removed', cardStats.hasOldRow3 === false);
    assert('Test 1.6: Old quick actions list removed', cardStats.hasOldActions === false);
    assert('Test 1.7: Old txList feed removed', cardStats.hasOldTxList === false);

    console.log('\n--- Test 2: Card 1–7 Content & Links Verification ---');
    const cardsData = await cdp.eval(`
      Array.from(document.querySelectorAll('.card-module')).map(c => ({
        title: c.querySelector('.card-module__title')?.textContent.trim(),
        badge: c.querySelector('.card-module__badge')?.textContent.trim(),
        value: c.querySelector('.card-module__value')?.textContent.trim(),
        label: c.querySelector('.card-module__label')?.textContent.trim(),
        linkHref: c.querySelector('.card-module__link')?.getAttribute('href'),
        linkText: c.querySelector('.card-module__link')?.textContent.trim(),
        isWide: c.classList.contains('card-module--wide'),
        detailsCount: c.querySelectorAll('.card-module__detail-row, .card-module__grid-col').length
      }))
    `);

    // Card 1: Terminal Penumpang
    const c1 = cardsData[0];
    assert('Test 2.1: Card 1 is Terminal Penumpang', c1?.title === 'Terminal Penumpang', `title: ${c1?.title}`);
    assert('Test 2.2: Card 1 metric is 4.681.829 Penumpang (YTD)', c1?.value === '4.681.829' && c1?.label.includes('Penumpang'), `val: ${c1?.value}`);
    assert('Test 2.3: Card 1 badge is 12 Simpul Tipe A', c1?.badge === '12 Simpul Tipe A', `badge: ${c1?.badge}`);
    assert('Test 2.4: Card 1 route is /command-center/terminal/', c1?.linkHref === '/command-center/terminal/', `href: ${c1?.linkHref}`);

    // Card 2: Trayek & Koridor Jalan
    const c2 = cardsData[1];
    assert('Test 2.5: Card 2 is Trayek & Koridor Jalan', c2?.title.includes('Trayek'), `title: ${c2?.title}`);
    assert('Test 2.6: Card 2 metric is 1.248 Trayek Berizin', c2?.value === '1.248', `val: ${c2?.value}`);
    assert('Test 2.7: Card 2 badge is 22 Koridor', c2?.badge === '22 Koridor', `badge: ${c2?.badge}`);
    assert('Test 2.8: Card 2 route is /command-center/trayek/', c2?.linkHref === '/command-center/trayek/', `href: ${c2?.linkHref}`);

    // Card 3: Angkutan Perintis PSO
    const c3 = cardsData[2];
    assert('Test 2.9: Card 3 is Angkutan Perintis PSO', c3?.title.includes('Perintis'), `title: ${c3?.title}`);
    assert('Test 2.10: Card 3 metric is 26.815 Penumpang', c3?.value === '26.815', `val: ${c3?.value}`);
    assert('Test 2.11: Card 3 badge is 6 Trayek PSO', c3?.badge === '6 Trayek PSO', `badge: ${c3?.badge}`);
    assert('Test 2.12: Card 3 route is /command-center/perintis/', c3?.linkHref === '/command-center/perintis/', `href: ${c3?.linkHref}`);

    // Card 4: UPPKB / Angkutan Barang
    const c4 = cardsData[3];
    assert('Test 2.13: Card 4 is UPPKB / Angkutan Barang', c4?.title.includes('UPPKB'), `title: ${c4?.title}`);
    assert('Test 2.14: Card 4 metric is 194.392 Truk Tertimbang', c4?.value === '194.392', `val: ${c4?.value}`);
    assert('Test 2.15: Card 4 badge is 6 Fasilitas WIM', c4?.badge === '6 Fasilitas WIM', `badge: ${c4?.badge}`);
    assert('Test 2.16: Card 4 route is /command-center/uppkb/', c4?.linkHref === '/command-center/uppkb/', `href: ${c4?.linkHref}`);

    // Card 5: OD Intelligence & Matriks
    const c5 = cardsData[4];
    assert('Test 2.17: Card 5 is OD Intelligence & Matriks', c5?.title.includes('OD'), `title: ${c5?.title}`);
    assert('Test 2.18: Card 5 metric is 4.681.829 Aliran Pergerakan', c5?.value === '4.681.829', `val: ${c5?.value}`);
    assert('Test 2.19: Card 5 badge is 27 Kab/Kota', c5?.badge === '27 Kab/Kota', `badge: ${c5?.badge}`);
    assert('Test 2.20: Card 5 is wide 2-column span', c5?.isWide === true);
    assert('Test 2.21: Card 5 route is /command-center/od/', c5?.linkHref === '/command-center/od/', `href: ${c5?.linkHref}`);

    // Card 6: Early Warning System
    const c6 = cardsData[5];
    assert('Test 2.22: Card 6 is Early Warning System', c6?.title.includes('Early Warning'), `title: ${c6?.title}`);
    assert('Test 2.23: Card 6 metric is 18 Insiden Terpantau', c6?.value === '18', `val: ${c6?.value}`);
    assert('Test 2.24: Card 6 badge is Live Monitoring', c6?.badge === 'Live Monitoring', `badge: ${c6?.badge}`);
    assert('Test 2.25: Card 6 route is /command-center/early-warning/', c6?.linkHref === '/command-center/early-warning/', `href: ${c6?.linkHref}`);

    // Card 7: Kinerja Program & DIPA
    const c7 = cardsData[6];
    assert('Test 2.26: Card 7 is Kinerja Program & DIPA', c7?.title.includes('Kinerja Program'), `title: ${c7?.title}`);
    assert('Test 2.27: Card 7 metric is 91,4%', c7?.value === '91,4%', `val: ${c7?.value}`);
    assert('Test 2.28: Card 7 badge is 6 Program DIPA', c7?.badge === '6 Program DIPA', `badge: ${c7?.badge}`);
    assert('Test 2.29: Card 7 route is /command-center/program/', c7?.linkHref === '/command-center/program/', `href: ${c7?.linkHref}`);

    console.log('\n--- Test 3: Console Errors & Stability ---');
    assert('Test 3.1: Zero browser console errors detected', consoleErrors.length === 0, consoleErrors.join('; '));

    console.log('\n--- Test 4: Visual Screenshot Captures ---');
    // Desktop 1440x900
    const shotDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPathDesktop = path.resolve('Geo12-pages/shot-7-module-cards-verified.png');
    fs.writeFileSync(shotPathDesktop, Buffer.from(shotDesktop.data, 'base64'));
    assert('Test 4.1: Desktop screenshot captured', fs.existsSync(shotPathDesktop), `saved: ${shotPathDesktop}`);

    // Mobile 390x844 Emulation
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));
    const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPathMobile = path.resolve('Geo12-pages/shot-7-module-cards-mobile.png');
    fs.writeFileSync(shotPathMobile, Buffer.from(shotMobile.data, 'base64'));
    assert('Test 4.2: Mobile screenshot captured', fs.existsSync(shotPathMobile), `saved: ${shotPathMobile}`);

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
