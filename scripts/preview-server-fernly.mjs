#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Fernly Navy Preview Server (Port 8081)
   ---------------------------------------------------------------------
   Menjalankan preview GeoPORTAL Command Center V2 dengan Varian
   Fernly UI/UX (Navy Kemenhub + Smooth Animations) secara live di port 8081.
   Semua panggilan /api/* tetap di-proxy ke API gateway produksi secara transparan.
   ===================================================================== */
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "..", "src");
const FERNLY_DIR = path.resolve(__dirname, "..", "fernly");
const API_TARGET_HOST = "magageoportalbptd1jabar.my.id";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081;

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

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Proxy /api/* ke target live
  if (pathname.startsWith("/api/")) {
    const proxyHeaders = {
      "host": API_TARGET_HOST,
      "content-type": req.headers["content-type"] || "application/json",
      "accept": req.headers["accept"] || "application/json",
      "user-agent": "GeoPORTAL-FernlyPreview/1.0"
    };

    const proxyReq = https.request({
      hostname: API_TARGET_HOST,
      port: 443,
      path: pathname + (parsedUrl.search || ""),
      method: req.method,
      headers: proxyHeaders
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        "content-type": proxyRes.headers["content-type"] || "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "no-cache"
      });
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error(`[API Proxy Error] ${req.method} ${pathname}:`, err.message);
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Proxy connection failed: " + err.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  // 2. Layani asset khusus Fernly
  if (pathname === "/command-center/fernly-theme.css") {
    const cssPath = path.join(FERNLY_DIR, "command-center-fernly.css");
    fs.readFile(cssPath, (err, data) => {
      if (err) {
        res.writeHead(404, { "content-type": "text/plain" });
        return res.end("CSS Fernly not found");
      }
      res.writeHead(200, { "content-type": "text/css; charset=utf-8", "cache-control": "no-cache" });
      res.end(data);
    });
    return;
  }

  if (pathname === "/command-center/command-center-anim.js") {
    const jsPath = path.join(FERNLY_DIR, "command-center-anim.js");
    fs.readFile(jsPath, (err, data) => {
      if (err) {
        res.writeHead(404, { "content-type": "text/plain" });
        return res.end("JS Anim not found");
      }
      res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-cache" });
      res.end(data);
    });
    return;
  }

  // 3. Layani file statik dari Geo12-pages/src/
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(SRC_DIR, safeSuffix);

  function serveFile(targetFile, targetStats) {
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    // Jika HTML di dalam command-center, sisipkan Fernly Theme & Anim script
    if (ext === ".html" && targetFile.includes(path.join(SRC_DIR, "command-center"))) {
      fs.readFile(targetFile, "utf-8", (err, html) => {
        if (err) {
          res.writeHead(500, { "content-type": "text/plain" });
          return res.end("Error reading HTML");
        }
        
        let modifiedHtml = html;
        // Sisipkan stylesheet Fernly di <head>
        const linkTag = `<link rel="stylesheet" href="/command-center/fernly-theme.css">\n</head>`;
        modifiedHtml = modifiedHtml.replace("</head>", linkTag);

        // Sisipkan script animasi di sebelum </body>
        const scriptTag = `<script src="/command-center/command-center-anim.js"></script>\n</body>`;
        modifiedHtml = modifiedHtml.replace("</body>", scriptTag);

        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache"
        });
        res.end(modifiedHtml);
      });
      return;
    }

    res.writeHead(200, {
      "content-type": contentType,
      "content-length": targetStats.size,
      "cache-control": "no-cache"
    });
    fs.createReadStream(targetFile).pipe(res);
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      const indexFile = path.join(filePath, "index.html");
      return fs.stat(indexFile, (err2, stats2) => {
        if (err2 || !stats2.isFile()) {
          res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
          res.end(`404 Not Found: ${pathname}`);
          return;
        }
        serveFile(indexFile, stats2);
      });
    }

    if (err || !stats.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    serveFile(filePath, stats);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`============================================================`);
  console.log(`GeoPORTAL BPTD Jabar — Fernly Navy Preview Server Ready`);
  console.log(`============================================================`);
  console.log(`Command Center Fernly (Port 8081): http://localhost:${PORT}/command-center/`);
  console.log(`API Proxy Target                 : https://${API_TARGET_HOST}/api/`);
  console.log(`============================================================`);
});
