#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Command Center V2 build script (PHASE 14A, 15C)
   ----------------------------------------------------------------
   Source : <repo>/v2/            (index.html, command-center.css, command-center.js)
            <repo>/v2/terminal/   (index.html, terminal.css, terminal.js)
   Output : <repo>/src/command-center/
            <repo>/src/command-center/terminal/
   ----------------------------------------------------------------
   Node built-in only (fs, path, url). Tidak tergantung CWD.
   Idempotent: menyalin file wajib, membuat folder output bila belum ada,
   TIDAK menghapus file lain. Exit code 0 = sukses, nonzero = gagal.
   Direktori dan 3 file terminal adalah WAJIB (mandatory).
   ===================================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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

const TERMINAL_SOURCE_DIR = resolve(SOURCE_DIR, "terminal");
const TERMINAL_OUT_DIR = resolve(OUT_DIR, "terminal");

const TERMINAL_FILES = [
    "index.html",
    "terminal.css",
    "terminal.js",
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

    // Direktori terminal dan ketiga filenya wajib ada setelah modul terminal dirilis
    if (!existsSync(TERMINAL_SOURCE_DIR)) {
        console.error(`ERROR: direktori source terminal wajib ada dan tidak ditemukan: ${TERMINAL_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(TERMINAL_OUT_DIR, { recursive: true });
    for (const name of TERMINAL_FILES) {
        const srcPath = resolve(TERMINAL_SOURCE_DIR, name);
        const outPath = resolve(TERMINAL_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source terminal wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `terminal/${name}`, size: data.length });
    }

    for (const r of results) {
        console.log(`OK  ${r.name}  ${r.size} bytes`);
    }
    console.log(`Output: ${OUT_DIR}`);
}

build();
