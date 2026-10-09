import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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

  async screenshot(filePath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTest() {
  console.log('======================================================================');
  console.log('GeoPORTAL DARK RIVET — Map Marker Hover Anchor & Popup Verification');
  console.log('======================================================================\n');

  const remoteDebuggingPort = 9225;
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://127.0.0.1:8082/'
  ]);

  let passCount = 0;
  let failCount = 0;

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
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (_) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (!versionData) throw new Error('Gagal menghubungkan ke browser Edge.');

    const pagesRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json`);
    const pages = await pagesRes.json();
    const page = pages.find(p => p.type === 'page' || (p.url && p.url.includes('8082'))) || pages[0];

    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Page.navigate', { url: 'http://localhost:8082/' });

    // Tunggu peta Leaflet, API fetch, dan marker selesai dirender serta stabil
    console.log('[1/4] Menunggu inisialisasi peta dan marker...');
    await new Promise(r => setTimeout(r, 4000));
    // 1. Verifikasi Marker Counts & Hierarchy
    const markerHierarchy = await client.eval(`
      (() => {
        const hosts = Array.from(document.querySelectorAll('.rivet-marker-host'));
        const innerMarkers = Array.from(document.querySelectorAll('.rivet-marker'));
        const terminals = Array.from(document.querySelectorAll('.rivet-marker--terminal'));
        const uppkb = Array.from(document.querySelectorAll('.rivet-marker--uppkb'));

        // Pastikan setiap host memiliki persis satu inner marker
        const hostsWellFormed = hosts.length > 0 && hosts.every(h => {
          const inner = h.querySelector('.rivet-marker');
          return inner !== null;
        });

        return {
          hostCount: hosts.length,
          innerCount: innerMarkers.length,
          terminalCount: terminals.length,
          uppkbCount: uppkb.length,
          hostsWellFormed
        };
      })()
    `);

    console.log('\n[2/4] Verifikasi Struktur Marker DOM:');
    assert('Total Marker Host (.rivet-marker-host) terpasang', markerHierarchy.hostCount === 18, `Count: ${markerHierarchy.hostCount}`);
    assert('Total Inner Marker (.rivet-marker) terpasang', markerHierarchy.innerCount === 18, `Count: ${markerHierarchy.innerCount}`);
    assert('Marker Terminal Tipe A berjumlah 12', markerHierarchy.terminalCount === 12, `Count: ${markerHierarchy.terminalCount}`);
    assert('Marker UPPKB / Barang berjumlah 6', markerHierarchy.uppkbCount === 6, `Count: ${markerHierarchy.uppkbCount}`);
    assert('Setiap host membungkus elemen inner .rivet-marker', markerHierarchy.hostsWellFormed, 'Well-formed hierarchy');

    // 2. Verifikasi Posisi & Hover Stability (Leuwipanjang Terminal Marker)
    console.log('\n[3/4] Menguji Kestabilan Koordinat Hover (Zero-Drift Check)...');

    const leuwipanjangCoord = await client.eval(`
      (() => {
        const host = document.querySelector('.rivet-marker-host[title*="Leuwipanjang"]');
        if (!host) return null;
        const inner = host.querySelector('.rivet-marker');
        const hostRect = host.getBoundingClientRect();
        const innerRect = inner.getBoundingClientRect();
        return {
          hostX: hostRect.x,
          hostY: hostRect.y,
          hostWidth: hostRect.width,
          hostHeight: hostRect.height,
          innerX: innerRect.x,
          innerY: innerRect.y,
          innerWidth: innerRect.width,
          innerHeight: innerRect.height,
          centerX: hostRect.x + hostRect.width / 2,
          centerY: hostRect.y + hostRect.height / 2
        };
      })()
    `);

    assert('Marker Leuwipanjang ditemukan di DOM', leuwipanjangCoord !== null, `Center: (${leuwipanjangCoord?.centerX?.toFixed(1)}, ${leuwipanjangCoord?.centerY?.toFixed(1)})`);

    if (leuwipanjangCoord) {
      const hoverX = Math.round(leuwipanjangCoord.centerX);
      const hoverY = Math.round(leuwipanjangCoord.centerY);

      // Simulasikan mouse move ke pusat marker
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: hoverX,
        y: hoverY
      });

      // Tunggu CSS transition 0.2s
      await new Promise(r => setTimeout(r, 400));

      const hoverMetrics = await client.eval(`
        (() => {
          const host = document.querySelector('.rivet-marker-host[title*="Leuwipanjang"]');
          if (!host) return null;
          const inner = host.querySelector('.rivet-marker');
          const hostRect = host.getBoundingClientRect();
          const innerRect = inner.getBoundingClientRect();

          const hostStyle = window.getComputedStyle(host);
          const innerStyle = window.getComputedStyle(inner);

          return {
            hostX: hostRect.x,
            hostY: hostRect.y,
            innerX: innerRect.x,
            innerY: innerRect.y,
            innerWidth: innerRect.width,
            innerHeight: innerRect.height,
            hostTransform: hostStyle.transform,
            innerTransform: innerStyle.transform,
            hostZIndex: hostStyle.zIndex,
            centerInnerX: innerRect.x + innerRect.width / 2,
            centerInnerY: innerRect.y + innerRect.height / 2
          };
        })()
      `);

      const hostDriftX = Math.abs(hoverMetrics.hostX - leuwipanjangCoord.hostX);
      const hostDriftY = Math.abs(hoverMetrics.hostY - leuwipanjangCoord.hostY);
      const centerDriftX = Math.abs(hoverMetrics.centerInnerX - leuwipanjangCoord.centerX);
      const centerDriftY = Math.abs(hoverMetrics.centerInnerY - leuwipanjangCoord.centerY);

      assert('Posisi Leaflet host tidak bergeser saat hover (0px drift)', hostDriftX < 0.5 && hostDriftY < 0.5, `Drift: dx=${hostDriftX.toFixed(2)}px, dy=${hostDriftY.toFixed(2)}px`);
      assert('Pusat visual pin tetap di titik jangkar geografis (in-place zoom)', centerDriftX < 1.0 && centerDriftY < 1.0, `Center Drift: dx=${centerDriftX.toFixed(2)}px, dy=${centerDriftY.toFixed(2)}px`);
      assert('Leaflet transform translate3d pada host tetap utuh', hoverMetrics.hostTransform.includes('matrix') || hoverMetrics.hostTransform.includes('translate'), `Host transform: ${hoverMetrics.hostTransform}`);
      assert('Inner pin mengalami scale transformasi saat hover', hoverMetrics.innerTransform.includes('matrix'), `Inner transform: ${hoverMetrics.innerTransform}`);
      assert('Z-Index host terangkat saat hover', hoverMetrics.hostZIndex === '1000' || parseInt(hoverMetrics.hostZIndex, 10) >= 1000, `z-index: ${hoverMetrics.hostZIndex}`);

      // Ambil tangkapan layar saat hover
      const shotHoverPath = path.join(ROOT_DIR, 'shot-map-marker-hover.png');
      await client.screenshot(shotHoverPath);
      console.log(`  -> Tersimpan screenshot hover: ${shotHoverPath}`);

      // 3. Verifikasi Klik & Popup Interaktivitas
      console.log('\n[4/4] Menguji Klik Marker & Pembukaan Popup...');

      // Simulasikan click event pada pusat marker
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        button: 'left',
        clickCount: 1,
        x: hoverX,
        y: hoverY
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        button: 'left',
        clickCount: 1,
        x: hoverX,
        y: hoverY
      });

      // Tunggu popup terbuka
      await new Promise(r => setTimeout(r, 600));

      const popupData = await client.eval(`
        (() => {
          const popup = document.querySelector('.leaflet-popup');
          if (!popup) return null;
          const isVisible = window.getComputedStyle(popup).display !== 'none' && window.getComputedStyle(popup).visibility !== 'hidden';
          const title = popup.querySelector('.popup-title') ? popup.querySelector('.popup-title').textContent.trim() : '';
          const sub = popup.querySelector('.popup-sub') ? popup.querySelector('.popup-sub').textContent.trim() : '';
          const badge = popup.querySelector('.popup-badge') ? popup.querySelector('.popup-badge').textContent.trim() : '';
          const contentText = popup.textContent.trim();

          return {
            exists: true,
            isVisible,
            title,
            sub,
            badge,
            hasKeberangkatan: contentText.includes('Keberangkatan'),
            hasKedatangan: contentText.includes('Kedatangan')
          };
        })()
      `);

      assert('Elemen .leaflet-popup muncul di DOM setelah marker diklik', popupData && popupData.exists && popupData.isVisible, 'Popup visible');
      assert('Popup menampilkan judul Terminal yang tepat', popupData && popupData.title.includes('Leuwipanjang'), `Title: "${popupData?.title}"`);
      assert('Popup menampilkan sub-judul kota yang tepat', popupData && (popupData.sub.includes('Bandung') || popupData.sub.includes('BANDUNG')), `Sub: "${popupData?.sub}"`);
      assert('Popup menampilkan badge tipe simpul yang sesuai', popupData && popupData.badge.includes('Terminal Tipe A'), `Badge: "${popupData?.badge}"`);
      assert('Popup memuat ringkasan statistik pergerakan penumpang', popupData && popupData.hasKeberangkatan && popupData.hasKedatangan, 'Stats present');

      // Ambil tangkapan layar saat popup terbuka
      const shotPopupPath = path.join(ROOT_DIR, 'shot-map-marker-popup.png');
      await client.screenshot(shotPopupPath);
      console.log(`  -> Tersimpan screenshot popup: ${shotPopupPath}`);
    }

    client.close();

    console.log('\n======================================================================');
    console.log(`HASIL VERIFIKASI: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('======================================================================');

    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } finally {
    try {
      edge.kill();
    } catch (_) {}
  }
}

runTest().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
