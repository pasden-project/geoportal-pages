# Migration Plan — GeoPORTAL BPTD Jabar → Cloudflare Pages + REST API

> Status: DRAFT — belum ada kode yang diubah (sesuai aturan: audit dulu, minta persetujuan untuk perubahan besar).
> Tanggal: 2026-08-06 · Penulis: Technical Lead (audit terhadap kode saat ini)

---

## 1. Ringkasan Eksekutif

Proyek saat ini adalah **web app Google Apps Script monolitik**: satu `doGet` menyajikan `Index.html`, lalu `include()` menyuntikkan `CSS.html` & `JS.html`. Seluruh backend dipanggil frontend memakai `google.script.run`, yang **hanya berfungsi bila halaman HTML disajikan oleh origin Apps Script itu sendiri**.

**Implikasi arsitektur paling penting:** Anda TIDAK bisa memindahkan frontend ke Cloudflare Pages sambil tetap memakai `google.script.run` — karena `google.script.run` adalah API yang di-inject hanya pada halaman yang disajikan oleh apps script yang sama. Begitu halaman hidup di `pages.dev`, `google.script.run` menjadi `undefined` dan SELURUH dashboard mati.

Artinya urutan migrasi Anda (Tahap 3 REST API → Tahap 4 Pages) **sudah benar dan wajib**: Tahap 3 adalah *prasyarat keras* untuk Tahap 4, bukan sekadar preferensi.

Selain itu, `google.script.run` diganti `fetch()` TIDAK bisa langsung menarik ke endpoint Apps Script `/exec` untuk operasi **POST JSON** karena Apps Script tidak mengirim header CORS preflight yang diminta browser. Solusi format yang andal = **proxy Cloudflare Worker** di depan Apps Script (lihat §7).

---

## 2. Audit Arsitektur Saat Ini (hasil pembacaan penuh 4 file)

### 2.1 Struktur & Dependency

| File | Ukuran | Peran | Dependency eksternal |
|---|---|---|---|
| `Code.gs` | 1.184 baris (67 KB) | Backend: data, sinkronisasi, CRUD terminal/UPPKB, potret, route, upload foto, cache | SpreadsheetApp, DriveApp, CacheService, LockService, PropertiesService (hanya folder foto) |
| `Index.html` | 210 baris | Skeleton + semua overlay/sheet/modal | `include('CSS')`, `include('JS')` |
| `CSS.html` | 1.880 baris (48 KB) | Semua styling + token glass + dark mode + potret | — |
| `JS.html` | 2.510 baris (121 KB) | Semua logika frontend (Leaflet, Chart.js) | Leaflet 1.9.4, Leaflet.markercluster, Chart.js 4.4.0, Google Fonts |

### 2.2 Alur Data (30.000 kaki)
```
Leaflet/Chart.js (JS.html, dalam satu halaman Apps Script)
   │  google.script.run.<fn>()   ← 12 panggilan RPC
   ▼
Code.gs (web app, file tunggal)
   │  SpreadsheetApp.openById / CacheService / DriveApp
   ▼
Google Sheets (Dashboard, Sumber Produksi, Sumber Potret / ID keras di kode)
```

### 2.3 Business Logic — **masih di BACKEND** (Google Apps Script → Spreadsheet)
Semua yang menyentuh Google API TypeScript (Sheets/Drive/Lock/Cache/PropertiesService) **wajib tetap di Apps Script**:
- Pembacaan/penulisan sheet (Terminal, Produksi, TerminalDetail, Corridors, Routes, 5× Potret*, PotretBarangMeta)
- Parser sheet bulanan per terminal (`prodDeteksiBlokBulan_`, `prodParseTanggal_`) dan rekap barang (`ambilDataBarangRekap_`)
- Sinkronisasi (`sinkronisasiProduksi`, `sinkronisasiPotretBarang`, `tarikDataProduksi...`, `savePotretBarangMeta`)
- Upload foto → Drive (`simpanFotoTerminal_`, `ambilFolderFoto_`)
- Cache terdistribusi CacheService (chunked 90 KB) & LockService
- Agregasi numerik KPI/trend/ranking/insight (saat ini DI Code.gs, sebenarnya murni JS — bisa dipindah, lihat §8)

