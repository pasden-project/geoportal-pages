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

  // Kirim panggilan fungsi backend (name) dengan daftar arg (args array).
  function rpc(name) {
    var args = Array.prototype.slice.call(arguments, 1);

    // ---------- mode REST (Cloudflare Pages → Worker → Apps Script) ----------
    if (C.transport === 'rest') {
      var delay = function (ms) { return new Promise(function (rs) { setTimeout(rs, ms); }); };
      var doFetch = function (attempt) {
        return fetch(C.apiBase + '/' + name, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ fn: name, args: args })
        }).then(function (res) {
          return res.text().then(function (txt) {
            var j = null;
            try { j = JSON.parse(txt); } catch (e) { j = null; }
            var adalahJson = (j !== null && typeof j === 'object');
            if (adalahJson) {
              // Kesalahan bisnis yang nyata (mis. Forbidden / path tak dikenal) → jangan retry.
              if (j.ok === false) { var e0 = new Error((j.error) || ('RPC ' + name + ' gagal')); e0.soft = false; throw e0; }
              return j;
            }
            // Bukan JSON (mis. halaman "loading"/error dari Apps Script yang dingin) → retry.
            var e1 = new Error('Respons tidak valid (HTTP ' + res.status + ').'); e1.soft = true; throw e1;
          });
        }, function (err) { err.soft = true; throw err; })
        .then(function (j) {
          // Kontrak sukses = { data } ; error = { ok:false, error } ; atau plain object.
          if (j && Object.prototype.hasOwnProperty.call(j, 'data')) return j.data;
          return j;
        }, function (err) {
          // Retry hanya untuk kegagalan "lunak" (cold-start / non-JSON / jaringan intermitten).
          if (err && err.soft && attempt < 3) return delay(400 * (attempt + 1)).then(function () { return doFetch(attempt + 1); });
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

  // --- read: dashboard ---
  function getAvailableYears() { return rpc('getAvailableYears'); }
  function getDashboardData(filter) { return rpc('getDashboardData', filter || {}); }
  function getAllRawData() { return rpc('getAllRawData'); }

  // --- route / trayek ---
  function getRoutes() { return rpc('getRoutes'); }
  function saveRoute(payload) { return rpc('saveRoute', payload); }
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
    deleteRoute: deleteRoute,
    getTerminalDetail: getTerminalDetail,
    saveTerminalDetail: saveTerminalDetail,
    getPotretRows: getPotretRows,
    getPotretBarangMeta: getPotretBarangMeta,
    savePotretRows: savePotretRows,
    sinkronisasiProduksi: sinkronisasiProduksi
  };
})(window);