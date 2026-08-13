# Geo12-pages — Frontend Cloudflare Pages (GeoPORTAL BPTD Jabar)

Halaman statik pengganti web app Apps Script. **Backend & database tetap
Google Apps Script + Google Sheets** — folder ini hanya untuk frontend + API gateway.

> **Status gateway (dikukuhkan 2026-08-11):**
> Gateway production resmi = **Cloudflare Pages Functions** (`functions/api/[[path]].js`).
> `worker/worker.js` = **LEGACY / QUARANTINE** — bagian dari desain migrasi awal,
> **tidak** menjadi gateway aktif (tidak dirujuk routing manapun). Lihat §R8.

```
User ──HTTPS──▶ domain.my.id
                 │ Cloudflare DNS (proxy) + TLS
                 ▼
            Cloudflare Pages  (file statik di folder ini: src/)
                 │ fetch('/api/...') same-origin
                 ▼
            Pages Functions  (functions/api/[[path]].js: validasi + forward)
                 │ ?path=<fn>&key=<GAS_SECRET>  (secret hanya sisi server)
                 ▼
            Google Apps Script /exec (doGet/doPost router JSON)
                 ▼
            Google Sheets (database)
```

## Struktur folder

```
Geo12-pages/
├── README.md
├── src/                # → Isi Cloudflare Pages (root "build output")
│   ├── index.html      # hasil split dari Index.html (tanpa include())
│   ├── style.css       # hasil split dari CSS.html
│   ├── script.js       # hasil split dari JS.html + 12 panggilan → Backend.* (Promise)
│   ├── api.js          # Backend.* adapter — satu-satunya jembatan UI → backend
│   └── config.js       # config frontend (transport 'gas'/'rest', apiBase) — TANPA secret
├── functions/          # → Cloudflare Pages Functions (API gateway, jalan utama)
│   └── api/[[path]].js # menangkap /api/<fn> → forward ke Apps Script (env GAS_*)
├── worker/             # → LEGACY / QUARANTINE (tidak aktif; jangan dipakai routing)
│   └── worker.js
├── scripts/
│   ├── split-frontend.mjs   # Fase4: ekstrak Geo12 → src/ (aman dijalankan ulang)
│   └── test-rest.mjs        # uji otomatis REST router Fase1
└── docs/
    └── migrasi-cloudflare/MIGRATION_PLAN.md   # master migration plan
```

## Data architecture (klasifikasi data)

```
LIVE DATA
Google Sheets ──▶ Apps Script /exec ──▶ Pages Functions ──▶ Frontend
  (Terminal, Produksi, Routes, Potret*, PotretBarangMeta, ...)

STATIC DATA
src/data/Jabar_By_Kab.geojson      # choropleth poligon kabupaten (~9,4 MB)
src/data/od-regional.json          # bangkitan/tarikan OD per kab/kota

GENERATED FRONTEND
Geo12/* (Index.html, CSS.html, JS.html)
   └─ scripts/split-frontend.mjs ──▶ src/index.html, src/style.css, src/script.js

CACHE
Apps Script CacheService (chunk 90KB, TTL 300s)
src/api.js memo/cache (TTL 20s untuk getAvailableYears/getDashboardData)
```

- **Jangan ubah isi data.** `src/data/*` tidak di-regenerate dan tidak ditimpa oleh `split-frontend.mjs`.
- **Jangan edit `src/index.html`/`style.css`/`script.js` langsung** — hasil generate dari `Geo12/*` (lihat §Source vs Generated di `.claude/rules/frontend.md`).

## Domain roles

| Peran | URL | Status |
| --- | --- | --- |
| **Official public production domain** | `https://magageoportalbptd1jabar.my.id` | **LIVE, HTTP 200** (verifikasi 2026-08-11) |
| **Cloudflare technical/default hostname** | `https://geoportal-pages.pages.dev` | **LIVE, HTTP 200** (verifikasi 2026-08-11) |