### 2.4 UI Layer — **kandidat pindah ke Cloudflare Pages**
`Index.html` + `CSS.html` + `JS.html` seluruhnya UI murni (tidak ada akses ke Sheets langsung).
TAPI dipindahkan **hanya setelah** transport data diubah (Tahap 3). Ada 121 KB JS + 48 KB CSS + banyak SVG inline.

### 2.5 API/transport surface (RPC yang dipakai JS.html)
Tepat **12 panggilan `google.script.run`** yang harus dipindahkan ke `fetch()`:

| # | Fungsi UI | Backend `<fn>` | Arah | Prioritas |
|---|---|---|---|---|
| 1 | inisialisasi (DOMContentLoaded) | `getAvailableYears` | read | fase A |
| 2 | muatData (dashboard) | `getDashboardData(filter)` | read | fase A |
| 3 | data mentah | `getAllRawData` | read | fase A |
| 4 | loadRoutes | `getRoutes` | read | fase A |
| 5 | deleteRoute | `deleteRoute(id)` | write | fase C |
| 6 | saveCurrentRoute | `saveRoute(payload)` | write | fase C |
| 7 | jalankanUpdateData | `sinkronisasiProduksi(tahun)` | write (berat) | fase D |
| 8 | profile load | `getTerminalDetail(kode)` | read | fase B |
| 9 | profile save | `saveTerminalDetail(payload)` | write + upload foto | fase D |
| 10 | buang/potret | `getPotretRows(section)` | read | fase B |
| 11 | potret meta | `getPotretBarangMeta(tahun)` | read | fase B |
| 12 | potret save | `savePotretRows(section, rows)` | write | fase D |

Ada juga **write path server-side** yang tidak langsung dipanggil UI: `tarikDataProduksiTahunIni()`, `sinkronisasiPotretBarangTahunIni()` (trigger).

### 2.6 Konfigurasi yang sekarang di-hardcode → harus dipindah ke konfig
- `SHEET_ID_*`, `SHEET_*`, `CACHE_SECONDS` → Code.gs
- Warna/tipe marker, palette trayek, koordinat UPPKB fallback, `POTRET_LOKASI`, `POTRET_DEFAULT`, `LAST_UPDATE_KEY`, `THEME_KEY` → JS.html
- ID Spreadsheet di Dashboard biasa mengikuti admin. Pindahkan ke config (mis. scrip_properties / var) dari hardcode agar maintenance aman.

### 2.7 Keamanan saat ini (audit §9)
- **TIDAK ada autentikasi.** Applicationnya di-deploy "Anyone with link" (X-FrameOptions ALLOWALL), tetapi endpointe WRITE (`saveRoute`, `deleteRoute`, `saveTerminalDetail`, `savePotretRows`, `sinkronisasiProduksi`) → **siapa pun di internet dapat memanggil** selama tahu fungsi GAS (fungsi publik).
- `getTerminalDetail`/`saveTerminalDetail`: tidak ada sanitasi input pada fields selain kode.
- Error: `muatData`/`muatDataMentah` menampilkan `e.message` mentah ke UI & alert → bisa bocor nama sheet/internals (risiko kecil, tetapi langgar prinsip).
- Foto Drive `ANYONE_WITH_LINK` (sengaja, agar tampil untuk publik).

---

## 3. Model Target (sesuai keinginan user)

```
User ──HTTPS──▶ domain.my.id
                 │ DNS (Cloudflare, proxy "orange") + TLS
                 ▼
            Cloudflare Pages (frontend statik: index.html, style.css, script.js, ...)
                 │  fetch('/api/...')  →  SAME-ORIGIN via Worker route
                 ▼
            Cloudflare Worker (API Gateway: CORS + validasi + forward + header secret)
                 │  POST/GET ke /exec (Apps Script)
                 ▼
            Google Apps Script doGet/doPost (REST router + validasi + Lock)
                 │
                 ▼
            Google Sheets (database tetap)
```
Backend & database **tetap** Google Apps Script + Google Sheets, sesuai prinsip user.

---

## 4. Prinsip yang dipatuhi (dari aturan user)
1. TANPA rewrite/redesign fungsional; semua fitur lama tetap jalan.
2. Migrasi inkremental → **transport adapter + feature flag** (lihat §6), bukan pemotongan besar.
3. Downtime minimal: frontend lama tetap melayani sampai Akp .rest baru teruji.
4. Bisa rollback: file tetap satu artefak di Apps Script; hanya transportnya flip.

