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
  console.log('GeoPORTAL — Dual Logo (Kemenhub & Hubdat) & Brand Hierarchy Verification');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9227',
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
        const res = await fetch('http://127.0.0.1:9227/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8082'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9227');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();

    cdp.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        consoleErrors.push(msg.params.args?.map(a => a.value || a.description).join(' '));
      }
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Pastikan tema awal Dark Mode
    await cdp.eval(`localStorage.setItem('geoportal-theme', 'dark')`);
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('--- Tahap A: Audit Identitas Brand Resmi dalam Dark Mode ---');
    const darkBrand = await cdp.eval(`
      (() => {
        const brand = document.querySelector('.brand');
        const mark = document.querySelector('.brand__mark');
        const imgKemenhub = mark ? mark.querySelector('.brand__logo-img--kemenhub, img[src*="logo-kemenhub"]') : null;
        const imgHubdat = mark ? mark.querySelector('.brand__logo-img--hubdat, img[src*="logo-hubdat"]') : null;
        const title = document.querySelector('.brand__title');
        const instansi = document.querySelector('.brand__instansi');
        const tag = document.querySelector('.brand__tag');

        return {
          brandExists: !!brand,
          markExists: !!mark,
          markBg: mark ? window.getComputedStyle(mark).backgroundColor : '',
          markDisplay: mark ? window.getComputedStyle(mark).display : '',
          kemenhubSrc: imgKemenhub ? imgKemenhub.getAttribute('src') : null,
          kemenhubLoaded: imgKemenhub ? (imgKemenhub.complete && imgKemenhub.naturalWidth > 0) : false,
          kemenhubWidth: imgKemenhub ? imgKemenhub.naturalWidth : 0,
          kemenhubHeight: imgKemenhub ? imgKemenhub.naturalHeight : 0,
          hubdatSrc: imgHubdat ? imgHubdat.getAttribute('src') : null,
          hubdatLoaded: imgHubdat ? (imgHubdat.complete && imgHubdat.naturalWidth > 0) : false,
          hubdatWidth: imgHubdat ? imgHubdat.naturalWidth : 0,
          hubdatHeight: imgHubdat ? imgHubdat.naturalHeight : 0,
          titleText: title ? title.textContent.trim() : '',
          titleFont: title ? window.getComputedStyle(title).fontFamily : '',
          titleWeight: title ? window.getComputedStyle(title).fontWeight : '',
          titleColor: title ? window.getComputedStyle(title).color : '',
          instansiText: instansi ? instansi.textContent.trim() : '',
          instansiFont: instansi ? window.getComputedStyle(instansi).fontFamily : '',
          instansiColor: instansi ? window.getComputedStyle(instansi).color : '',
          tagText: tag ? tag.textContent.trim() : '',
          tagFont: tag ? window.getComputedStyle(tag).fontFamily : '',
          tagColor: tag ? window.getComputedStyle(tag).color : '',
          tagBg: tag ? window.getComputedStyle(tag).backgroundColor : ''
        };
      })()
    `);

    assert('A.1 Elemen container .brand ditemukan di sidebar', darkBrand?.brandExists);
    assert('A.2 Container .brand__mark menggunakan display flex/inline-flex', darkBrand?.markDisplay?.includes('flex'), darkBrand?.markDisplay);
    assert('A.3 Logo Kemenhub terpasang dengan src logo-kemenhub.svg', darkBrand?.kemenhubSrc?.includes('logo-kemenhub.svg'), darkBrand?.kemenhubSrc);
    assert('A.4 Logo Kemenhub berhasil di-load oleh browser (naturalWidth > 0)', darkBrand?.kemenhubLoaded, `${darkBrand?.kemenhubWidth}x${darkBrand?.kemenhubHeight}`);
    assert('A.5 Logo Ditjen Hubdat terpasang dengan src logo-hubdat.png', darkBrand?.hubdatSrc?.includes('logo-hubdat.png'), darkBrand?.hubdatSrc);
    assert('A.6 Logo Ditjen Hubdat berhasil di-load oleh browser (naturalWidth > 0)', darkBrand?.hubdatLoaded, `${darkBrand?.hubdatWidth}x${darkBrand?.hubdatHeight}`);
    assert('A.7 Judul utama memuat teks "GeoPORTAL"', darkBrand?.titleText === 'GeoPORTAL', darkBrand?.titleText);
    assert('A.8 Judul utama mengadopsi font Poppins dengan weight 800', darkBrand?.titleFont?.toLowerCase().includes('poppins') && (darkBrand?.titleWeight === '800' || darkBrand?.titleWeight === 'bold'), `${darkBrand?.titleFont} weight:${darkBrand?.titleWeight}`);
    assert('A.9 Baris instansi memuat teks "BPTD Jabar"', darkBrand?.instansiText === 'BPTD Jabar', darkBrand?.instansiText);
    assert('A.10 Baris instansi mengadopsi font Poppins', darkBrand?.instansiFont?.toLowerCase().includes('poppins'), darkBrand?.instansiFont);
    assert('A.11 Badge seksi memuat teks "Angkutan"', darkBrand?.tagText === 'Angkutan', darkBrand?.tagText);
    assert('A.12 Badge seksi beraksen Cyan neon di Dark Mode', darkBrand?.tagColor?.includes('62, 242, 255') || darkBrand?.tagBg?.includes('62, 242, 255'), darkBrand?.tagColor);

    // Screenshot Dark Mode Brand Area
    const shotDark = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotDarkPath = fs.existsSync(path.resolve('Geo12-pages')) ? path.resolve('Geo12-pages/shot-brand-dual-logos-dark.png') : path.resolve('shot-brand-dual-logos-dark.png');
    fs.writeFileSync(shotDarkPath, Buffer.from(shotDark.data, 'base64'));
    assert('A.13 Screenshot Dark Mode Dual Logos tersimpan', fs.existsSync(shotDarkPath), shotDarkPath);

    console.log('\n--- Tahap B: Audit Identitas Brand Resmi dalam Light Mode ---');
    // Switch to Light Mode
    await cdp.eval(`
      (() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
        localStorage.setItem('geoportal-theme', 'light');
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const lightBrand = await cdp.eval(`
      (() => {
        const mark = document.querySelector('.brand__mark');
        const imgKemenhub = mark ? mark.querySelector('.brand__logo-img--kemenhub, img[src*="logo-kemenhub"]') : null;
        const imgHubdat = mark ? mark.querySelector('.brand__logo-img--hubdat, img[src*="logo-hubdat"]') : null;
        const title = document.querySelector('.brand__title');
        const instansi = document.querySelector('.brand__instansi');
        const tag = document.querySelector('.brand__tag');

        return {
          markBg: mark ? window.getComputedStyle(mark).backgroundColor : '',
          markShadow: mark ? window.getComputedStyle(mark).boxShadow : '',
          kemenhubLoaded: imgKemenhub ? (imgKemenhub.complete && imgKemenhub.naturalWidth > 0) : false,
          hubdatLoaded: imgHubdat ? (imgHubdat.complete && imgHubdat.naturalWidth > 0) : false,
          titleText: title ? title.textContent.trim() : '',
          titleColor: title ? window.getComputedStyle(title).color : '',
          instansiText: instansi ? instansi.textContent.trim() : '',
          instansiColor: instansi ? window.getComputedStyle(instansi).color : '',
          tagText: tag ? tag.textContent.trim() : '',
          tagColor: tag ? window.getComputedStyle(tag).color : '',
          tagBg: tag ? window.getComputedStyle(tag).backgroundColor : ''
        };
      })()
    `);

    assert('B.1 .brand__mark berlatar Kemenhub Gold (rgb(229, 168, 35) / #E5A823)', lightBrand?.markBg === 'rgb(229, 168, 35)', lightBrand?.markBg);
    assert('B.2 Kedua logo tetap ter-render sempurna di Light Mode', lightBrand?.kemenhubLoaded && lightBrand?.hubdatLoaded);
    assert('B.3 Judul GeoPORTAL tetap putih kontras tajam di atas sidebar Navy', lightBrand?.titleColor === 'rgb(255, 255, 255)', lightBrand?.titleColor);
    assert('B.4 Instansi BPTD Jabar berwarna Kemenhub Gold di Light Mode', lightBrand?.instansiColor === 'rgb(229, 168, 35)', lightBrand?.instansiColor);
    assert('B.5 Badge Angkutan beraksen soft blue (#93C5FD / rgb(147, 197, 253))', lightBrand?.tagColor?.includes('147, 197, 253') || lightBrand?.tagBg?.includes('147, 197, 253'), lightBrand?.tagColor);

    // Screenshot Light Mode Brand Area
    const shotLight = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotLightPath = fs.existsSync(path.resolve('Geo12-pages')) ? path.resolve('Geo12-pages/shot-brand-dual-logos-light.png') : path.resolve('shot-brand-dual-logos-light.png');
    fs.writeFileSync(shotLightPath, Buffer.from(shotLight.data, 'base64'));
    assert('B.6 Screenshot Light Mode Dual Logos tersimpan', fs.existsSync(shotLightPath), shotLightPath);

    console.log('\n--- Tahap C: Audit Submodule Bridge Dynamic Sidebar (/command-center/terminal/) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/command-center/terminal/?embed=1' });
    await new Promise(r => setTimeout(r, 2000));

    const bridgeBrand = await cdp.eval(`
      (() => {
        const mark = document.querySelector('.brand__mark');
        const imgKemenhub = mark ? mark.querySelector('.brand__logo-img--kemenhub, img[src*="logo-kemenhub"]') : null;
        const imgHubdat = mark ? mark.querySelector('.brand__logo-img--hubdat, img[src*="logo-hubdat"]') : null;
        const title = document.querySelector('.brand__title, .logo-title');
        const instansi = document.querySelector('.brand__instansi, .logo-sub');
        const tag = document.querySelector('.brand__tag');

        return {
          markExists: !!mark,
          kemenhubSrc: imgKemenhub ? imgKemenhub.getAttribute('src') : null,
          hubdatSrc: imgHubdat ? imgHubdat.getAttribute('src') : null,
          titleText: title ? title.textContent.trim() : '',
          instansiText: instansi ? instansi.textContent.trim() : '',
          tagText: tag ? tag.textContent.trim() : ''
        };
      })()
    `);

    assert('C.1 Submodule sidebar memiliki container .brand__mark', bridgeBrand?.markExists);
    assert('C.2 Submodule sidebar memuat logo-kemenhub.svg', bridgeBrand?.kemenhubSrc?.includes('logo-kemenhub.svg'), bridgeBrand?.kemenhubSrc);
    assert('C.3 Submodule sidebar memuat logo-hubdat.png', bridgeBrand?.hubdatSrc?.includes('logo-hubdat.png'), bridgeBrand?.hubdatSrc);
    assert('C.4 Submodule sidebar memuat teks GeoPORTAL', bridgeBrand?.titleText === 'GeoPORTAL', bridgeBrand?.titleText);
    assert('C.5 Submodule sidebar memuat teks BPTD Jabar', bridgeBrand?.instansiText === 'BPTD Jabar', bridgeBrand?.instansiText);
    assert('C.6 Submodule sidebar memuat badge Angkutan', bridgeBrand?.tagText === 'Angkutan', bridgeBrand?.tagText);

    console.log('\n--- Tahap D: Pemeriksaan Console Browser ---');
    const filteredErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('sockjs'));
    assert('D.1 Zero critical console errors', filteredErrors.length === 0, filteredErrors.join(' | '));

    console.log('\n======================================================================');
    console.log(`VERIFIKASI LOGO & BRAND RESMI: ${passCount} passed, ${failCount} failed.`);
    console.log('======================================================================\n');

    cdp.close();
    edge.kill();
    process.exit(failCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Verification Error:', err);
    edge.kill();
    process.exit(1);
  }
}

runVerification();
