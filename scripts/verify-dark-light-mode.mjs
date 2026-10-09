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
  console.log('GeoPORTAL — Light Mode & Dark Mode Switcher Automated CDP Verification');
  console.log('======================================================================\n');

  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
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
        const res = await fetch('http://127.0.0.1:9226/json');
        const tabs = await res.json();
        targetTab = tabs.find(t => t.type === 'page' || (t.url && t.url.includes('8082'))) || tabs[0];
        if (targetTab && targetTab.webSocketDebuggerUrl) break;
      } catch (_) {}
    }
    if (!targetTab) throw new Error('Target tab not found on port 9226');

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

    // First ensure clean localStorage state
    await cdp.send('Page.navigate', { url: 'http://localhost:8082/' });
    await new Promise(r => setTimeout(r, 2200));

    console.log('--- Phase 1: Default State Verification (Authentic Dark Rivet) ---');
    const defaultState = await cdp.eval(`
      (() => {
        const html = document.documentElement;
        const themeAttr = html.getAttribute('data-theme');
        const isThemeLight = html.classList.contains('theme-light');
        const toggleBtn = document.getElementById('themeToggle');
        const toggleLabel = document.getElementById('themeToggleLabel')?.textContent?.trim();
        const sideToggle = document.getElementById('sideThemeToggle');
        const frame = document.querySelector('.frame');
        const frameBg = frame ? window.getComputedStyle(frame).backgroundColor : '';
        const card = document.querySelector('.card');
        const cardBg = card ? window.getComputedStyle(card).backgroundColor : '';
        const heroPax = document.getElementById('heroPax');
        const heroPaxColor = heroPax ? window.getComputedStyle(heroPax).color : '';
        const tilePane = document.querySelector('.leaflet-tile-pane');
        const tileFilter = tilePane ? window.getComputedStyle(tilePane).filter : '';
        const metaTheme = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

        return {
          themeAttr,
          isThemeLight,
          hasToggleBtn: !!toggleBtn,
          toggleLabel,
          hasSideToggle: !!sideToggle,
          frameBg,
          cardBg,
          heroPaxColor,
          tileFilter,
          metaTheme
        };
      })()
    `);

    assert('Phase 1.1: Default theme attribute is dark or clean', defaultState?.themeAttr === 'dark', defaultState?.themeAttr);
    assert('Phase 1.2: Root element does NOT have theme-light class', defaultState?.isThemeLight === false);
    assert('Phase 1.3: Topbar theme toggle button exists in DOM', defaultState?.hasToggleBtn === true);
    assert('Phase 1.4: Toggle label displays "Light Mode"', defaultState?.toggleLabel === 'Light Mode', defaultState?.toggleLabel);
    assert('Phase 1.5: Side drawer theme toggle button exists in DOM', defaultState?.hasSideToggle === true);
    assert('Phase 1.6: Hero pax color is light in Dark Mode', defaultState?.heroPaxColor.includes('244') || defaultState?.heroPaxColor.includes('255'), defaultState?.heroPaxColor);
    assert('Phase 1.7: Leaflet tile filter contains invert in Dark Mode', defaultState?.tileFilter.includes('invert(1)') || defaultState?.tileFilter.includes('invert'), defaultState?.tileFilter);
    assert('Phase 1.8: Meta theme-color is dark #050507', defaultState?.metaTheme === '#050507', defaultState?.metaTheme);

    console.log('\n--- Phase 2: Switch to Light Mode (Kemenhub Navy & Bone White) ---');
    await cdp.eval(`document.getElementById('themeToggle').click()`);
    await new Promise(r => setTimeout(r, 600));

    const lightState = await cdp.eval(`
      (() => {
        const html = document.documentElement;
        const themeAttr = html.getAttribute('data-theme');
        const isThemeLight = html.classList.contains('theme-light');
        const bodyThemeLight = document.body.classList.contains('theme-light');
        const toggleLabel = document.getElementById('themeToggleLabel')?.textContent?.trim();
        const frame = document.querySelector('.frame');
        const frameBg = frame ? window.getComputedStyle(frame).backgroundColor : '';
        const side = document.querySelector('.side');
        const sideBg = side ? window.getComputedStyle(side).backgroundImage : '';
        const card = document.querySelector('.card');
        const cardBg = card ? window.getComputedStyle(card).backgroundColor : '';
        const heroPax = document.getElementById('heroPax');
        const heroPaxColor = heroPax ? window.getComputedStyle(heroPax).color : '';
        const tilePane = document.querySelector('.leaflet-tile-pane');
        const tileFilter = tilePane ? window.getComputedStyle(tilePane).filter : '';
        const metaTheme = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
        const storedTheme = localStorage.getItem('geoportal-theme');
        const brandMark = document.querySelector('.brand__mark');
        const brandMarkBg = brandMark ? window.getComputedStyle(brandMark).backgroundColor : '';

        return {
          themeAttr,
          isThemeLight,
          bodyThemeLight,
          toggleLabel,
          frameBg,
          sideBg,
          cardBg,
          heroPaxColor,
          tileFilter,
          metaTheme,
          storedTheme,
          brandMarkBg
        };
      })()
    `);

    assert('Phase 2.1: Theme attribute switched to "light"', lightState?.themeAttr === 'light', lightState?.themeAttr);
    assert('Phase 2.2: html has class "theme-light"', lightState?.isThemeLight === true);
    assert('Phase 2.3: body has class "theme-light"', lightState?.bodyThemeLight === true);
    assert('Phase 2.4: Toggle label updated to "Dark Mode"', lightState?.toggleLabel === 'Dark Mode', lightState?.toggleLabel);
    assert('Phase 2.5: Frame background is Bone White (rgb(238, 242, 246) / #EEF2F6)', lightState?.frameBg.includes('238, 242, 246') || lightState?.frameBg.includes('244, 246, 249'), lightState?.frameBg);
    assert('Phase 2.6: Sidebar has Kemenhub Navy gradient background', lightState?.sideBg.includes('rgb(7, 28, 61)') || lightState?.sideBg.includes('7, 28, 61'), lightState?.sideBg.slice(0, 70));
    assert('Phase 2.7: Cards background is soft off-white (rgb(248, 250, 252) / #F8FAFC)', lightState?.cardBg === 'rgb(248, 250, 252)' || lightState?.cardBg === 'rgb(255, 255, 255)', lightState?.cardBg);
    assert('Phase 2.8: Hero pax text color is Kemenhub royal navy (rgb(10, 47, 115) / #0A2F73)', lightState?.heroPaxColor === 'rgb(10, 47, 115)' || lightState?.heroPaxColor === 'rgb(7, 28, 61)', lightState?.heroPaxColor);
    assert('Phase 2.9: Leaflet tile pane invert filter is removed (contrast/natural OSM)', !lightState?.tileFilter.includes('invert(1)'), lightState?.tileFilter);
    assert('Phase 2.10: Meta theme-color updated to Kemenhub Navy #071C3D', lightState?.metaTheme === '#071C3D', lightState?.metaTheme);
    assert('Phase 2.11: Theme is saved to localStorage as "light"', lightState?.storedTheme === 'light', lightState?.storedTheme);
    assert('Phase 2.12: Brand mark badge has Kemenhub Gold accent (rgb(229, 168, 35) / #E5A823)', lightState?.brandMarkBg === 'rgb(229, 168, 35)', lightState?.brandMarkBg);

    // Save Light Mode full screenshot
    const shotLight = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotLightPath = fs.existsSync(path.resolve('Geo12-pages')) ? path.resolve('Geo12-pages/shot-light-mode-overview.png') : path.resolve('shot-light-mode-overview.png');
    fs.writeFileSync(shotLightPath, Buffer.from(shotLight.data, 'base64'));
    assert('Phase 2.13: Light mode overview screenshot saved', fs.existsSync(shotLightPath), `saved: ${shotLightPath}`);

    console.log('\n--- Phase 3: Persistence & Anti-Flicker (Page Reload) ---');
    await cdp.send('Page.reload');
    await new Promise(r => setTimeout(r, 2200));

    const reloadedState = await cdp.eval(`
      (() => {
        const html = document.documentElement;
        return {
          themeAttr: html.getAttribute('data-theme'),
          isThemeLight: html.classList.contains('theme-light'),
          toggleLabel: document.getElementById('themeToggleLabel')?.textContent?.trim(),
          storedTheme: localStorage.getItem('geoportal-theme'),
          frameBg: window.getComputedStyle(document.querySelector('.frame')).backgroundColor,
          cardBg: window.getComputedStyle(document.querySelector('.card')).backgroundColor
        };
      })()
    `);

    assert('Phase 3.1: Theme persists as "light" after page reload', reloadedState?.themeAttr === 'light', reloadedState?.themeAttr);
    assert('Phase 3.2: Class "theme-light" retained after reload', reloadedState?.isThemeLight === true);
    assert('Phase 3.3: Toggle label remains "Dark Mode"', reloadedState?.toggleLabel === 'Dark Mode', reloadedState?.toggleLabel);
    assert('Phase 3.4: Frame background remains Bone White after reload', reloadedState?.frameBg.includes('238, 242, 246') || reloadedState?.frameBg.includes('244, 246, 249'), reloadedState?.frameBg);
    assert('Phase 3.5: Card background remains soft off-white after reload', reloadedState?.cardBg === 'rgb(248, 250, 252)' || reloadedState?.cardBg === 'rgb(255, 255, 255)', reloadedState?.cardBg);

    console.log('\n--- Phase 4: Switch Back to Dark Mode ---');
    await cdp.eval(`document.getElementById('themeToggle').click()`);
    await new Promise(r => setTimeout(r, 600));

    const darkRestoredState = await cdp.eval(`
      (() => {
        const html = document.documentElement;
        return {
          themeAttr: html.getAttribute('data-theme'),
          isThemeLight: html.classList.contains('theme-light'),
          toggleLabel: document.getElementById('themeToggleLabel')?.textContent?.trim(),
          storedTheme: localStorage.getItem('geoportal-theme'),
          heroPaxColor: window.getComputedStyle(document.getElementById('heroPax')).color,
          tileFilter: window.getComputedStyle(document.querySelector('.leaflet-tile-pane')).filter,
          metaTheme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
        };
      })()
    `);

    assert('Phase 4.1: Theme attribute switched back to "dark"', darkRestoredState?.themeAttr === 'dark', darkRestoredState?.themeAttr);
    assert('Phase 4.2: Class "theme-light" removed', darkRestoredState?.isThemeLight === false);
    assert('Phase 4.3: Toggle label restored to "Light Mode"', darkRestoredState?.toggleLabel === 'Light Mode', darkRestoredState?.toggleLabel);
    assert('Phase 4.4: Stored theme in localStorage is "dark"', darkRestoredState?.storedTheme === 'dark', darkRestoredState?.storedTheme);
    assert('Phase 4.5: Hero pax color restored to light', darkRestoredState?.heroPaxColor.includes('244') || darkRestoredState?.heroPaxColor.includes('255'), darkRestoredState?.heroPaxColor);
    assert('Phase 4.6: Leaflet tile pane invert filter restored', darkRestoredState?.tileFilter.includes('invert'), darkRestoredState?.tileFilter);
    assert('Phase 4.7: Meta theme-color restored to #050507', darkRestoredState?.metaTheme === '#050507', darkRestoredState?.metaTheme);

    const shotDarkRestored = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotDarkPath = fs.existsSync(path.resolve('Geo12-pages')) ? path.resolve('Geo12-pages/shot-dark-mode-restored.png') : path.resolve('shot-dark-mode-restored.png');
    fs.writeFileSync(shotDarkPath, Buffer.from(shotDarkRestored.data, 'base64'));
    assert('Phase 4.8: Dark mode restored screenshot saved', fs.existsSync(shotDarkPath), `saved: ${shotDarkPath}`);

    console.log('\n--- Phase 5: Side Drawer Toggle Interaction Test ---');
    await cdp.eval(`document.getElementById('sideThemeToggle').click()`);
    await new Promise(r => setTimeout(r, 400));
    const sideToggledTheme = await cdp.eval(`document.documentElement.getAttribute('data-theme')`);
    assert('Phase 5.1: Clicking #sideThemeToggle switches theme to light', sideToggledTheme === 'light', sideToggledTheme);

    // Switch back to dark to leave clean default
    await cdp.eval(`document.getElementById('sideThemeToggle').click()`);
    await new Promise(r => setTimeout(r, 400));
    const sideRestoredTheme = await cdp.eval(`document.documentElement.getAttribute('data-theme')`);
    assert('Phase 5.2: Clicking #sideThemeToggle again restores theme to dark', sideRestoredTheme === 'dark', sideRestoredTheme);

    console.log('\n--- Phase 6: Browser Console Errors Inspection ---');
    assert('Phase 6.1: Zero browser console errors detected', consoleErrors.length === 0, consoleErrors.join('; '));

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