---

## 5. Risiko Migrasi (diteliti)

| Risiko | Dampak | Mitigasi |
|---|---|---|
| `google.script.run` hilang di Pages → dashboard 100% mati | KRITIS | REST API + Worker dasarnya tuntas SEBELUMpindah UI; gunakan flag transport |
| CORS Apps Script blok POST fetch | Tinggi | Proxy Worker + header secret; jangan fetch langsung ke /exec untuk write |
| `getDashboardData` endpoint raksasa (semua data sekali) | Sedang | Dipertahanvn tahap awal; bisa dipecah belakangan tanpa perlu wajib |
| Capture usensitiv fitur lama (CRUD, foto upload base64, editor tabel) | Tinggi | Uji setiap endpoint write terhadap fungsi lama (mapping §2.5) |
| Time-zone / serial tanggal Google Sheets (Date vs angka) | Sedang | `prodParseTanggal_` sudah robust; JANGAN diperbaiki tanpa alasan |
| Token/secret bocor di frontend statik | Tinggi | Secret HANYA di Worker (variabel lingkungan), tidak pernah di bundle UI |
| Foto Drive sharing publik | Sedang | `ANYONE_WITH_LINK` sudah benar untuk viewer; pertimbangkan kasus privasi |
| Deploy Apps Script memiliki rounding (kuota, 6 menit) | Sedang | Sinkronisasi tetap berjalan server-side / via trigger; jangan dipindah ke client |
| Cache wab SettingsAppsScript kuota 1 GB | Rendah | CacheService sudah chunked; pertahankan |

---

## 6. Keputusan Desain (bandingkan opsi)

### Opsi transport (kritikal)
1. **A. Cloudflare Worker gateway (REKOMENDASI)** — browser memanggil `fetch('/api/...')` ke Worker; Worker CORS + validasi + forward ke Apps Script, kirim header secret. Apps Script curiganya: tolak tanpa header secret.
2. **B. Akses langsung browser → `/exec`** — GET read bisa, POST write blokir CORS. Simpel tapi tidak andal utk tulis.
3. **C. WebApp tanpa Worker, pakai JSONP/iframe** — tidak disarankan (kotor, rawan bocor).

Disarankan **A** untuk semua; Opsional **B** untuk endpoint read-read-only ringan belakangan.

### Kebutuhan paket REST router in Apps Script
- Tambahkan `doPost` + router `path` (`/dashboard`, `/routes`, `/profile`, `/potret`, `/sync`).
- Fungsi WRITE diberi **guard token** (dari header diteruskan Worker).
- Budaya tetap layani browser lama: bagian Halaman UI masih bisa `google.script.run` selama belum pindah — router & adapter bertingkat.

---

## 7. Rencana Bertahap (status fase dimulai → berakhir)

> Prinsip: **setiap fase DEPLOY-MANDIRI ke existing web app & uji** sebelum lanjut. Tidak pernah mengubah arsitektur runtime yang belum teruji.

**Fase 0 — Persiapan (ringan, tanpa runtime)** ~0.5 d
- [ ] Pasang git + Github repo, branch `main`/`development`
- [ ] Inis PDF freeze current (backup-2026-08-05 sudah ada; tambah snapshot manual)

**Fase 1 — Konfig + Beham (backdrop Code.gs 0 rewrite) ~1 d**
- [ ] Buka webapp `doPost` + router JSON (`ContentService`) selain `doGet`.
- [ ] Terapkan validasi header sample (race: guard sederhana) → return `{ok:true,data}`.
- [ ] UJI endpoint read lewat URL langsung (browser GET) → respons JSON sama-format dgn object yang dipakai frontend.

**Fase 2 — Cloudflare Worker API Gateway (tapi masih dipanggil dari Apps Script UI jika belum pindah)**
- [ ] Worker: route `/*` on `api.<domain>`; tambah CORS; forward ke `/exec`; masukkan header `x-gs-token`.
- [ ] Cloudflare Pages dummy (static `index.html` "ok") dibangun.
- [ ] Uji: `fetch('/api/dashboard')` dari Pages → Worker → Apps Script → JSON.

