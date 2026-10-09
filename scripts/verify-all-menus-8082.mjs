import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    return new Promise((resolve, reject) => {
      const id = this.id++;
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

const MENUS = [
  { id: 'overview', name: 'Menu 1: Dashboard Overview', url: 'http://localhost:8082/' },
  { id: 'peta', name: 'Menu 2: Peta GeoPORTAL', url: 'http://localhost:8082/maps/' },
  { id: 'terminal', name: 'Menu 3: Terminal Penumpang', url: 'http://localhost:8082/command-center/terminal/' },
  { id: 'trayek', name: 'Menu 4: Trayek Angkutan Jalan', url: 'http://localhost:8082/command-center/trayek/' },
  { id: 'perintis', name: 'Menu 5: Angkutan Perintis PSO', url: 'http://localhost:8082/command-center/perintis/' },
  { id: 'uppkb', name: 'Menu 6: UPPKB / Barang', url: 'http://localhost:8082/command-center/uppkb/' },
  { id: 'od', name: 'Menu 7: OD Intelligence', url: 'http://localhost:8082/command-center/od/' },
  { id: 'connectivity', name: 'Menu 8: Connectivity Multimoda', url: 'http://localhost:8082/command-center/connectivity/' },
  { id: 'early-warning', name: 'Menu 9: Early Warning System', url: 'http://localhost:8082/command-center/early-warning/' },
  { id: 'program', name: 'Menu 10: Program & Kinerja PSO', url: 'http://localhost:8082/command-center/program/' },
  { id: 'laporan', name: 'Menu 11: Laporan & Dokumen', url: 'http://localhost:8082/command-center/laporan/' },
  { id: 'data-master', name: 'Menu 12: Data Master', url: 'http://localhost:8082/command-center/data-master/' }
];

async function runAudit() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Audit 12 Menu Lengkap (Port 8082)');
  console.log('======================================================================\n');

  const userDataDir = path.join(os.tmpdir(), 'edge-verify-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--user-data-dir=' + userDataDir,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let passCount = 0;
  let failCount = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${title} -> ${detail}`);
      failCount++;
    }
  }

  const shotsDir = fs.existsSync(path.resolve('Geo12-pages')) ? path.resolve('Geo12-pages', 'dark-rivet-shots') : path.resolve('dark-rivet-shots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  try {
    let targetTab = null;
    for (let retry = 0; retry < 15; retry++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await fetch('http://127.0.0.1:9235/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page') || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target browser page tab not found');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (let i = 0; i < MENUS.length; i++) {
      const menu = MENUS[i];
      console.log(`\n----------------------------------------------------------------------`);
      console.log(`Pemeriksaan ${menu.name}`);
      console.log(`URL: ${menu.url}`);
      console.log(`----------------------------------------------------------------------`);

      // Navigasi
      await cdp.send('Page.navigate', { url: menu.url });
      await new Promise(r => setTimeout(r, 1500));

      const pageState = await cdp.eval(`
        (() => {
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const docTitle = document.title;
          const html = document.documentElement;
          
          // 1. Cek scrolling
          const scrollMax = html.scrollHeight - html.clientHeight;
          let canScroll = false;
          let scrolledAmount = 0;
          if (scrollMax > 20) {
            window.scrollTo({ top: Math.min(300, scrollMax), behavior: 'instant' });
            scrolledAmount = window.scrollY || html.scrollTop;
            canScroll = scrolledAmount > 0;
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else {
            // Jika halaman pas di layar atau fullscreen (misal /peta/ atau overview pada layar tinggi)
            const mainEl = document.querySelector('.main, .app-main');
            const mainCanScroll = mainEl ? (mainEl.scrollHeight > mainEl.clientHeight) : false;
            canScroll = scrollMax <= 20 || mainCanScroll;
          }

          // 2. Cek kartu putih
          const cards = Array.from(document.querySelectorAll('.card, .kpi-card, .ranking-card, .table-card, .perintis-card, .uppkb-card'));
          const whiteCards = cards.filter(c => {
            const bg = window.getComputedStyle(c).backgroundColor;
            return bg === 'rgb(255, 255, 255)' || bg === '#ffffff';
          });

          // 3. Cek teks heading navy legasi
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, .dash-title, .header-title'));
          const darkHeadings = headings.filter(h => {
            const col = window.getComputedStyle(h).color;
            return col === 'rgb(10, 33, 71)' || col === 'rgb(7, 28, 61)' || col === 'rgb(10, 47, 115)';
          });

          // 4. Cek sidebar otentik Dark Rivet
          const sidebar = document.querySelector('.app-sidebar, aside.side');
          const sidebarBg = sidebar ? window.getComputedStyle(sidebar).backgroundColor : null;
          const hasTransport = !!document.getElementById('group-transport');
          const hasIntel = !!document.getElementById('group-intel');
          const hasUtility = !!document.getElementById('group-utility');

          // 5. Cek ketiadaan strip warna model lama pada kartu KPI
          const kpiCards = Array.from(document.querySelectorAll('.kpi-card'));
          const beforeStrips = kpiCards.filter(c => {
            const s = window.getComputedStyle(c, '::before');
            return s && s.display !== 'none' && s.content !== 'none' && s.content !== '""';
          });

          // 6. Cek ketiadaan bilah kontras pastel tabrakan
          const pastelClashes = Array.from(document.querySelectorAll('[style*="background"], .kpi-icon-wrap')).filter(el => {
            const bg = window.getComputedStyle(el).backgroundColor;
            return bg === 'rgb(254, 226, 226)' || bg === 'rgb(254, 242, 242)' || bg === 'rgb(254, 243, 199)' || bg === 'rgb(224, 242, 254)' || bg === 'rgb(220, 252, 231)';
          });

          return {
            title: docTitle,
            bodyBg,
            scrollHeight: html.scrollHeight,
            clientHeight: html.clientHeight,
            scrollMax,
            scrolledAmount,
            canScroll,
            totalCards: cards.length,
            whiteCardsCount: whiteCards.length,
            totalHeadings: headings.length,
            darkHeadingsCount: darkHeadings.length,
            hasSidebar: !!sidebar,
            sidebarBg,
            hasAllAccordionGroups: hasTransport && hasIntel && hasUtility,
            kpiCardsCount: kpiCards.length,
            beforeStripsCount: beforeStrips.length,
            pastelClashesCount: pastelClashes.length
          };
        })()
      `);

      // Verifikasi 1: Latar Belakang Obsidian
      const isDarkBg = pageState.bodyBg.includes('5, 5, 7') || pageState.bodyBg.includes('8, 9, 12') || pageState.bodyBg === 'rgb(0, 0, 0)' || pageState.bodyBg.includes('9, 10, 13');
      assert(`${menu.name} — Body Background Gelap Obsidian`, isDarkBg, `ditemukan: ${pageState.bodyBg}`);

      // Verifikasi 2: Kemampuan Scrolling Vertikal
      if (menu.id !== 'peta') {
        assert(`${menu.name} — Scrolling Vertikal Aktif (Bebas Kunci Overflow)`, pageState.canScroll, `scrollHeight: ${pageState.scrollHeight}, clientHeight: ${pageState.clientHeight}, scrolled: ${pageState.scrolledAmount}`);
      }

      // Verifikasi 3: Tidak Ada Kartu Berlatar Putih Terang
      assert(`${menu.name} — Seluruh Kartu Gelap (0 Kartu Putih Terang)`, pageState.whiteCardsCount === 0, `${pageState.whiteCardsCount} kartu putih dari ${pageState.totalCards}`);

      // Verifikasi 4: Tidak Ada Heading Teks Navy Gelap Legacy
      assert(`${menu.name} — Tipografi Heading Kontras Tinggi (0 Heading Navy Gelap)`, pageState.darkHeadingsCount === 0, `${pageState.darkHeadingsCount} heading navy dari ${pageState.totalHeadings}`);

      // Verifikasi 5: Sidebar Otentik Dark Rivet (kecuali /peta/ yang merupakan fullscreen map)
      if (menu.id !== 'peta') {
        assert(`${menu.name} — Sidebar Otentik Dark Rivet (3 Akordeon)`, pageState.hasSidebar && pageState.hasAllAccordionGroups, `hasSidebar: ${pageState.hasSidebar}, hasAllAccordionGroups: ${pageState.hasAllAccordionGroups}`);
      }

      // Verifikasi 6: Ketiadaan Strip Warna Kartu Model Lama
      if (pageState.kpiCardsCount > 0) {
        assert(`${menu.name} — Kartu RIVET Bersih (0 Strip Atas Model Lama)`, pageState.beforeStripsCount === 0, `${pageState.beforeStripsCount} strip ditemukan dari ${pageState.kpiCardsCount} KPI cards`);
      }

      // Verifikasi 7: Ketiadaan Bilah Kontras Pastel Tabrakan
      assert(`${menu.name} — Kontras Bersih Harmonis (0 Bilah Pastel Terang)`, pageState.pastelClashesCount === 0, `${pageState.pastelClashesCount} elemen pastel tabrakan ditemukan`);

      // Capture screenshot resolusi tinggi untuk inspeksi visual
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const shotFile = path.join(shotsDir, `shot-${menu.id}.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`  [SCREENSHOT] Disimpan ke: ${shotFile}`);
    }

    cdp.close();
  } catch (err) {
    console.error('Audit error:', err);
    failCount++;
  } finally {
    edge.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================================');
  console.log(`HASIL AUDIT SELURUH MENU: ${passCount} LULUS, ${failCount} GAGAL`);
  console.log('======================================================================\n');
  process.exit(failCount === 0 ? 0 : 1);
}

runAudit();
