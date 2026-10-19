/**
 * BPTD Kelas I Jawa Barat - Health Score Engine
 * Algoritma Deterministik Perhitungan Indeks Kesehatan Operasional Multi-Moda & Simpul
 * 
 * Mengagregasi 4 Kategori Utama Berbobot:
 * 1. Terminal (25%) - SPM, Throughput, Utilisasi Simpul, Sinkronisasi
 * 2. Trayek (20%) - Kesiapan Armada, Realisasi Trip, Load Factor, KPS Aktif
 * 3. Activity & Moda (35%) - AKAP, UPPKB (WIM/ODOL), BRT, Pariwisata, Perintis PSO, AJAP
 * 4. Intelligence & EWS (20%) - Konektivitas OD, Multimoda, Insiden Anomali EWS
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var exp = factory();
    root.BptdHealthScoreEngine = exp;
    root.computeBptdHealthScore = exp.computeBptdHealthScore;
    root.clampScore = exp.clampScore;
    root.safeDivide = exp.safeDivide;
    root.formatIndoDecimal = exp.formatIndoDecimal;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /**
   * Membatasi nilai numerik dalam rentang aman [min, max] dan anti-NaN.
   */
  function clampScore(value, min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 100;
    var num = Number(value);
    if (isNaN(num) || !isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Pembagian aman terhadap pembagi nol, null, undefined, atau NaN.
   */
  function safeDivide(numerator, denominator, fallback) {
    if (fallback === undefined) fallback = 0;
    var num = Number(numerator);
    var den = Number(denominator);
    if (isNaN(num) || isNaN(den) || den === 0 || !isFinite(num) || !isFinite(den)) {
      return fallback;
    }
    return num / den;
  }

  /**
   * Memformat angka dengan notasi koma desimal baku Indonesia.
   * Contoh: 87.216 -> "87,2"
   */
  function formatIndoDecimal(value, decimals) {
    if (decimals === undefined) decimals = 1;
    var num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '');
    }
    return num.toFixed(decimals).replace('.', ',');
  }

  // Baseline Default Terverifikasi BPTD Jawa Barat (2026 / YTD)
  var BASELINE_CONSTANTS = {
    // 1. Terminal (Bobot 25%)
    terminal: {
      kelaikanBusRate: 92.5,
      realisasiRitaseRate: 87.03,
      growthYoY: 8.4,
      targetThroughputRatio: 0.9508,
      top5Ratio: 0.689,
      activeSyncCount: 12,
      totalTerminals: 12,
      baselineT1: 90.04,
      baselineT2: 95.08,
      baselineT3: 76.10,
      baselineT4: 100.00
    },
    // 2. Trayek (Bobot 20%)
    trayek: {
      totalBerizin: 1248,
      aktifBeroperasi: 1248,
      realisasiTripRate: 88.50,
      rerataLoadFactor: 58.00,
      targetLoadFactor: 70.00,
      kepatuhanKpsRate: 90.00,
      baselineR1: 100.00,
      baselineR2: 88.50,
      baselineR3: 82.86,
      baselineR4: 90.00
    },
    // 3. Activity & Moda (Bobot 35%)
    moda: {
      akapEfficiency: 92.00,
      uppkbTaatPct: 91.80,
      uppkbOdolScore: 99.73,
      baselineUppkb: 94.18,
      brtArmadaAktif: 95,
      brtTargetArmada: 95,
      baselineBrt: 100.00,
      pariwisataKir: 94.00,
      pariwisataInspeksi: 1240,
      pariwisataTargetInspeksi: 1240,
      baselinePariwisata: 95.80,
      perintisTrip: 4655,
      perintisTargetTrip: 4800,
      perintisLf: 31.30,
      perintisTargetLf: 50.00,
      baselinePerintis: 79.79,
      ajapArmada: 864,
      ajapTargetArmada: 960,
      baselineAjap: 90.00
    },
    // 4. Intelligence & EWS (Bobot 20%)
    intelligence: {
      kabKotaTercakup: 27,
      totalKabKota: 27,
      balanceOd: 97.30,
      baselineOd: 98.65,
      connectivityScore: 86.00,
      kritisCount: 4,
      waspadaCount: 8,
      atensiCount: 6,
      baselineEws: 38.00
    }
  };

  /**
   * Menghitung skor terpadu BPTD Health Score berbasis 4 pilar utama.
   * 
   * @param {Object} [rawData] - Data mentah opsional dari dashboard
   * @returns {Object} Objek hasil lengkap beserta rincian sub-indikator dan metrik DOM
   */
  function computeBptdHealthScore(rawData) {
    rawData = rawData || {};

    // =========================================================================
    // 1. PILAR TERMINAL (Bobot 25%)
    // =========================================================================
    var tData = rawData.terminal || {};
    var terminalsList = rawData.terminalsList || rawData.terminalPoints || null;

    var t1; // SPM Operasional
    if (terminalsList && Array.isArray(terminalsList) && terminalsList.length > 0) {
      var totalPax = 0;
      var weightedSpmSum = 0;
      for (var i = 0; i < terminalsList.length; i++) {
        var term = terminalsList[i];
        var stats = term.stats || {};
        var pax = Number((stats.keberangkatan_penumpang || 0) + (stats.kedatangan_penumpang || 0));
        if (pax <= 0) pax = 1;
        totalPax += pax;
        
        // Evaluasi SPM simpul individual (Alternatif C jika belum ada skor spesifik)
        var spmItem = term.spmScore;
        if (spmItem === undefined || spmItem === null) {
          var kelaikan = stats.kelaikanBusRate !== undefined ? Number(stats.kelaikanBusRate) : BASELINE_CONSTANTS.terminal.kelaikanBusRate;
          var ritase = stats.realisasiRitaseRate !== undefined ? Number(stats.realisasiRitaseRate) : BASELINE_CONSTANTS.terminal.realisasiRitaseRate;
          spmItem = (0.55 * kelaikan) + (0.45 * ritase);
        }
        weightedSpmSum += (spmItem * pax);
      }
      t1 = safeDivide(weightedSpmSum, totalPax, BASELINE_CONSTANTS.terminal.baselineT1);
    } else if (tData.kelaikanBusRate !== undefined && tData.realisasiRitaseRate !== undefined) {
      t1 = (0.55 * Number(tData.kelaikanBusRate)) + (0.45 * Number(tData.realisasiRitaseRate));
    } else {
      t1 = tData.spmScore !== undefined ? Number(tData.spmScore) : BASELINE_CONSTANTS.terminal.baselineT1;
    }
    t1 = clampScore(t1);

    var t2; // Throughput Terminal
    if (tData.throughputScore !== undefined) {
      t2 = Number(tData.throughputScore);
    } else if (tData.growthYoY !== undefined) {
      t2 = 85 + (Number(tData.growthYoY) * 1.2);
    } else if (tData.targetThroughputRatio !== undefined) {
      t2 = Number(tData.targetThroughputRatio) * 100;
    } else {
      t2 = BASELINE_CONSTANTS.terminal.baselineT2;
    }
    t2 = clampScore(t2);

    var t3; // Utilization Balance
    var rTop5;
    if (terminalsList && Array.isArray(terminalsList) && terminalsList.length > 0) {
      var sortedTerms = terminalsList.slice().sort(function (a, b) {
        var pA = (a.stats ? ((a.stats.keberangkatan_penumpang || 0) + (a.stats.kedatangan_penumpang || 0)) : 0);
        var pB = (b.stats ? ((b.stats.keberangkatan_penumpang || 0) + (b.stats.kedatangan_penumpang || 0)) : 0);
        return pB - pA;
      });
      var allPax = 0;
      var top5Pax = 0;
      for (var k = 0; k < sortedTerms.length; k++) {
        var pCount = sortedTerms[k].stats ? ((sortedTerms[k].stats.keberangkatan_penumpang || 0) + (sortedTerms[k].stats.kedatangan_penumpang || 0)) : 0;
        allPax += pCount;
        if (k < 5) top5Pax += pCount;
      }
      rTop5 = safeDivide(top5Pax, allPax, BASELINE_CONSTANTS.terminal.top5Ratio);
    } else if (tData.top5Ratio !== undefined) {
      rTop5 = Number(tData.top5Ratio);
    } else {
      rTop5 = BASELINE_CONSTANTS.terminal.top5Ratio;
    }
    t3 = clampScore(100 - Math.max(0, (rTop5 * 100) - 45));

    var t4; // Sinkronisasi Data
    var syncCount = tData.activeSyncCount !== undefined ? Number(tData.activeSyncCount) : (terminalsList ? terminalsList.length : BASELINE_CONSTANTS.terminal.activeSyncCount);
    var totalTermCount = tData.totalTerminals !== undefined ? Number(tData.totalTerminals) : BASELINE_CONSTANTS.terminal.totalTerminals;
    t4 = clampScore(safeDivide(syncCount, totalTermCount, 1) * 100);

    // Skor Pilar Terminal (25%)
    var scoreTerminal = clampScore(
      (0.40 * t1) + (0.25 * t2) + (0.20 * t3) + (0.15 * t4)
    );

    // =========================================================================
    // 2. PILAR TRAYEK (Bobot 20%)
    // =========================================================================
    var yData = rawData.trayek || {};
    var r1 = clampScore(
      yData.aktifBeroperasi !== undefined && yData.totalBerizin !== undefined
        ? safeDivide(Number(yData.aktifBeroperasi), Number(yData.totalBerizin), 1) * 100
        : BASELINE_CONSTANTS.trayek.baselineR1
    );

    var r2 = clampScore(
      yData.realisasiTripRate !== undefined ? Number(yData.realisasiTripRate) : BASELINE_CONSTANTS.trayek.baselineR2
    );

    var r3;
    if (yData.loadFactorScore !== undefined) {
      r3 = Number(yData.loadFactorScore);
    } else {
      var lf = yData.rerataLoadFactor !== undefined ? Number(yData.rerataLoadFactor) : BASELINE_CONSTANTS.trayek.rerataLoadFactor;
      var targetLf = yData.targetLoadFactor !== undefined ? Number(yData.targetLoadFactor) : BASELINE_CONSTANTS.trayek.targetLoadFactor;
      r3 = safeDivide(lf, targetLf, 0.8286) * 100;
    }
    r3 = clampScore(r3);

    var r4 = clampScore(
      yData.kepatuhanKpsRate !== undefined ? Number(yData.kepatuhanKpsRate) : BASELINE_CONSTANTS.trayek.baselineR4
    );

    // Skor Pilar Trayek (20%)
    var scoreTrayek = clampScore(
      (0.35 * r1) + (0.30 * r2) + (0.20 * r3) + (0.15 * r4)
    );

    // =========================================================================
    // 3. PILAR ACTIVITY & MODA (Bobot 35%)
    // =========================================================================
    var mData = rawData.moda || {};

    var mAkap = clampScore(
      mData.akapEfficiency !== undefined ? Number(mData.akapEfficiency) : BASELINE_CONSTANTS.moda.akapEfficiency
    );

    var mUppkb;
    if (mData.uppkbScore !== undefined) {
      mUppkb = Number(mData.uppkbScore);
    } else {
      var taat = mData.uppkbTaatPct !== undefined ? Number(mData.uppkbTaatPct) : BASELINE_CONSTANTS.moda.uppkbTaatPct;
      var odolScore = mData.uppkbOdolScore !== undefined ? Number(mData.uppkbOdolScore) : BASELINE_CONSTANTS.moda.uppkbOdolScore;
      mUppkb = (0.70 * taat) + (0.30 * odolScore);
    }
    mUppkb = clampScore(mUppkb);

    var mBrt;
    if (mData.brtScore !== undefined) {
      mBrt = Number(mData.brtScore);
    } else {
      var brtAktif = mData.brtArmadaAktif !== undefined ? Number(mData.brtArmadaAktif) : BASELINE_CONSTANTS.moda.brtArmadaAktif;
      var brtTarget = mData.brtTargetArmada !== undefined ? Number(mData.brtTargetArmada) : BASELINE_CONSTANTS.moda.brtTargetArmada;
      mBrt = safeDivide(brtAktif, brtTarget, 1) * 100;
    }
    mBrt = clampScore(mBrt);

    var mPariwisata;
    if (mData.pariwisataScore !== undefined) {
      mPariwisata = Number(mData.pariwisataScore);
    } else {
      var kir = mData.pariwisataKir !== undefined ? Number(mData.pariwisataKir) : BASELINE_CONSTANTS.moda.pariwisataKir;
      var insp = mData.pariwisataInspeksi !== undefined ? Number(mData.pariwisataInspeksi) : BASELINE_CONSTANTS.moda.pariwisataInspeksi;
      var targetInsp = mData.pariwisataTargetInspeksi !== undefined ? Number(mData.pariwisataTargetInspeksi) : BASELINE_CONSTANTS.moda.pariwisataTargetInspeksi;
      mPariwisata = (0.70 * kir) + (0.30 * safeDivide(insp, targetInsp, 1) * 100);
    }
    mPariwisata = clampScore(mPariwisata);

    var mPerintis;
    if (mData.perintisScore !== undefined) {
      mPerintis = Number(mData.perintisScore);
    } else {
      var pTrip = mData.perintisTrip !== undefined ? Number(mData.perintisTrip) : BASELINE_CONSTANTS.moda.perintisTrip;
      var pTargetTrip = mData.perintisTargetTrip !== undefined ? Number(mData.perintisTargetTrip) : BASELINE_CONSTANTS.moda.perintisTargetTrip;
      var pLf = mData.perintisLf !== undefined ? Number(mData.perintisLf) : BASELINE_CONSTANTS.moda.perintisLf;
      var pTargetLf = mData.perintisTargetLf !== undefined ? Number(mData.perintisTargetLf) : BASELINE_CONSTANTS.moda.perintisTargetLf;
      mPerintis = (0.50 * safeDivide(pTrip, pTargetTrip, 1) * 100) + (0.50 * safeDivide(pLf, pTargetLf, 1) * 100);
    }
    mPerintis = clampScore(mPerintis);

    var mAjap;
    if (mData.ajapScore !== undefined) {
      mAjap = Number(mData.ajapScore);
    } else {
      var ajapArmada = mData.ajapArmada !== undefined ? Number(mData.ajapArmada) : BASELINE_CONSTANTS.moda.ajapArmada;
      var ajapTarget = mData.ajapTargetArmada !== undefined ? Number(mData.ajapTargetArmada) : BASELINE_CONSTANTS.moda.ajapTargetArmada;
      mAjap = safeDivide(ajapArmada, ajapTarget, 1) * 100;
    }
    mAjap = clampScore(mAjap);

    // Skor Pilar Activity & Moda (35%)
    var scoreActivityModa = clampScore(
      (0.25 * mAkap) +
      (0.20 * mUppkb) +
      (0.15 * mBrt) +
      (0.15 * mPariwisata) +
      (0.15 * mPerintis) +
      (0.10 * mAjap)
    );

    // =========================================================================
    // 4. PILAR INTELLIGENCE & EWS (Bobot 20%)
    // =========================================================================
    var iData = rawData.intelligence || {};
    var ewsData = rawData.ews || rawData.earlyWarning || {};

    var iOd;
    if (iData.odScore !== undefined) {
      iOd = Number(iData.odScore);
    } else {
      var kabKota = iData.kabKotaTercakup !== undefined ? Number(iData.kabKotaTercakup) : BASELINE_CONSTANTS.intelligence.kabKotaTercakup;
      var totalKab = iData.totalKabKota !== undefined ? Number(iData.totalKabKota) : BASELINE_CONSTANTS.intelligence.totalKabKota;
      var balOd = iData.balanceOd !== undefined ? Number(iData.balanceOd) : BASELINE_CONSTANTS.intelligence.balanceOd;
      iOd = (0.50 * safeDivide(kabKota, totalKab, 1) * 100) + (0.50 * balOd);
    }
    iOd = clampScore(iOd);

    var iConn = clampScore(
      iData.connectivityScore !== undefined ? Number(iData.connectivityScore) : BASELINE_CONSTANTS.intelligence.connectivityScore
    );

    var iEws;
    if (ewsData.ewsScore !== undefined) {
      iEws = Number(ewsData.ewsScore);
    } else {
      var nKritis = ewsData.critical_count !== undefined ? Number(ewsData.critical_count) : (ewsData.kritisCount !== undefined ? Number(ewsData.kritisCount) : BASELINE_CONSTANTS.intelligence.kritisCount);
      var nWaspada = ewsData.warning_count !== undefined ? Number(ewsData.warning_count) : (ewsData.waspadaCount !== undefined ? Number(ewsData.waspadaCount) : BASELINE_CONSTANTS.intelligence.waspadaCount);
      var nAtensi = ewsData.advisory_count !== undefined ? Number(ewsData.advisory_count) : (ewsData.atensiCount !== undefined ? Number(ewsData.atensiCount) : BASELINE_CONSTANTS.intelligence.atensiCount);
      var penalty = (8 * nKritis) + (3 * nWaspada) + (1 * nAtensi);
      iEws = 100 - penalty;
    }
    iEws = clampScore(iEws);

    // Skor Pilar Intelligence (20%)
    var scoreIntelligence = clampScore(
      (0.30 * iOd) + (0.30 * iConn) + (0.40 * iEws)
    );

    // =========================================================================
    // 5. TOTAL HEALTH SCORE AGREGAT & STATUS
    // =========================================================================
    var totalHealthScore = clampScore(
      (0.25 * scoreTerminal) +
      (0.20 * scoreTrayek) +
      (0.35 * scoreActivityModa) +
      (0.20 * scoreIntelligence)
    );

    // Status predikat dan warna
    var statusPredicate = 'Sangat Baik';
    var statusColor = '#10b981'; // Green
    var statusBadgeClass = 'delta--up';

    if (totalHealthScore < 60) {
      statusPredicate = 'Kritis / Penanganan Khusus';
      statusColor = '#ef4444'; // Red
      statusBadgeClass = 'delta--down';
    } else if (totalHealthScore < 75) {
      statusPredicate = 'Perhatian / Waspada';
      statusColor = '#f59e0b'; // Amber
      statusBadgeClass = 'delta--warn';
    } else if (totalHealthScore < 90) {
      statusPredicate = 'Baik / Terkendali';
      statusColor = '#10b981'; // Green / Emerald
      statusBadgeClass = 'delta--up';
    } else {
      statusPredicate = 'Sangat Baik';
      statusColor = '#06b6d4'; // Cyan
      statusBadgeClass = 'delta--up';
    }

    // SVG semi-circle gauge offset (radius = 80, keliling busur = PI * 80 ≈ 251.36)
    var gaugeCircumference = 251.36;
    var roundedScoreForArc = Math.round(totalHealthScore);
    var strokeDashoffset = Math.round(gaugeCircumference * (1 - (roundedScoreForArc / 100)));

    return {
      total: totalHealthScore,
      roundedScore: roundedScoreForArc,
      displayScore: formatIndoDecimal(totalHealthScore, 1),
      predicate: statusPredicate,
      statusColor: statusColor,
      statusBadgeClass: statusBadgeClass,
      gauge: {
        value: roundedScoreForArc,
        display: roundedScoreForArc + '%',
        dasharray: gaugeCircumference,
        dashoffset: strokeDashoffset
      },
      categories: {
        terminal: {
          key: 'terminal',
          name: 'Terminal',
          weight: 0.25,
          score: scoreTerminal,
          displayPct: formatIndoDecimal(scoreTerminal, 1) + '%',
          detailLabel: formatIndoDecimal(scoreTerminal, 1) + '% (SPM Ops ' + formatIndoDecimal(t1, 1) + '% · 12 Simpul)',
          barWidth: scoreTerminal.toFixed(1) + '%',
          subMetrics: { t1: t1, t2: t2, t3: t3, t4: t4 }
        },
        trayek: {
          key: 'trayek',
          name: 'Trayek',
          weight: 0.20,
          score: scoreTrayek,
          displayPct: formatIndoDecimal(scoreTrayek, 1) + '%',
          detailLabel: formatIndoDecimal(scoreTrayek, 1) + '% (1.248 Trayek Aktif)',
          barWidth: scoreTrayek.toFixed(1) + '%',
          subMetrics: { r1: r1, r2: r2, r3: r3, r4: r4 }
        },
        moda: {
          key: 'moda',
          name: 'Activity Moda',
          weight: 0.35,
          score: scoreActivityModa,
          displayPct: formatIndoDecimal(scoreActivityModa, 1) + '%',
          detailLabel: formatIndoDecimal(scoreActivityModa, 1) + '% (WIM 91,8% · KIR 94,0%)',
          barWidth: scoreActivityModa.toFixed(1) + '%',
          subMetrics: { mAkap: mAkap, mUppkb: mUppkb, mBrt: mBrt, mPariwisata: mPariwisata, mPerintis: mPerintis, mAjap: mAjap }
        },
        intelligence: {
          key: 'intelligence',
          name: 'Intelligence',
          weight: 0.20,
          score: scoreIntelligence,
          displayPct: formatIndoDecimal(scoreIntelligence, 1) + '%',
          detailLabel: formatIndoDecimal(scoreIntelligence, 1) + '% (OD 27 Kab · EWS 4 Kritis)',
          barWidth: scoreIntelligence.toFixed(1) + '%',
          subMetrics: { iOd: iOd, iConn: iConn, iEws: iEws }
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  return {
    clampScore: clampScore,
    safeDivide: safeDivide,
    formatIndoDecimal: formatIndoDecimal,
    computeBptdHealthScore: computeBptdHealthScore,
    BASELINE_CONSTANTS: BASELINE_CONSTANTS
  };
});