**Fase 3 — Frontend API Adapter (`src/api.js`) begad (refactor transport, UI berubah spr minimal)**
- [ ] Buat modul `api.js` (`Backend.dashboard()` dst.) dengan **flag `API_MODE = 'gas' | 'proxy'`** (config).
- [ ] Ganti **satu per satu** 12 panggilan `google.script.run` → `Backend.x()`; UI terus pakai `Backend.x` (sumber kebenaran tunggal).
- [ ] Setiap sub-berpindah diuji end-to-end (read fase A, profile B, write C, sinkronisasi D).

**Fase 4 — Pisahkan aset frontend**
- [ ] `CSS.html` → `style.css`; `JS.html` → `script.js` (isi `<script>`/`<style>` di-les paksa).
- [ ] `Index.html` direwrite jadi `index.html` murni (tanpa `include()`), link `style.css`+`script.js`.
- [ ] (Masih di cantó Apps Script dulu — boleh simpan dua produce; atau langsung di Pages di Fase 5.)

**Fase 5 — Deploy ke Cloudflare Pages**
- [ ] Commit aset statis → Pages auto-build (masukkan build script simple / none).
- [ ] Set `public/_headers` (security) + route API ke Worker.
- [ ] Uji penuh lintas feature checklist; banding performa.

**Fase 6 — Domain**
- [ ] Set `CNAME`/`A` domain.my.id → Pages via Cloudflare (orange).
- [ ] TLS 550; pastikan `/api` dari domain yang sama tetap nol CORS (same-origin).

**Fase 7 — Optimasi performa** (setelah stabl)
- [ ] Bundle/minify CSS/JS (esbuild/terskel), hashing.
- [ ] Lazy-load segmen Potret & UPPKB.
- [ ] Cache static `stale-while-revalidate` di Worker; cache session `CacheService` sudah terbangun.
- [ ] Tun Peng; Chart.js lazy mount canvas.

---

## 8. Estimasi Effort (person-day)

| Aktivitas | Effort |
|---|---|
| Code.g. router + validasi (+token guard) | 1–1.5 d |
| Cloudflare Worker + integrasi domain | 0.5–1 d |
| Frontend adapter api.js (12 call swap + uji) | 1.5–2.5 d |
| Pisah CSS/JS + rewire index | 0.5–1 d |
| Deploy Pages + DNS + TLS | 0.5–1 d (sebagian menunggu) |
| Optimasi + regression pass | 1–1.5 d |
| **Total** | **± 5–8 hari kerja inkremental** |

---

## 9. Rekomendasi arsitektur tambahan (durasi "pindahkan data")
- **Lebih baik dari `getDashboardData`:** pertahankan baseline pertama, pisah UPPKB & Potret jadi endpoint **dedicated (lazy-loaded)** pada Fase 7 agar payload awal kecil.
- **Kebijakan autentikasi di masa depan:** bila perlu login, gunakan **Cloudflare Access** (di depan seluruh origin, zero-code) atau IDP; hal itu tidak menyentuh Apps Script. Rekomendasi: jangan auth di GAS; mahal & rapuh.
- **Least privilege katup API GAS:** menggunakan `ContentService` + validasi token; foto tetap via DriveViewer dengan signed link kalau diperlukan.

---

## 10. Rollback Plan
- **Sebelum berpindah** ke Pages, webapp Apps Script TIDAK dihapus — `Main` asli sebagai `release` cadangan (deployments versioning Apps Script punya VersionHistory).
- Frontend adapter punya flag `transport`: bila API gagal, balik `'google'` dalam 1 menit → status keduanya Apps Script webapp lama? TIDAK, karena jika sudah di Pages tak anti google.script.run.
  → **Syarat rollback aman:** simpan satu snapshot DV app lama yg masih `google.script.run` sebagai **last-known-good deployment** (di `backup-*.zip`). Rollback = pointer DNS ke deployment Apps Script Webapp lama (diakses lewat ID WebAppAddress, atau iframe) sampai bug fixed.
- Tidak ada rewriting timer sehingga rollback bersifat "point-to-pointer" (DNS/page switch), bukan kir-ulang.

---

## Lampiran A — Mapping lengkap (untuk dijadikan automasi checklist)
Semua titik yang menyentuh transport: lihat tabel §2.5. Saat implement Fase 3, patch di tiap file `.claude/`? No — cukup dokument tabel ini + lint grep `google.script.run` (persis 12 kemunculan) dapat diverifikasi dengan `rg -n "google\\.script\\|run" JS.html`.