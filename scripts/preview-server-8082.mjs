#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Dark Rivet Preview Server (Port 8082)
   ---------------------------------------------------------------------
   Menjalankan preview 100% otentik Dark Rivet Dashboard untuk GeoPORTAL
   secara live di port 8082.
   Mem-proxy /api/* ke gateway resmi produksi secara transparan.
   ===================================================================== */
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RIVET_DIR = path.resolve(__dirname, "..", "dark-rivet");
const SRC_DIR = path.resolve(__dirname, "..", "src");
const API_TARGET_HOST = "magageoportalbptd1jabar.my.id";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8082;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const apiCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit
process.on("uncaughtException", (err) => {
  console.error("[Server UncaughtException]", err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("[Server UnhandledRejection]", err);
});

const server = http.createServer((req, res) => {
  req.on("error", () => {});
  res.on("error", () => {});
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  // 1. Proxy /api/* ke target live dengan caching cerdas (mencegah cold-start GAS)
  if (pathname.startsWith("/api/")) {
    let reqBodyChunks = [];
    req.on("data", chunk => reqBodyChunks.push(chunk));
    req.on("end", () => {
      const reqBody = Buffer.concat(reqBodyChunks);
      const cacheKey = `${pathname}:${reqBody.toString("utf8")}`;
      const cached = apiCache.get(cacheKey);

      if (cached && (Date.now() - cached.time < CACHE_TTL_MS)) {
        res.writeHead(200, {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
          "cache-control": "no-cache",
          "x-cache": "HIT"
        });
        return res.end(cached.body);
      }

      const proxyHeaders = {
        "host": API_TARGET_HOST,
        "content-type": req.headers["content-type"] || "application/json",
        "accept": req.headers["accept"] || "application/json",
        "user-agent": "GeoPORTAL-DarkRivetPreview/1.0"
      };
      if (reqBody.length > 0) {
        proxyHeaders["content-length"] = reqBody.length;
      }

      const proxyReq = https.request({
        hostname: API_TARGET_HOST,
        port: 443,
        path: pathname + (parsedUrl.search || ""),
        method: req.method,
        headers: proxyHeaders
      }, (proxyRes) => {
        let respChunks = [];
        proxyRes.on("data", chunk => respChunks.push(chunk));
        proxyRes.on("end", () => {
          const respBody = Buffer.concat(respChunks);
          if (proxyRes.statusCode === 200) {
            try {
              const parsed = JSON.parse(respBody.toString("utf8"));
              if (parsed.ok) {
                apiCache.set(cacheKey, { body: respBody, time: Date.now() });
              }
            } catch (_) {}
          }
          res.writeHead(proxyRes.statusCode, {
            "content-type": proxyRes.headers["content-type"] || "application/json",
            "access-control-allow-origin": "*",
            "cache-control": "no-cache",
            "x-cache": "MISS"
          });
          res.end(respBody);
        });
      });

      proxyReq.on("error", (err) => {
        console.error(`[API Proxy Error] ${req.method} ${pathname}:`, err.message);
        if (cached) {
          res.writeHead(200, {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "cache-control": "no-cache",
            "x-cache": "STALE"
          });
          return res.end(cached.body);
        }
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Proxy connection failed: " + err.message }));
      });

      if (reqBody.length > 0) {
        proxyReq.write(reqBody);
      }
      proxyReq.end();
    });
    return;
  }

  // 2. Layani Peta GeoPORTAL penuh di /peta dan /peta/
  if (pathname === "/peta") {
    res.writeHead(302, { "Location": "/peta/" });
    return res.end();
  }

  if (pathname === "/peta/") {
    const petaPath = path.join(SRC_DIR, "index.html");
    fs.readFile(petaPath, "utf-8", (err, html) => {
      if (err) {
        res.writeHead(500, { "content-type": "text/plain" });
        return res.end("Error loading Peta GeoPORTAL");
      }
      const darkRivetLinks = `
  <script>(function(){try{var t=localStorage.getItem('geoportal-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.add('theme-light');}else{document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.remove('theme-light');}}catch(_){}})();</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/geoportal-rivet.css">
  <link rel="stylesheet" href="/submodule-rivet.css">
</head>`;
      let modified = html.replace("</head>", darkRivetLinks);
      if (!modified.includes("submodule-bridge.js")) {
        modified = modified.replace("</body>", `  <script src="/submodule-bridge.js"></script>\n</body>`);
      }
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache"
      });
      res.end(modified);
    });
    return;
  }

  // 3. Layani Root atau /command-center/ dengan Dark Rivet index.html
  if (pathname === "/" || pathname === "/command-center" || pathname === "/command-center/") {
    const indexPath = path.join(RIVET_DIR, "index.html");
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(500, { "content-type": "text/plain" });
        return res.end("Error loading Dark Rivet");
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
      res.end(data);
    });
    return;
  }

  // 4. Normalisasi pathname untuk pencarian file
  let reqRelPath = pathname;
  if (reqRelPath.startsWith("/peta/")) {
    reqRelPath = reqRelPath.slice("/peta".length);
  }
  const safeSuffix = path.normalize(reqRelPath).replace(/^(\.\.[/\\])+/, "");
  const rivetPath = path.join(RIVET_DIR, safeSuffix);

  // Cek file di direktori dark-rivet terlebih dahulu (kecuali aset /peta/)
  if (!pathname.startsWith("/peta/")) {
    try {
      if (fs.existsSync(rivetPath) && fs.statSync(rivetPath).isFile()) {
        const ext = path.extname(rivetPath).toLowerCase();
        res.writeHead(200, {
          "content-type": MIME[ext] || "application/octet-stream",
          "cache-control": "no-cache"
        });
        return fs.createReadStream(rivetPath).pipe(res);
      }
    } catch (_) {}
  }

  // 5. Fallback ke Geo12-pages/src/ jika mencari aset atau modul lain
  let srcPath = path.join(SRC_DIR, safeSuffix);

  fs.stat(srcPath, (err2, stats2) => {
    if (!err2 && stats2.isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(302, { "Location": pathname + "/" });
        return res.end();
      }
      srcPath = path.join(srcPath, "index.html");
    }

    fs.stat(srcPath, (err3, stats3) => {
      if (!err3 && stats3.isFile()) {
        const ext3 = path.extname(srcPath).toLowerCase();

        // Jika menyajikan HTML submodul command center, cek mode embed atau shell
        if (ext3 === ".html") {
          // Akses langsung tanpa ?embed=1 disajikan dalam Persistent Sidebar Shell
          if (pathname.includes("/command-center/") && parsedUrl.searchParams.get("embed") !== "1") {
            const shellPath = path.join(RIVET_DIR, "index.html");
            fs.readFile(shellPath, (errShell, dataShell) => {
              if (errShell) {
                res.writeHead(500, { "content-type": "text/plain" });
                return res.end("Error loading Dark Rivet Shell");
              }
              res.writeHead(200, {
                "content-type": "text/html; charset=utf-8",
                "cache-control": "no-cache"
              });
              res.end(dataShell);
            });
            return;
          }

          fs.readFile(srcPath, "utf-8", (errHtml, html) => {
            if (errHtml) {
              res.writeHead(500, { "content-type": "text/plain" });
              return res.end("Error reading HTML");
            }
            if (pathname.includes("/command-center/")) {
              const darkRivetLinks = `
  <script>(function(){try{var t=localStorage.getItem('geoportal-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.add('theme-light');}else{document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.remove('theme-light');}}catch(_){}})();</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/index-CYMQcwqr.css">
  <link rel="stylesheet" href="/geoportal-rivet.css">
  <link rel="stylesheet" href="/submodule-rivet.css">
</head>`;
              let modified = html.replace("</head>", darkRivetLinks);
              modified = modified.replace("</body>", `  <script src="/submodule-bridge.js"></script>\n</body>`);
              res.writeHead(200, {
                "content-type": "text/html; charset=utf-8",
                "cache-control": "no-cache"
              });
              return res.end(modified);
            }
            res.writeHead(200, {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-cache"
            });
            return res.end(html);
          });
          return;
        }

        res.writeHead(200, {
          "content-type": MIME[ext3] || "application/octet-stream",
          "content-length": stats3.size,
          "cache-control": "no-cache"
        });
        return fs.createReadStream(srcPath).pipe(res);
      }

      res.writeHead(404, { "content-type": "text/plain" });
      res.end(`404 Not Found: ${pathname}`);
    });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`============================================================`);
  console.log(`GeoPORTAL BPTD Jabar — Dark Rivet Server Ready`);
  console.log(`============================================================`);
  console.log(`Dark Rivet 100% (Port 8082) : http://localhost:${PORT}/command-center/`);
  console.log(`API Proxy Target            : https://${API_TARGET_HOST}/api/`);
  console.log(`============================================================`);
});