Keduanya melayani **satu deployment Cloudflare Pages yang sama** — bukan dua deployment terpisah. DNS custom domain di-proxy Cloudflare (CNAME → `geoportal-pages.pages.dev`). Tidak ada redirect terpisah yang dibutuhkan (keduanya langsung memuat frontend + `/api/*`).

## Workflow Git (direkomendasikan)

```
main ────────────▶ (production = live Pages)
 └── development ───▶ (preview, PR ke main untuk deploy)
      └── feature/*   (per fase/fitur)
      └── bugfix/*    (perbaikan)
```

- `main` → Cloudflare Pages production (auto-deploy dari GitHub).
- `development` → preview (Cloudflare Pages branch preview).
- Commit kecil, pesan imperatif + konteks: `feat: tambah adapter api.js`, `fix: header secret di gateway functions`.
- Tiap commit yang menuju main = sudah diuji (lihat checklist di bawah).

## Deploy alur (jalur utama: Pages Functions)

1. Code di sini di-commit ke GitHub (git push origin main).
2. Cloudflare Pages terhubung ke repo → **build output = `src/**`** (statik) + **`functions/`** (API gateway).
3. **Environment variables** di Cloudflare Pages (Settings → Environment variables):
   - `GAS_EXEC_URL` = `https://script.google.com/macros/s/<id>/exec`
   - `GAS_SECRET` = nilai ScriptProperty `REST_SECRET` Apps Script
4. Deploy → dapat `https://<project>.pages.dev` → frontend memanggil `/api/*` same-origin → Functions → Apps Script.
5. `src/config.js` ber-`transport:'rest'` (sudah default). Tidak perlu ubah apiBase.
6. DNS domain.my.id → Cloudflare, CNAME ke project.pages.dev (Fase 6).
   - `worker/worker.js` TIDAK dipakai — LEGACY/QUARANTINE (hanya Pages Functions yang aktif).

## Secret management (nama & lokasi saja — TANPA nilai)

| Variabel | Lokasi | Tujuan |
| --- | --- | --- |
| `GAS_EXEC_URL` | Cloudflare Pages environment | URL endpoint Apps Script `/exec` (dibaca gateway `functions/api/[[path]].js`) |
| `GAS_SECRET` | Cloudflare Pages environment | Kunci write yang disisipkan server-side sebagai `?key=` oleh gateway |
| `REST_SECRET` | Apps Script ScriptProperty | Kunci write backend (`cekRESTSecret_`, fail-closed) |

**Sinkronisasi manual:** `GAS_SECRET` ↔ `REST_SECRET` **harus sinkron secara manual** — nilai server-side di kedua lokasi tidak otomatis terhubung (KNOWN ISSUE). Jika keduanya tidak cocok, semua write REST ditolak (`{ok:false,'Forbidden: kunci rahasia tidak valid.'}`).

**Jangan pernah** menulis actual secret / token / password / API key / nilai environment / nilai ScriptProperty di dokumentasi, source, atau commit. Gunakan hanya **nama variabel**. Lihat `.claude/rules/security.md`.

## Checklist sebelum deploy (migrasi bertahap)

- [ ] Fase 1 — Apps Script punya doGet/doPost router JSON + guard token
- [ ] Fase 2 — Pages Functions forward `/api/*` → Apps Script, respons JSON benar
- [ ] Fase 3 — `api.js` dengan flag `transport`; 12 panggilan UI memakai `Backend.*`
- [ ] Fase 4 — aset statik split benar (style.css / script.js / index.html)
- [ ] Fase 5 — Pages live, fitur lama tetap jalan (map, marker, chart, CRUD, potret, sync)
- [ ] Fase 6 — domain + TLS + rollback pointer siap

Lihat `docs/migrasi-cloudflare/MIGRATION_PLAN.md` untuk detail per fase, risiko, dan rollback.
