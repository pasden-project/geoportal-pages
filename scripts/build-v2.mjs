#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center V2 build script (PHASE 14A)
   ----------------------------------------------------------------
   Source : <repo>/v2/            (index.html, command-center.css, command-center.js)
   Output : <repo>/src/command-center/
   ----------------------------------------------------------------
   Node built-in only (fs, path, url). Tidak tergantung CWD.
   Idempotent: menyalin 3 file, membuat folder output bila belum ada,
   TIDAK menghapus file lain, TIDAK menyentuh output yang sudah ada selain
   3 file ini. Exit code 0 = sukses.
   ===================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const SOURCE_DIR = resolve(REPO, "v2");
const OUT_DIR = resolve(REPO, "src", "command-center");

const FILES = [
    "index.html",
    "command-center.css",
    "command-center.js",
];

function build() {
    mkdirSync(OUT_DIR, { recursive: true });

    const results = [];
    for (const name of FILES) {
        const srcPath = resolve(SOURCE_DIR, name);
        const outPath = resolve(OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: source tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name, size: data.length });
    }

    for (const r of results) {
        console.log(`OK  ${r.name}  ${r.size} bytes`);
    }
    console.log(`Output: ${OUT_DIR}`);
}

build();
