/* src/api.js — Backend.* : SATU-SATUNYA jembatan frontend → backend.
 *
 * UI TIDAK boleh memanggil google.script.run / fetch langsung.
 * Seluruh panggilan lewat Backend.* di sini, sehingga transport dapat
 * diubah CUKUP dengan mengganti flag APP_CONFIG.transport (config.js).
 *
 * Kontrak dari setiap method persis = fungsi GAS yang dipanggil di Code.gs.
 */

(function (window) {
  var C = window.APP_CONFIG || { transport: 'gas', apiBase: '/api' };

  // Cache memori pendek (TTL) utk panggilan baca yang sering & IDEMA (mengurangi
  // tekanan ke /exec Apps Script yang lambat/cold-start). Dibersihkan saat aksi tulis.
  var mem = {};                                  // "fn|jsonArgs" -> { ts, data }
  var MEM_TTL = 20000;                            // 20 detik
  var MEM_READ = { getAvailableYears: 1, getDashboardData: 1 };
  var MEM_WRITE = { saveRoute: 1, updateRoute: 1, deleteRoute: 1, saveTerminalDetail: 1, savePotretRows: 1, sinkronisasiProduksi: 1 };
  var delay2 = function (ms) { return new Promise(function (rs) { setTimeout(rs, ms); }); };

  // Inti: kirim panggilan fungsi backend (name) → Promise.
  function rpcCore(name, args) {
    // ---------- mode REST (Cloudflare Pages → Gateway → Apps Script) ----------
    if (C.transport === 'rest') {
      var doFetch = function (attempt) {
        return fetch(C.apiBase + '/' + name, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ fn: name, args: args })
        }).then(function (res) {
          return res.text().then(function (txt) {
            var j = null;
            try { j = JSON.parse(txt); } catch (e) { j = null; }
            if (j !== null && typeof j === 'object') {
              // Error bisnis nyata (mis. Forbidden/path tak dikenal) → jangan retry.
              if (j.ok === false) { var e0 = new Error((j.error) || ('RPC ' + name + ' gagal')); e0.soft = false; throw e0; }
              return j;
            }
            // Bukan JSON (mis. halaman "load"/cold-start Apps Script) → retry.
            var e1 = new Error('Respons tidak valid (HTTP ' + res.status + ').'); e1.soft = true; throw e1;
          });
        }, function (err) { err.soft = true; throw err; })
        .then(function (j) {
          return (j && Object.prototype.hasOwnProperty.call(j, 'data')) ? j.data : j;
        }, function (err) {
          // Retry hanya kegagalan lunak (cold-start / non-JSON / jaringan intermitten).
          if (err && err.soft && attempt < 3) return delay2(500 * (attempt + 1)).then(function () { return doFetch(attempt + 1); });
          throw err;
        });
      };
      return doFetch(0);
    }

    // ---------- mode legacy: google.script.run (halaman Apps Script) ----------
    return new Promise(function (resolve, reject) {
      var run = google.script.run
        .withSuccessHandler(function (r) { resolve(r); })
        .withFailureHandler(function (err) {
          reject((err && typeof err === 'object' && err.message) ? err : new Error(String(err)));
        });
      run[name].apply(run, args);
    });
  }

  // Pembungkus: cache untuk baca, invalidasi untuk tulis.
  function rpc(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    var ck = name + '|' + JSON.stringify(args);
    if (MEM_READ[name]) {
      var hit = mem[ck];
      if (hit && (Date.now() - hit.ts) < MEM_TTL) { return Promise.resolve(hit.data); }
    }
    var p = rpcCore(name, args);
    if (MEM_READ[name]) {
      p = p.then(function (d) { mem[ck] = { ts: Date.now(), data: d }; return d; });
    }
    if (MEM_WRITE[name]) {
      p = p.then(function (res) { mem = {}; return res; });
    }
    return p;
  }

  // --- read: dashboard ---
  function getAvailableYears() { return rpc('getAvailableYears'); }
  function getDashboardData(filter) { return rpc('getDashboardData', filter || {}); }
  function getAllRawData() { return rpc('getAllRawData'); }

  // --- route / trayek ---
  function getRoutes() { return rpc('getRoutes'); }
  function saveRoute(payload) { return rpc('saveRoute', payload); }
  function updateRoute(payload) { return rpc('updateRoute', payload); }
  function deleteRoute(id) { return rpc('deleteRoute', id); }

  // --- terminal profile ---
  function getTerminalDetail(kode) { return rpc('getTerminalDetail', kode); }
  function saveTerminalDetail(payload) { return rpc('saveTerminalDetail', payload); }

  // --- potret angkutan ---
  function getPotretRows(section) { return rpc('getPotretRows', section); }
  function getPotretBarangMeta(tahun) { return rpc('getPotretBarangMeta', tahun); }
  function savePotretRows(section, rows) { return rpc('savePotretRows', section, rows); }

  // --- sinkronisasi (berat / admin) → route terlindungi di Worker ---
  function sinkronisasiProduksi(tahun) { return rpc('sinkronisasiProduksi', tahun); }

  window.Backend = {
    getAvailableYears: getAvailableYears,
    getDashboardData: getDashboardData,
    getAllRawData: getAllRawData,
    getRoutes: getRoutes,
    saveRoute: saveRoute,
    updateRoute: updateRoute,
    deleteRoute: deleteRoute,
    getTerminalDetail: getTerminalDetail,
    saveTerminalDetail: saveTerminalDetail,
    getPotretRows: getPotretRows,
    getPotretBarangMeta: getPotretBarangMeta,
    savePotretRows: savePotretRows,
    sinkronisasiProduksi: sinkronisasiProduksi
  };
})(window);