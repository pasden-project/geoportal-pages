#!/usr/bin/env node
/* =====================================================================
   Source : <repo>/v2/            (index.html, command-center.css, command-center.js)
            <repo>/v2/terminal/   (index.html, terminal.css, terminal.js)
            <repo>/v2/trayek/     (index.html, trayek.css, trayek.js)
            <repo>/v2/perintis/   (index.html, perintis.css, perintis.js)
            <repo>/v2/uppkb/      (index.html, uppkb.css, uppkb.js)
            <repo>/v2/od/         (index.html, od.css, od.js)
            <repo>/v2/connectivity/ (index.html, connectivity.css, connectivity.js)
            <repo>/v2/early-warning/ (index.html, early-warning.css, early-warning.js)
            <repo>/v2/program/    (index.html, program.css, program.js)
   Output : <repo>/src/command-center/
            <repo>/src/command-center/terminal/
            <repo>/src/command-center/trayek/
            <repo>/src/command-center/perintis/
            <repo>/src/command-center/uppkb/
            <repo>/src/command-center/od/
            <repo>/src/command-center/connectivity/
            <repo>/src/command-center/early-warning/
            <repo>/src/command-center/program/
   ----------------------------------------------------------------
   Node built-in only (fs, path, url). Tidak tergantung CWD.
   Idempotent: menyalin file wajib, membuat folder output bila belum ada,
   TIDAK menghapus file lain. Exit code 0 = sukses, nonzero = gagal.
   Direktori dan file terminal & trayek adalah WAJIB (mandatory).
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

const TRAYEK_SOURCE_DIR = resolve(SOURCE_DIR, "trayek");
const TRAYEK_OUT_DIR = resolve(OUT_DIR, "trayek");

const TRAYEK_FILES = [
    "index.html",
    "trayek.css",
    "trayek.js",
];
const PERINTIS_SOURCE_DIR = resolve(SOURCE_DIR, "perintis");
const PERINTIS_OUT_DIR = resolve(OUT_DIR, "perintis");

const PERINTIS_FILES = [
    "index.html",
    "perintis.css",
    "perintis.js",
];
const UPPKB_SOURCE_DIR = resolve(SOURCE_DIR, "uppkb");
const UPPKB_OUT_DIR = resolve(OUT_DIR, "uppkb");

const UPPKB_FILES = [
    "index.html",
    "uppkb.css",
    "uppkb.js",
];
const OD_SOURCE_DIR = resolve(SOURCE_DIR, "od");
const OD_OUT_DIR = resolve(OUT_DIR, "od");

const OD_FILES = [
    "index.html",
    "od.css",
    "od.js",
];
const CONNECTIVITY_SOURCE_DIR = resolve(SOURCE_DIR, "connectivity");
const CONNECTIVITY_OUT_DIR = resolve(OUT_DIR, "connectivity");

const CONNECTIVITY_FILES = [
    "index.html",
    "connectivity.css",
    "connectivity.js",
];
const EARLY_WARNING_SOURCE_DIR = resolve(SOURCE_DIR, "early-warning");
const EARLY_WARNING_OUT_DIR = resolve(OUT_DIR, "early-warning");

const EARLY_WARNING_FILES = [
    "index.html",
    "early-warning.css",
    "early-warning.js",
];
const PROGRAM_SOURCE_DIR = resolve(SOURCE_DIR, "program");
const PROGRAM_OUT_DIR = resolve(OUT_DIR, "program");

const PROGRAM_FILES = [
    "index.html",
    "program.css",
    "program.js",
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

    // Direktori trayek dan ketiga filenya wajib ada setelah modul trayek dirilis
    if (!existsSync(TRAYEK_SOURCE_DIR)) {
        console.error(`ERROR: direktori source trayek wajib ada dan tidak ditemukan: ${TRAYEK_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(TRAYEK_OUT_DIR, { recursive: true });
    for (const name of TRAYEK_FILES) {
        const srcPath = resolve(TRAYEK_SOURCE_DIR, name);
        const outPath = resolve(TRAYEK_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source trayek wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `trayek/${name}`, size: data.length });
    }
    // Direktori perintis dan ketiga filenya wajib ada setelah modul perintis dirilis
    if (!existsSync(PERINTIS_SOURCE_DIR)) {
        console.error(`ERROR: direktori source perintis wajib ada dan tidak ditemukan: ${PERINTIS_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(PERINTIS_OUT_DIR, { recursive: true });
    for (const name of PERINTIS_FILES) {
        const srcPath = resolve(PERINTIS_SOURCE_DIR, name);
        const outPath = resolve(PERINTIS_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source perintis wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `perintis/${name}`, size: data.length });
    }
    // Direktori uppkb dan ketiga filenya wajib ada setelah modul uppkb dirilis
    if (!existsSync(UPPKB_SOURCE_DIR)) {
        console.error(`ERROR: direktori source uppkb wajib ada dan tidak ditemukan: ${UPPKB_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(UPPKB_OUT_DIR, { recursive: true });
    for (const name of UPPKB_FILES) {
        const srcPath = resolve(UPPKB_SOURCE_DIR, name);
        const outPath = resolve(UPPKB_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source uppkb wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `uppkb/${name}`, size: data.length });
    }
    // Direktori od dan ketiga filenya wajib ada setelah modul OD dirilis
    if (!existsSync(OD_SOURCE_DIR)) {
        console.error(`ERROR: direktori source od wajib ada dan tidak ditemukan: ${OD_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(OD_OUT_DIR, { recursive: true });
    for (const name of OD_FILES) {
        const srcPath = resolve(OD_SOURCE_DIR, name);
        const outPath = resolve(OD_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source od wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `od/${name}`, size: data.length });
    }
    // Direktori connectivity dan ketiga filenya wajib ada setelah modul Connectivity dirilis
    if (!existsSync(CONNECTIVITY_SOURCE_DIR)) {
        console.error(`ERROR: direktori source connectivity wajib ada dan tidak ditemukan: ${CONNECTIVITY_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(CONNECTIVITY_OUT_DIR, { recursive: true });
    for (const name of CONNECTIVITY_FILES) {
        const srcPath = resolve(CONNECTIVITY_SOURCE_DIR, name);
        const outPath = resolve(CONNECTIVITY_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source connectivity wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `connectivity/${name}`, size: data.length });
    }
    // Direktori early-warning dan ketiga filenya wajib ada setelah modul Early Warning dirilis
    if (!existsSync(EARLY_WARNING_SOURCE_DIR)) {
        console.error(`ERROR: direktori source early-warning wajib ada dan tidak ditemukan: ${EARLY_WARNING_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(EARLY_WARNING_OUT_DIR, { recursive: true });
    for (const name of EARLY_WARNING_FILES) {
        const srcPath = resolve(EARLY_WARNING_SOURCE_DIR, name);
        const outPath = resolve(EARLY_WARNING_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source early-warning wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `early-warning/${name}`, size: data.length });
    }
    // Direktori program dan ketiga filenya wajib ada setelah modul Program & Kinerja dirilis
    if (!existsSync(PROGRAM_SOURCE_DIR)) {
        console.error(`ERROR: direktori source program wajib ada dan tidak ditemukan: ${PROGRAM_SOURCE_DIR}`);
        process.exitCode = 1;
        return;
    }

    mkdirSync(PROGRAM_OUT_DIR, { recursive: true });
    for (const name of PROGRAM_FILES) {
        const srcPath = resolve(PROGRAM_SOURCE_DIR, name);
        const outPath = resolve(PROGRAM_OUT_DIR, name);

        let data;
        try {
            data = readFileSync(srcPath);
        } catch (err) {
            console.error(`ERROR: file source program wajib tidak ditemukan: ${srcPath} (${err.code})`);
            process.exitCode = 1;
            return;
        }

        writeFileSync(outPath, data);
        results.push({ name: `program/${name}`, size: data.length });
    }

    for (const r of results) {
        console.log(`OK  ${r.name}  ${r.size} bytes`);
    }
    console.log(`Output: ${OUT_DIR}`);
}

build();
