# Geo12-pages — Frontend Cloudflare Pages (GeoPORTAL BPTD Jabar)

Halaman statik pengganti web app Apps Script. **Backend & database tetap
Google Apps Script + Google Sheets** — folder ini hanya untuk frontend + API gateway.

```
User ──HTTPS──▶ domain.my.id
                 │ Cloudflare DNS (proxy) + TLS
                 ▼
            Cloudflare Pages  (file statik di folder ini: src/)
                 │ fetch('/api/...') same-origin
                 ▼
            Cloudflare Worker (worker/worker.js: CORS + validasi + forward)
                 │ ?path=<fn>&key=<secret>  (secret hanya di sisi Worker)
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
├── worker/
│   └── worker.js       # Cloudflare Worker API gateway (route /api/*)
├── scripts/
│   ├── split-frontend.mjs   # Fase4: ekstrak Geo12 → src/ (aman dijalankan ulang)
│   └── test-rest.mjs        # uji otomatis REST router Fase1
└── docs/
    └── migrasi-cloudflare/MIGRATION_PLAN.md   # master migration plan
```

## Workflow Git (direkomendasikan)

```
main ────────────▶ (production = live Pages)
 └── development ───▶ (preview, PR ke main untuk deploy)
      └── feature/*   (per fase/fitur)
      └── bugfix/*    (perbaikan)
```

- `main` → Cloudflare Pages production (auto-deploy dari GitHub).
- `development` → preview (Cloudflare Pages branch preview).
- Commit kecil, pesan imperatif + konteks: `feat: tambah adapter api.js`, `fix: CORS header di worker`.
- Tiap commit yang menuju main = sudah diuji (lihat checklist di bawah).

## Deploy alur

1. Code di sini di-commit ke GitHub.
2. Cloudflare Pages terhubung ke repo, build output = folder `src/`.
3. Worker di-deploy terpisah (bundle `worker/worker.js`), route `api.<domain>/*` atau `/<domain>/api/*`.
4. Secret (bukan di repo): `GAS_EXEC_URL`, `GAS_SECRET` → diatur di **Cloudflare Worker** env.
5. DNS domain.my.id → Cloudflare, CNAME ke Pages.

## Checklist sebelum deploy (migrasi bertahap)

- [ ] Fase 1 — Apps Script punya doGet/doPost router JSON + guard token
- [ ] Fase 2 — Worker forward `/api/*` → Apps Script, respons JSON benar
- [ ] Fase 3 — `api.js` dengan flag `transport`; 12 panggilan UI memakai `Backend.*`
- [ ] Fase 4 — aset statik split benar (style.css / script.js / index.html)
- [ ] Fase 5 — Pages live, fitur lama tetap jalan (map, marker, chart, CRUD, potret, sync)
- [ ] Fase 6 — domain + TLS + rollback pointer siap

Lihat `docs/migrasi-cloudflare/MIGRATION_PLAN.md` untuk detail per fase, risiko, dan rollback.
