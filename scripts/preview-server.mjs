#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Local Preview Server with Live API Proxy
   ---------------------------------------------------------------------
   Melayani file statik lokal dari Geo12-pages/src/ (dengan perbaikan OSM,
   aksesibilitas marker, dan batas Jabar) sekaligus mem-proxy panggilan
   /api/* ke API gateway produksi secara transparan tanpa CORS issue.
   ===================================================================== */
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "..", "src");
const API_TARGET_HOST = "magageoportalbptd1jabar.my.id";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

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
      "user-agent": "GeoPORTAL-LocalPreview/1.0"
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

  // 2. Layani file statik dari Geo12-pages/src/
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(SRC_DIR, safeSuffix);

  function serveFile(targetFile, targetStats) {
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

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
  console.log(`GeoPORTAL BPTD Jabar — Local Preview Server Ready`);
  console.log(`============================================================`);
  console.log(`Peta Utama (Legacy)     : http://localhost:${PORT}/`);
  console.log(`Command Center V2 (Baru): http://localhost:${PORT}/command-center/`);
  console.log(`API Proxy Target        : https://${API_TARGET_HOST}/api/`);
  console.log(`============================================================`);
});
