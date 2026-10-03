/* =====================================================================
   GeoPORTAL BPTD Jabar — Modul Program & Kinerja Transportasi (program.js)
   Sistem Monitoring Program Strategis, Output Fisik, Realisasi Pagu & KPI
   ===================================================================== */

/**
 * Embedded official dataset fallback (BPTD Kelas I Jawa Barat 2026)
 * 6 Program Strategis Perhubungan Darat Jawa Barat
 * dengan Pagu Rp 33,3 Miliar, Serapan Keuangan 91,4%, dan Progres Fisik 93,6%.
 */
var PROGRAM_EMBEDDED_DATA = {
  "title": "Sistem Monitoring Program & Kinerja Transportasi Jawa Barat 2026",
  "instansi": "BPTD Kelas I Jawa Barat - Kementerian Perhubungan Republik Indonesia",
  "tahun_anggaran": "2025 / 2026 (Konsolidasi Tahun Anggaran Berjalan)",
  "terakhir_diperbarui": "2026-03-31T00:00:00.000Z",
  "summary": {
    "tahun_anggaran": "2025 / 2026",
    "total_program_strategis": 6,
    "total_pagu_anggaran": 33302509274,
    "total_pagu_anggaran_formatted": "Rp 33.302.509.274",
    "total_realisasi_keuangan": 30439261419,
    "total_realisasi_keuangan_formatted": "Rp 30.439.261.419",
    "persentase_realisasi_keuangan": 91.4,
    "rata_rata_progres_fisik": 93.6,
    "status_kinerja_agregat": "SANGAT BAIK (ON TRACK)",
    "sebaran_bidang": {
      "angkutan_jalan": 2,
      "lalu_lintas_jalan": 2,
      "sarana_prasarana": 2
    },
    "bidang_list": [
      {
        "id": "ANGKUTAN",
        "label": "Angkutan Jalan",
        "count": 2,
        "color": "#3b82f6",
        "pagu": 6352509274,
        "realisasi": 5339261419,
        "persentase_keuangan": 84.1,
        "progres_fisik": 90.9
      },
      {
        "id": "LALIN",
        "label": "Lalu Lintas Jalan",
        "count": 2,
        "color": "#f59e0b",
        "pagu": 18700000000,
        "realisasi": 17690000000,
        "persentase_keuangan": 94.6,
        "progres_fisik": 95.5
      },
      {
        "id": "SARPRAS",
        "label": "Sarana & Prasarana",
        "count": 2,
        "color": "#10b981",
        "pagu": 8250000000,
        "realisasi": 7400000000,
        "persentase_keuangan": 89.7,
        "progres_fisik": 97.8
      }
    ]
  },
  "programs": [
    {
      "id": "PRG-01",
      "kode_bidang": "ANGKUTAN",
      "bidang": "Angkutan Jalan",
      "nama": "Penyelenggaraan Pelayanan Angkutan Jalan Perintis Bersubsidi (PSO)",
      "deskripsi": "Penyediaan layanan angkutan umum penumpang bersubsidi Public Service Obligation (PSO) di wilayah tertinggal, terpencil, terluar, dan perbatasan (3TP) Jawa Barat guna menjamin keterjangkauan tarif dan konektivitas antardaerah.",
      "pagu_anggaran": 4752509274,
      "pagu_anggaran_formatted": "Rp 4.752.509.274",
      "realisasi_keuangan": 3889261419,
      "realisasi_keuangan_formatted": "Rp 3.889.261.419",
      "persentase_keuangan": 81.8,
      "target_fisik": "5.688 Ritase Perintis (6 trayek, 18 bus DAMRI 19 seat)",
      "realisasi_fisik": "4.655 Ritase (81,8%, 26.815 penumpang terlayani)",
      "persentase_fisik": 81.8,
      "kpi_utama": "Rasio Keterisian Penumpang (Load Factor Rata-rata 31,3% vs target 30,0%)",
      "capaian_kpi": "31,3% (Target 30,0%)",
      "status_kpi": "Tercapai (+1,3%)",
      "status": "On Track",
      "status_badge": "success",
      "lat": -7.2800,
      "lng": 106.7200,
      "lokasi_fokus": "Kab. Sukabumi (Sagaranten, Cikidang), Kab. Bogor (Jasinga), Kab. Purwakarta",
      "sub_kegiatan": [
        {
          "nama": "Pengadaan & penyaluran subsidi operasional 6 trayek angkutan perintis DAMRI",
          "target": "5.688 ritase perintis",
          "realisasi": "4.655 ritase terlaksana",
          "progres": 81.8
        },
        {
          "nama": "Pengawasan berkala Standar Pelayanan Minimal (SPM) 18 armada perintis 19 seat",
          "target": "12 kali inspeksi lapangan",
          "realisasi": "11 kali inspeksi selesai",
          "progres": 91.7
        },
        {
          "nama": "Audit verifikasi faktual tiket penumpang dan kepatuhan jadwal pemberangkatan",
          "target": "4 laporan triwulan",
          "realisasi": "3 laporan selesai & terverifikasi",
          "progres": 75.0
        }
      ],
      "catatan_evaluasi": "Realisasi ritase dan serapan subsidi PSO berjalan tertib sesuai kalender operasional semester berjalan. Keterisian penumpang stabil dengan trayek terpadat Sagaranten - Tegalbuleud."
    },
    {
      "id": "PRG-02",
      "kode_bidang": "LALIN",
      "bidang": "Lalu Lintas Jalan",
      "nama": "Pengawasan, Pengendalian & Penegakan Hukum Muatan Lebih (Zero ODOL UPPKB)",
      "deskripsi": "Pengoperasian dan penegakan hukum pembatasan dimensi dan muatan lebih (Over Dimension Over Loading / ODOL) pada 6 Unit Pelaksana Penimbangan Kendaraan Bermotor (UPPKB) strategis Jawa Barat.",
      "pagu_anggaran": 3100000000,
      "pagu_anggaran_formatted": "Rp 3.100.000.000",
      "realisasi_keuangan": 2840000000,
      "realisasi_keuangan_formatted": "Rp 2.840.000.000",
      "persentase_keuangan": 91.6,
      "target_fisik": "200.000 Kendaraan Barang Tertimbang",
      "realisasi_fisik": "194.392 Kendaraan (97,2% tertimbang akurat)",
      "persentase_fisik": 97.2,
      "kpi_utama": "Tingkat Kepatuhan Tonase Kendaraan Barang (91,8% vs target nasional 90,0%)",
      "capaian_kpi": "91,8% Kepatuhan (Target 90,0%)",
      "status_kpi": "Tercapai (+1,8%)",
      "status": "On Track",
      "status_badge": "success",
      "lat": -6.37733,
      "lng": 107.51488,
      "lokasi_fokus": "6 UPPKB (JT001 Balonggandu, JT002 Losarang, JT003 Gentong, JT004 Cibaragalan, JT005 Tomo, JT006 Kemang)",
      "sub_kegiatan": [
        {
          "nama": "Operasi penindakan terpadu muatan lebih gabungan Korlantas Polri & POM TNI",
          "target": "48 kali operasi gabungan",
          "realisasi": "46 kali operasi terlaksana",
          "progres": 95.8
        },
        {
          "nama": "Kalibrasi dan pemeliharaan rutin sensor timbang Weigh-in-Motion (WIM)",
          "target": "6 unit timbangan terkalibrasi",
          "realisasi": "6 unit terkalibrasi metrologi",
          "progres": 100.0
        },
        {
          "nama": "Fasilitasi transfer muatan over-tonase dan tilang elektronik terintegrasi ETLE",
          "target": "100% pelanggar ditindak",
          "realisasi": "15.939 tilang diterbitkan",
          "progres": 96.0
        }
      ],
      "catatan_evaluasi": "Kepatuhan tonase meningkat signifikan dari 86,4% menjadi 91,8%. Penindakan tegas di koridor Pantura (Balonggandu & Losarang) efektif menurunkan tingkat kerusakan struktur jalan nasional."
    },
    {
      "id": "PRG-03",
      "kode_bidang": "SARPRAS",
      "bidang": "Sarana & Prasarana",
      "nama": "Peningkatan Standar Pelayanan Minimal (SPM) & Pemeliharaan 12 Terminal Tipe A",
      "deskripsi": "Penyediaan prasarana terminal penumpang tipe A yang aman, nyaman, inklusif, dan tertib melalui pemeliharaan gedung operasional, pemenuhan SPM Kementerian Perhubungan, dan integrasi digital terminal.",
      "pagu_anggaran": 7200000000,
      "pagu_anggaran_formatted": "Rp 7.200.000.000",
      "realisasi_keuangan": 6420000000,
      "realisasi_keuangan_formatted": "Rp 6.420.000.000",
      "persentase_keuangan": 89.2,
      "target_fisik": "12 Terminal Tipe A Standar SPM Sangat Baik",
      "realisasi_fisik": "12 Terminal Terakreditasi SPM (Skor SPM Rerata 87,4/100)",
      "persentase_fisik": 100.0,
      "kpi_utama": "Rasio Terminal Tipe A Terakreditasi SPM Sangat Baik (100% pemenuhan)",
      "capaian_kpi": "100% (Skor Rerata 87,4/100)",
      "status_kpi": "Tercapai (Optimal)",
      "status": "On Track",
      "status_badge": "success",
      "lat": -6.9472,
      "lng": 107.5936,
      "lokasi_fokus": "12 Simpul Terminal Tipe A Jawa Barat (Leuwipanjang, Baranangsiang, Harjamukti, Ciakar, Indihiang, dll)",
      "sub_kegiatan": [
        {
          "nama": "Revitalisasi fasilitas inklusif: toilet disabilitas, ruang laktasi, dan guiding block",
          "target": "12 terminal tuntas",
          "realisasi": "12 terminal selesai",
          "progres": 100.0
        },
        {
          "nama": "Peningkatan gateway digital data produksi terminal SIMETRIS terpusat Hubdat",
          "target": "12 gateway online real-time",
          "realisasi": "12 gateway aktif 99,8% uptime",
          "progres": 100.0
        },
        {
          "nama": "Pemeliharaan gedung terminal, sistem proteksi kebakaran, dan sanitasi higienis",
          "target": "12 paket pemeliharaan",
          "realisasi": "11 paket rampung 100%, 1 finishing",
          "progres": 96.0
        }
      ],
      "catatan_evaluasi": "Seluruh 12 Terminal Tipe A di Jawa Barat mempertahankan status SPM terakreditasi kategori A/B. Kepuasan penumpang atas fasilitas kebersihan dan kenyamanan ruang tunggu mencapai indeks 88,2%."
    },
    {
      "id": "PRG-04",
      "kode_bidang": "LALIN",
      "bidang": "Lalu Lintas Jalan",
      "nama": "Pemasangan & Pemeliharaan Fasilitas Perlengkapan Jalan Koridor Arteri Nasional",
      "deskripsi": "Penyelenggaraan keselamatan lalu lintas jalan nasional melalui pemasangan guardrail baja pengaman tebing, rambu petunjuk pendahulu jurusan (RPPJ), warning light bertenaga surya, dan marka jalan reflektif.",
      "pagu_anggaran": 15600000000,
      "pagu_anggaran_formatted": "Rp 15.600.000.000",
      "realisasi_keuangan": 14850000000,
      "realisasi_keuangan_formatted": "Rp 14.850.000.000",
      "persentase_keuangan": 95.2,
      "target_fisik": "15.000 m Guardrail, 1.200 Rambu RPPJ, 80 Warning Light, 120.000 m Marka",
      "realisasi_fisik": "Rata-rata 93,8% terpasang di koridor prioritas rawan kecelakaan",
      "persentase_fisik": 93.8,
      "kpi_utama": "Rasio Koridor Arteri Rawan Kecelakaan Terlengkapi Fasilitas Keselamatan (94,5%)",
      "capaian_kpi": "94,5% Terlengkapi (Target 90,0%)",
      "status_kpi": "Tercapai (+4,5%)",
      "status": "On Track",
      "status_badge": "success",
      "lat": -7.11956,
      "lng": 108.13575,
      "lokasi_fokus": "Jalur Pantura (Karawang-Cirebon), Jalur Tengah (Sumedang-Majalengka), Jalur Selatan (Gentong-Tasik), Akses Patimban",
      "sub_kegiatan": [
        {
          "nama": "Pemasangan guardrail baja galvanis di tikungan tajam dan jurang lintas Gentong & Nagreg",
          "target": "15.000 meter lari",
          "realisasi": "14.250 meter lari",
          "progres": 95.0
        },
        {
          "nama": "Peremajaan dan aplikasi marka jalan termoplastik reflektif standar ASTM",
          "target": "120.000 meter",
          "realisasi": "112.800 meter",
          "progres": 94.0
        },
        {
          "nama": "Pemasangan flashing warning light solar cell & rambu RPPJ pada persimpangan blindspot",
          "target": "80 warning light & 1.200 rambu",
          "realisasi": "76 warning light & 1.110 rambu",
          "progres": 92.5
        }
      ],
      "catatan_evaluasi": "Pemasangan perlengkapan jalan pada titik blackspot berkontribusi langsung pada penurunan tingkat fatalitas kecelakaan sebesar 23,4% di kawasan tanjakan Gentong dan Cadas Pangeran."
    },
    {
      "id": "PRG-05",
      "kode_bidang": "SARPRAS",
      "bidang": "Sarana & Prasarana",
      "nama": "Inspeksi Keselamatan Teknis & Kelaikan Jalan (Ramp Check) Terpadu Angkutan Jalan",
      "deskripsi": "Pelaksanaan audit keselamatan fisik dan teknis armada bus AKAP, AKDP, dan Bus Pariwisata di pool PO, terminal, dan destinasi wisata guna memitigasi risiko kecelakaan fatal angkutan massal.",
      "pagu_anggaran": 1050000000,
      "pagu_anggaran_formatted": "Rp 1.050.000.000",
      "realisasi_keuangan": 980000000,
      "realisasi_keuangan_formatted": "Rp 980.000.000",
      "persentase_keuangan": 93.3,
      "target_fisik": "12.500 Armada Bus Diperiksa",
      "realisasi_fisik": "11.940 Armada Diperiksa (95,5%; 10.420 laik jalan / 87,3%)",
      "persentase_fisik": 95.5,
      "kpi_utama": "Persentase Armada Angkutan Penumpang Memenuhi Syarat Kelaikan Jalan (87,3%)",
      "capaian_kpi": "87,3% Laik Jalan (Target 85,0%)",
      "status_kpi": "Tercapai (+2,3%)",
      "status": "On Track",
      "status_badge": "success",
      "lat": -6.8000,
      "lng": 107.6000,
      "lokasi_fokus": "Pool Bus PO AKAP, Terminal Penumpang, Kawasan Wisata Puncak, Lembang, Ciater",
      "sub_kegiatan": [
        {
          "nama": "Uji fungsi rem, sistem kemudi, ketebalan ban, dan sistem kelistrikan bus",
          "target": "12.500 unit armada",
          "realisasi": "11.940 unit armada",
          "progres": 95.5
        },
        {
          "nama": "Verifikasi legalitas kartu izin pengawasan (KPS), uji berkala (KIR), dan SIM pengemudi",
          "target": "12.500 berkas armada",
          "realisasi": "11.940 berkas armada",
          "progres": 95.5
        },
        {
          "nama": "Pemberian stiker resmi inspeksi keselamatan Ditjen Hubdat & penilangan armada tidak laik",
          "target": "100% armada berstiker/sanksi",
          "realisasi": "10.420 stiker lulus, 1.520 dilarang operasi",
          "progres": 100.0
        }
      ],
      "catatan_evaluasi": "Pemeriksaan intensif pada masa libur Nataru dan Lebaran berhasil mendeteksi dini 1.520 armada bermasalah sistem pengereman sehingga berhasil dicegah melayani rute pegunungan."
    },
    {
      "id": "PRG-06",
      "kode_bidang": "ANGKUTAN",
      "bidang": "Angkutan Jalan",
      "nama": "Pengembangan Integrasi Konektivitas Antarmoda & Hub Multimoda Strategis",
      "deskripsi": "Penguatan sinergi konektivitas fisik, jadwal, dan informasi tarif antar moda transportasi jalan, kereta cepat Whoosh, kereta konvensional KAI, bandara Kertajati, dan pelabuhan internasional Patimban.",
      "pagu_anggaran": 1600000000,
      "pagu_anggaran_formatted": "Rp 1.600.000.000",
      "realisasi_keuangan": 1450000000,
      "realisasi_keuangan_formatted": "Rp 1.450.000.000",
      "persentase_keuangan": 90.6,
      "target_fisik": "14 Koridor Transfer Antarmoda Terintegrasi",
      "realisasi_fisik": "14 Koridor Aktif Terkoordinasi (100% konektivitas terlaksana)",
      "persentase_fisik": 100.0,
      "kpi_utama": "Indeks Aksesibilitas Multimoda Jawa Barat (Rerata 79,4/100 di 27 Kab/Kota)",
      "capaian_kpi": "79,4 / 100 (Target 75,0)",
      "status_kpi": "Tercapai (+4,4 poin)",
      "status": "On Track",
      "status_badge": "success",
      "lat": -6.8415,
      "lng": 107.4802,
      "lokasi_fokus": "Padalarang Whoosh Hub, Tegalluar, Patimban Sea-Land, Kertajati Aero-Intermodal",
      "sub_kegiatan": [
        {
          "nama": "Penyusunan sinkronisasi masterplan integrasi hub Whoosh - KAI Feeder - DAMRI",
          "target": "1 dokumen masterplan final",
          "realisasi": "1 dokumen selesai & disahkan",
          "progres": 100.0
        },
        {
          "nama": "Rekayasa sirkulasi feeder antarmoda, halte integrasi, dan drop-off zone teratur",
          "target": "14 titik koridor transfer",
          "realisasi": "14 titik aktif tertata",
          "progres": 100.0
        },
        {
          "nama": "Penyelarasan headway waktu tunggu transfer penumpang di bawah 15 menit",
          "target": "Rata-rata transfer < 15 menit",
          "realisasi": "Capaian rata-rata 11,8 menit",
          "progres": 98.0
        }
      ],
      "catatan_evaluasi": "Sinergi layanan bus pengumpan terintegrasi Stasiun Kereta Cepat Padalarang dan Tegalluar mencapai ketepatan headway 94,2%, dengan tingkat kepuasan penumpang antarmoda di atas 89%."
    }
  ],
  "kpi_strategic_registry": [
    {
      "id": "KPI-01",
      "indikator": "Rasio Keterisian Penumpang Angkutan Perintis (Load Factor)",
      "bidang": "Angkutan Jalan",
      "program_terkait": "PRG-01",
      "satuan": "Persen (%)",
      "formula": "(Jumlah Penumpang Terangkut / Total Kapasitas Kursi Tersedia) x 100%",
      "target_kemenhub": 30.0,
      "target_formatted": "30,0%",
      "realisasi_kinerja": 31.3,
      "realisasi_formatted": "31,3%",
      "deviasi": "+1,3%",
      "status": "Tercapai (Optimal)",
      "status_badge": "success",
      "dasar_hukum": "Keputusan Direktur Jenderal Perhubungan Darat tentang Jaringan Trayek Angkutan Jalan Perintis"
    },
    {
      "id": "KPI-02",
      "indikator": "Tingkat Kepatuhan Tonase Kendaraan Barang di UPPKB",
      "bidang": "Lalu Lintas Jalan",
      "program_terkait": "PRG-02",
      "satuan": "Persen (%)",
      "formula": "(Jumlah Kendaraan Barang Taat Tonase / Total Kendaraan Tertimbang) x 100%",
      "target_kemenhub": 90.0,
      "target_formatted": "90,0%",
      "realisasi_kinerja": 91.8,
      "realisasi_formatted": "91,8%",
      "deviasi": "+1,8%",
      "status": "Tercapai (Optimal)",
      "status_badge": "success",
      "dasar_hukum": "UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan & Permenhub No. PM 74 Tahun 2021"
    },
    {
      "id": "KPI-03",
      "indikator": "Persentase Terminal Tipe A Memenuhi Standar Pelayanan Minimal (SPM)",
      "bidang": "Sarana & Prasarana",
      "program_terkait": "PRG-03",
      "satuan": "Persen (%)",
      "formula": "(Jumlah Terminal Tipe A Lolos SPM / Total Terminal Tipe A Dikelola) x 100%",
      "target_kemenhub": 100.0,
      "target_formatted": "100,0%",
      "realisasi_kinerja": 100.0,
      "realisasi_formatted": "100,0% (Skor 87,4/100)",
      "deviasi": "0,0% (Optimal)",
      "status": "Tercapai (Optimal)",
      "status_badge": "success",
      "dasar_hukum": "Peraturan Menteri Perhubungan No. PM 40 Tahun 2015 tentang SPM Terminal Penumpang Angkutan Jalan"
    },
    {
      "id": "KPI-04",
      "indikator": "Persentase Titik Blackspot Koridor Nasional Terpasang Fasilitas Keselamatan",
      "bidang": "Lalu Lintas Jalan",
      "program_terkait": "PRG-04",
      "satuan": "Persen (%)",
      "formula": "(Lokasi Rawan Kecelakaan Terpasang Perlengkapan / Total Lokasi Rawan Teridentifikasi) x 100%",
      "target_kemenhub": 90.0,
      "target_formatted": "90,0%",
      "realisasi_kinerja": 94.5,
      "realisasi_formatted": "94,5%",
      "deviasi": "+4,5%",
      "status": "Tercapai (Optimal)",
      "status_badge": "success",
      "dasar_hukum": "Rencana Umum Nasional Keselamatan Lalu Lintas dan Angkutan Jalan (RUNK LLAJ)"
    },
    {
      "id": "KPI-05",
      "indikator": "Rasio Kelaikan Jalan Armada Angkutan Umum Penumpang (Ramp Check)",
      "bidang": "Sarana & Prasarana",
      "program_terkait": "PRG-05",
      "satuan": "Persen (%)",
      "formula": "(Jumlah Armada Bus Lulus Ramp Check / Total Armada Bus Diperiksa) x 100%",
      "target_kemenhub": 85.0,
      "target_formatted": "85,0%",
      "realisasi_kinerja": 87.3,
      "realisasi_formatted": "87,3%",
      "deviasi": "+2,3%",
      "status": "Tercapai (Optimal)",
      "status_badge": "success",
      "dasar_hukum": "Peraturan Direktur Jenderal Perhubungan Darat tentang Pedoman Teknis Inspeksi Keselamatan LLAJ"
    },
    {
      "id": "KPI-06",
      "indikator": "Indeks Aksesibilitas Konektivitas Antarmoda & Simpul Strategis",
      "bidang": "Angkutan Jalan",
      "program_terkait": "PRG-06",
      "satuan": "Indeks Skala 100",
      "formula": "Rata-rata Skor Multicriteria Accessibility Index 27 Kabupaten/Kota se-Jawa Barat",
      "target_kemenhub": 75.0,
      "target_formatted": "75,0 poin",
      "realisasi_kinerja": 79.4,
      "realisasi_formatted": "79,4 poin",
      "deviasi": "+4,4 poin",
      "status": "Tercapai (Optimal)",
      "status_badge": "success",
      "dasar_hukum": "Keputusan Menteri Perhubungan tentang Tatanan Transportasi Nasional (TATRANAS)"
    }
  ],
  "quarterly_progress": [
    {
      "quarter": "Q1",
      "periode": "Januari - Maret",
      "target_keuangan_persen": 15.0,
      "realisasi_keuangan_persen": 16.2,
      "realisasi_keuangan_nominal": 5395000000,
      "target_fisik_persen": 18.0,
      "realisasi_fisik_persen": 19.5,
      "status": "Tercapai",
      "status_badge": "success",
      "catatan": "Penyelesaian proses lelang pengadaan barang/jasa dan penetapan kontrak operasional PSO perintis tepat waktu."
    },
    {
      "quarter": "Q2",
      "periode": "April - Juni",
      "target_keuangan_persen": 45.0,
      "realisasi_keuangan_persen": 46.8,
      "realisasi_keuangan_nominal": 15585000000,
      "target_fisik_persen": 48.0,
      "realisasi_fisik_persen": 50.2,
      "status": "Tercapai",
      "status_badge": "success",
      "catatan": "Mobilisasi inspeksi keselamatan Ramp Check Angkutan Lebaran dan percepatan pabrikasi guardrail baja koridor nasional."
    },
    {
      "quarter": "Q3",
      "periode": "Juli - September",
      "target_keuangan_persen": 75.0,
      "realisasi_keuangan_persen": 77.4,
      "realisasi_keuangan_nominal": 25776000000,
      "target_fisik_persen": 78.0,
      "realisasi_fisik_persen": 80.1,
      "status": "Tercapai",
      "status_badge": "success",
      "catatan": "Operasi gabungan penegakan hukum Zero ODOL di 6 UPPKB dan penyelesaian pemasangan marka koridor arteri."
    },
    {
      "quarter": "Q4",
      "periode": "Oktober - Desember",
      "target_keuangan_persen": 90.0,
      "realisasi_keuangan_persen": 91.4,
      "realisasi_keuangan_nominal": 30439261419,
      "target_fisik_persen": 92.0,
      "realisasi_fisik_persen": 93.6,
      "status": "Tercapai (On Track)",
      "status_badge": "success",
      "catatan": "Finalisasi audit operasional PSO perintis, verifikasi SPM 12 terminal tipe A, dan persiapan posko terpadu Nataru."
    }
  ]
};

// Global Application State
var programData = PROGRAM_EMBEDDED_DATA;
var mapInstance = null;
var markersLayerGroup = null;
var programMarkersMap = {};
var activeBidangFilter = "ALL";
var previousActiveElement = null;
var activeProgramIdForModal = null;

/**
 * Format nominal Rupiah
 */
function formatRupiah(num) {
  if (typeof num !== "number") return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

/**
 * Update realtime clock (WIB)
 */
function initClock() {
  function update() {
    var now = new Date();
    var timeEl = document.getElementById("current-time");
    var dateEl = document.getElementById("current-date");

    if (timeEl) {
      var hours = String(now.getHours()).padStart(2, "0");
      var mins = String(now.getMinutes()).padStart(2, "0");
      var secs = String(now.getSeconds()).padStart(2, "0");
      timeEl.textContent = hours + ":" + mins + ":" + secs + " WIB";
    }

    if (dateEl) {
      var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      dateEl.textContent = now.toLocaleDateString("id-ID", options);
    }
  }

  update();
  setInterval(update, 1000);
}

/**
 * Mobile drawer sidebar toggle
 */
function initSidebar() {
  var toggle = document.getElementById("sidebarToggle");
  var sidebar = document.getElementById("appSidebar");
  var overlay = document.getElementById("sidebarOverlay");
  var closeBtn = document.getElementById("sidebarClose");

  if (!toggle || !sidebar) return;

  function openMenu() {
    sidebar.classList.add("is-open");
    if (overlay) overlay.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sidebar.classList.remove("is-open");
    if (overlay) overlay.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    if (sidebar.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);
}

/**
 * Render 4 Executive KPI Cards
 */
function renderKPIs() {
  var s = programData.summary || {};
  var totalPaguEl = document.getElementById("kpiTotalPagu");
  var realisasiKeuanganEl = document.getElementById("kpiRealisasiKeuangan");
  var progresFisikEl = document.getElementById("kpiProgresFisik");
  var totalProgramsEl = document.getElementById("kpiTotalPrograms");

  if (totalPaguEl) {
    totalPaguEl.textContent = "Rp 33,3 M";
  }
  if (realisasiKeuanganEl) {
    realisasiKeuanganEl.textContent = (s.persentase_realisasi_keuangan ? s.persentase_realisasi_keuangan.toLocaleString("id-ID", { minimumFractionDigits: 1 }) : "91,4") + "%";
  }
  if (progresFisikEl) {
    progresFisikEl.textContent = (s.rata_rata_progres_fisik ? s.rata_rata_progres_fisik.toLocaleString("id-ID", { minimumFractionDigits: 1 }) : "93,6") + "%";
  }
  if (totalProgramsEl) {
    totalProgramsEl.textContent = (s.total_program_strategis || (programData.programs ? programData.programs.length : 6)) + " Program";
  }
}

/**
 * Safe Leaflet Loader with Polling and Dynamic Fallback Injection
 */
function ensureLeafletLoaded(callback, maxAttempts) {
  maxAttempts = maxAttempts || 50;
  var attempts = 0;

  function check() {
    if (typeof L !== "undefined" && typeof L.map === "function") {
      callback();
      return;
    }

    attempts++;
    if (attempts === 10) {
      if (!document.getElementById("leafletFallbackScript")) {
        var fb = document.createElement("script");
        fb.id = "leafletFallbackScript";
        fb.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        document.head.appendChild(fb);
      }
    }

    if (attempts < maxAttempts) {
      setTimeout(check, 100);
    } else {
      console.warn("Leaflet loader timed out after " + maxAttempts + " attempts.");
    }
  }

  check();
}

/**
 * Create DivIcon for Program Marker
 */
function createProgramIcon(program) {
  var bidangClass = "is-" + program.kode_bidang.toLowerCase();
  var percentStr = (program.persentase_fisik || 0).toLocaleString("id-ID", { minimumFractionDigits: 1 }) + "%";

  var html = '<div class="program-marker-pin ' + bidangClass + '" title="' + program.id + ': ' + program.nama + '">' +
    '<span class="marker-percent-text">' + percentStr + '</span>' +
    '<span class="marker-sub-text">' + program.id + '</span>' +
    '</div>';

  return L.divIcon({
    className: "program-marker",
    html: html,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
}

/**
 * Render Markers on Leaflet Map
 */
function renderMapMarkers() {
  if (!mapInstance || !markersLayerGroup) return;

  markersLayerGroup.clearLayers();
  programMarkersMap = {};

  var programs = programData.programs || [];

  programs.forEach(function (prg) {
    if (activeBidangFilter !== "ALL" && prg.kode_bidang !== activeBidangFilter) {
      return;
    }

    var icon = createProgramIcon(prg);
    var marker = L.marker([prg.lat, prg.lng], { icon: icon });

    var bidangBadgeClass = "bidang-" + prg.kode_bidang.toLowerCase();

    var popupHtml = '<div class="program-popup">' +
      '<div style="margin-bottom:6px;"><span class="bidang-badge ' + bidangBadgeClass + '">' + prg.bidang + '</span> <span class="code-pill">' + prg.id + '</span></div>' +
      '<div class="popup-title">' + prg.nama + '</div>' +
      '<div class="popup-param"><strong>Pagu Anggaran:</strong> ' + prg.pagu_anggaran_formatted + '</div>' +
      '<div class="popup-param"><strong>Realisasi Keuangan:</strong> ' + prg.realisasi_keuangan_formatted + ' (' + prg.persentase_keuangan.toLocaleString("id-ID") + '%)</div>' +
      '<div class="popup-param"><strong>Output Fisik:</strong> ' + prg.realisasi_fisik + '</div>' +
      '<div class="popup-param"><strong>Lokasi Fokus:</strong> ' + prg.lokasi_fokus + '</div>' +
      '<div class="popup-param" style="color:#16a34a; font-weight:600;"><strong>Status:</strong> ' + prg.status + '</div>' +
      '<button type="button" class="popup-btn" onclick="window.showProgramDetail(\'' + prg.id + '\')">Rincian Evaluasi</button>' +
      '</div>';

    marker.bindPopup(popupHtml);
    markersLayerGroup.addLayer(marker);
    programMarkersMap[prg.id] = marker;
  });
}

/**
 * Initialize Leaflet Map
 */
function initMap() {
  var mapContainer = document.getElementById("programMap");
  if (!mapContainer) return;

  ensureLeafletLoaded(function () {
    if (mapInstance) return;

    var defaultLat = -6.9;
    var defaultLng = 107.6;
    var defaultZoom = 8;

    mapInstance = L.map("programMap", {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> kontributor | BPTD Jawa Barat'
    }).addTo(mapInstance);

    markersLayerGroup = L.layerGroup().addTo(mapInstance);
    renderMapMarkers();

    var focusBtn = document.getElementById("btnFocusJabar");
    if (focusBtn) {
      focusBtn.addEventListener("click", function () {
        mapInstance.setView([defaultLat, defaultLng], defaultZoom);
      });
    }

    setTimeout(function () {
      if (mapInstance) mapInstance.invalidateSize();
    }, 200);
  });
}

/**
 * Setup Bidang Filter Chips
 */
function initBidangFilter() {
  var chips = document.querySelectorAll(".bidang-chip");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      activeBidangFilter = chip.getAttribute("data-bidang") || "ALL";
      renderMapMarkers();
    });
  });
}

/**
 * Render Panel 1: Table of 6 Strategic Programs
 */
function renderProgramsTable() {
  var tbody = document.getElementById("programTableBody");
  var countEl = document.getElementById("programCount");
  var searchInput = document.getElementById("searchProgram");
  var filterBidang = document.getElementById("filterSelectBidang");
  var filterStatus = document.getElementById("filterSelectStatus");

  if (!tbody) return;

  var q = searchInput ? searchInput.value.toLowerCase().trim() : "";
  var selBidang = filterBidang ? filterBidang.value : "ALL";
  var selStatus = filterStatus ? filterStatus.value : "ALL";

  var programs = programData.programs || [];

  var filtered = programs.filter(function (prg) {
    if (selBidang !== "ALL" && prg.kode_bidang !== selBidang) return false;
    if (selStatus !== "ALL" && prg.status !== selStatus) return false;

    if (q) {
      var matchId = prg.id.toLowerCase().indexOf(q) !== -1;
      var matchName = prg.nama.toLowerCase().indexOf(q) !== -1;
      var matchBidang = prg.bidang.toLowerCase().indexOf(q) !== -1;
      var matchDesc = prg.deskripsi.toLowerCase().indexOf(q) !== -1;
      var matchLokasi = prg.lokasi_fokus.toLowerCase().indexOf(q) !== -1;
      var matchKpi = prg.kpi_utama.toLowerCase().indexOf(q) !== -1;
      if (!matchId && !matchName && !matchBidang && !matchDesc && !matchLokasi && !matchKpi) {
        return false;
      }
    }

    return true;
  });

  if (countEl) {
    countEl.textContent = "Menampilkan " + filtered.length + " dari " + programs.length + " program";
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="td-center" style="padding:2rem; color:#64748b;">Tidak ada program yang memenuhi kriteria filter.</td></tr>';
    return;
  }

  var html = "";
  filtered.forEach(function (prg, idx) {
    var bidangBadgeClass = "bidang-" + prg.kode_bidang.toLowerCase();
    var progressClass = prg.kode_bidang === "ANGKUTAN" ? "progress-fill-blue" : (prg.kode_bidang === "LALIN" ? "progress-fill-amber" : "progress-fill-green");

    html += '<tr>' +
      '<td class="td-center font-mono">' + (idx + 1) + '</td>' +
      '<td>' +
        '<div style="font-weight:700; color:#0f172a; margin-bottom:2px;">' + prg.nama + '</div>' +
        '<div style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:#64748b;">' +
          '<span class="code-pill">' + prg.id + '</span>' +
          '<span>' + prg.lokasi_fokus + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span class="bidang-badge ' + bidangBadgeClass + '">' + prg.bidang + '</span></td>' +
      '<td class="font-mono" style="font-weight:600; color:#0f172a;">' + prg.pagu_anggaran_formatted + '</td>' +
      '<td>' +
        '<div class="font-mono" style="font-weight:600; color:#16a34a;">' + prg.realisasi_keuangan_formatted + '</div>' +
        '<div style="font-size:0.6875rem; color:#64748b;">' + prg.persentase_keuangan.toLocaleString("id-ID") + '% terserap</div>' +
      '</td>' +
      '<td>' +
        '<div style="font-size:0.75rem; font-weight:600; color:#1e293b;">' + prg.realisasi_fisik + '</div>' +
        '<div style="font-size:0.6875rem; color:#64748b;">Target: ' + prg.target_fisik + '</div>' +
      '</td>' +
      '<td>' +
        '<div class="progress-cell">' +
          '<div class="progress-cell-header">' +
            '<span>Output</span>' +
            '<span style="font-weight:700; color:#0f172a;">' + prg.persentase_fisik.toLocaleString("id-ID") + '%</span>' +
          '</div>' +
          '<div class="progress-bar-track">' +
            '<div class="progress-bar-fill ' + progressClass + '" style="width:' + Math.min(prg.persentase_fisik, 100) + '%;"></div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="td-center"><span class="badge-status-on-track">' + prg.status + '</span></td>' +
      '<td class="td-center">' +
        '<button type="button" class="btn-detail" onclick="window.showProgramDetail(\'' + prg.id + '\')" title="Lihat evaluasi lengkap ' + prg.id + '">' +
          '<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>' +
          'Detail' +
        '</button>' +
      '</td>' +
    '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Render Panel 2: Table of Strategic KPIs
 */
function renderKpiTable() {
  var tbody = document.getElementById("kpiTableBody");
  if (!tbody) return;

  var kpis = programData.kpi_strategic_registry || [];
  var html = "";

  kpis.forEach(function (kpi) {
    var bidangClass = kpi.bidang === "Angkutan Jalan" ? "bidang-angkutan" : (kpi.bidang === "Lalu Lintas Jalan" ? "bidang-lalin" : "bidang-sarpras");

    html += '<tr>' +
      '<td class="td-center"><span class="code-pill">' + kpi.id + '</span></td>' +
      '<td>' +
        '<div style="font-weight:700; color:#0f172a; margin-bottom:2px;">' + kpi.indikator + '</div>' +
        '<div style="font-size:0.6875rem; color:#64748b;">Program: ' + kpi.program_terkait + ' | Satuan: ' + kpi.satuan + '</div>' +
      '</td>' +
      '<td><span class="bidang-badge ' + bidangClass + '">' + kpi.bidang + '</span></td>' +
      '<td style="font-size:0.75rem; color:#334155; font-family:ui-monospace, monospace;">' + kpi.formula + '</td>' +
      '<td class="td-center font-mono" style="font-weight:600; color:#475569;">' + kpi.target_formatted + '</td>' +
      '<td class="td-center font-mono" style="font-weight:700; color:#16a34a;">' + kpi.realisasi_formatted + '</td>' +
      '<td class="td-center font-mono" style="font-weight:700; color:#2563eb;">' + kpi.deviasi + '</td>' +
      '<td class="td-center"><span class="badge-status-on-track">' + kpi.status + '</span></td>' +
      '<td style="font-size:0.75rem; color:#475569; line-height:1.4;">' + kpi.dasar_hukum + '</td>' +
    '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Render Panel 3: Table of Quarterly Progress
 */
function renderQuarterlyTable() {
  var tbody = document.getElementById("quarterlyTableBody");
  if (!tbody) return;

  var quarters = programData.quarterly_progress || [];
  var html = "";

  quarters.forEach(function (q) {
    html += '<tr>' +
      '<td class="td-center"><span class="code-pill" style="font-weight:800; font-size:0.75rem;">' + q.quarter + '</span></td>' +
      '<td style="font-weight:600; color:#0f172a;">' + q.periode + '</td>' +
      '<td class="td-center font-mono" style="color:#64748b;">' + q.target_keuangan_persen.toLocaleString("id-ID") + '%</td>' +
      '<td>' +
        '<div class="font-mono" style="font-weight:700; color:#16a34a;">' + formatRupiah(q.realisasi_keuangan_nominal) + '</div>' +
        '<div style="font-size:0.6875rem; color:#64748b;">' + q.realisasi_keuangan_persen.toLocaleString("id-ID") + '% dari total pagu</div>' +
      '</td>' +
      '<td class="td-center font-mono" style="color:#64748b;">' + q.target_fisik_persen.toLocaleString("id-ID") + '%</td>' +
      '<td class="td-center font-mono" style="font-weight:700; color:#d97706;">' + q.realisasi_fisik_persen.toLocaleString("id-ID") + '%</td>' +
      '<td>' +
        '<div class="progress-cell">' +
          '<div class="progress-bar-track">' +
            '<div class="progress-bar-fill progress-fill-green" style="width:' + Math.min(q.realisasi_fisik_persen, 100) + '%;"></div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="td-center"><span class="badge-status-on-track">' + q.status + '</span></td>' +
      '<td style="font-size:0.75rem; color:#334155; line-height:1.4;">' + q.catatan + '</td>' +
    '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * Setup Tabs Switcher with Keyboard Accessibility
 */
function initTabs() {
  var tabButtons = [
    { btn: document.getElementById("btnTabPrograms"), panel: document.getElementById("panelPrograms") },
    { btn: document.getElementById("btnTabKpi"), panel: document.getElementById("panelKpi") },
    { btn: document.getElementById("btnTabQuarterly"), panel: document.getElementById("panelQuarterly") }
  ];

  tabButtons.forEach(function (tab, index) {
    if (!tab.btn || !tab.panel) return;

    tab.btn.addEventListener("click", function () {
      activateTab(index);
    });

    tab.btn.addEventListener("keydown", function (e) {
      var nextIndex = null;
      if (e.key === "ArrowRight") {
        nextIndex = (index + 1) % tabButtons.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = tabButtons.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        activateTab(nextIndex);
        if (tabButtons[nextIndex].btn) tabButtons[nextIndex].btn.focus();
      }
    });
  });

  function activateTab(targetIndex) {
    tabButtons.forEach(function (tab, i) {
      if (!tab.btn || !tab.panel) return;
      var isActive = i === targetIndex;
      if (isActive) {
        tab.btn.classList.add("is-active");
        tab.btn.setAttribute("aria-selected", "true");
        tab.btn.setAttribute("tabindex", "0");
        tab.panel.removeAttribute("hidden");
      } else {
        tab.btn.classList.remove("is-active");
        tab.btn.setAttribute("aria-selected", "false");
        tab.btn.setAttribute("tabindex", "-1");
        tab.panel.setAttribute("hidden", "");
      }
    });
  }
}

/**
 * Setup Table Toolbar Filters & Search
 */
function initTableFilters() {
  var searchInput = document.getElementById("searchProgram");
  var filterBidang = document.getElementById("filterSelectBidang");
  var filterStatus = document.getElementById("filterSelectStatus");

  if (searchInput) {
    searchInput.addEventListener("input", renderProgramsTable);
  }
  if (filterBidang) {
    filterBidang.addEventListener("change", renderProgramsTable);
  }
  if (filterStatus) {
    filterStatus.addEventListener("change", renderProgramsTable);
  }
}

/**
 * Open Modal with Program Evaluation Details (WAI-ARIA accessible)
 */
function showProgramDetail(programId) {
  var programs = programData.programs || [];
  var prg = programs.find(function (p) { return p.id === programId; });
  if (!prg) return;

  activeProgramIdForModal = programId;
  previousActiveElement = document.activeElement;

  var modal = document.getElementById("programDetailModal");
  var backdrop = document.getElementById("modalBackdrop");
  if (!modal || !backdrop) return;

  var bidangBadge = document.getElementById("modalBidangBadge");
  var codeBadge = document.getElementById("modalCodeBadge");
  var statusBadge = document.getElementById("modalStatusBadge");
  var titleEl = document.getElementById("modalProgramTitle");
  var subEl = document.getElementById("modalProgramSub");
  var descBox = document.getElementById("modalDescBox");
  var paguVal = document.getElementById("modalPaguVal");
  var realisasiKeuanganVal = document.getElementById("modalRealisasiKeuanganVal");
  var persenKeuanganVal = document.getElementById("modalPersenKeuanganVal");
  var progresFisikVal = document.getElementById("modalProgresFisikVal");
  var realisasiFisikSub = document.getElementById("modalRealisasiFisikSub");
  var kpiTitle = document.getElementById("modalKpiTitle");
  var kpiStatusVal = document.getElementById("modalKpiStatusVal");
  var kpiActualVal = document.getElementById("modalKpiActualVal");
  var subKegiatanList = document.getElementById("modalSubKegiatanList");
  var evaluationBox = document.getElementById("modalEvaluationBox");

  if (bidangBadge) {
    bidangBadge.className = "bidang-badge bidang-" + prg.kode_bidang.toLowerCase();
    bidangBadge.textContent = prg.bidang;
  }
  if (codeBadge) codeBadge.textContent = prg.id;
  if (statusBadge) statusBadge.textContent = prg.status.toUpperCase();
  if (titleEl) titleEl.textContent = prg.nama;
  if (subEl) subEl.textContent = "Lokus: " + prg.lokasi_fokus;
  if (descBox) descBox.textContent = prg.deskripsi;
  if (paguVal) paguVal.textContent = prg.pagu_anggaran_formatted;
  if (realisasiKeuanganVal) realisasiKeuanganVal.textContent = prg.realisasi_keuangan_formatted;
  if (persenKeuanganVal) persenKeuanganVal.textContent = prg.persentase_keuangan.toLocaleString("id-ID") + "% Terserap";
  if (progresFisikVal) progresFisikVal.textContent = prg.persentase_fisik.toLocaleString("id-ID") + "%";
  if (realisasiFisikSub) realisasiFisikSub.textContent = prg.realisasi_fisik;
  if (kpiTitle) kpiTitle.textContent = prg.kpi_utama;
  if (kpiStatusVal) kpiStatusVal.textContent = prg.status_kpi;
  if (kpiActualVal) kpiActualVal.textContent = "Capaian: " + prg.capaian_kpi;

  // Render Sub-kegiatan
  if (subKegiatanList) {
    var subHtml = "";
    var subList = prg.sub_kegiatan || [];
    var progressClass = prg.kode_bidang === "ANGKUTAN" ? "progress-fill-blue" : (prg.kode_bidang === "LALIN" ? "progress-fill-amber" : "progress-fill-green");

    subList.forEach(function (sub) {
      subHtml += '<div class="subkegiatan-item">' +
        '<div class="subkegiatan-header">' +
          '<span class="subkegiatan-name">' + sub.nama + '</span>' +
          '<span class="subkegiatan-percent">' + sub.progres.toLocaleString("id-ID") + '%</span>' +
        '</div>' +
        '<div class="subkegiatan-targets">' +
          '<span>Target: ' + sub.target + '</span>' +
          '<span style="font-weight:600; color:#0f172a;">Realisasi: ' + sub.realisasi + '</span>' +
        '</div>' +
        '<div class="progress-bar-track">' +
          '<div class="progress-bar-fill ' + progressClass + '" style="width:' + Math.min(sub.progres, 100) + '%;"></div>' +
        '</div>' +
      '</div>';
    });
    subKegiatanList.innerHTML = subHtml;
  }

  if (evaluationBox) evaluationBox.textContent = prg.catatan_evaluasi;

  backdrop.removeAttribute("hidden");
  modal.removeAttribute("hidden");

  var closeBtn = document.getElementById("modalCloseBtn");
  if (closeBtn) closeBtn.focus();
}

/**
 * Close Program Detail Modal
 */
function closeProgramModal() {
  var modal = document.getElementById("programDetailModal");
  var backdrop = document.getElementById("modalBackdrop");
  if (!modal || !backdrop) return;

  modal.setAttribute("hidden", "");
  backdrop.setAttribute("hidden", "");
  activeProgramIdForModal = null;

  if (previousActiveElement && typeof previousActiveElement.focus === "function") {
    previousActiveElement.focus();
  }
}

/**
 * Setup Modal Event Listeners (Close, Escape Key, Focus Restoration)
 */
function initModalListeners() {
  var modal = document.getElementById("programDetailModal");
  var backdrop = document.getElementById("modalBackdrop");
  var closeBtn = document.getElementById("modalCloseBtn");
  var closeFooterBtn = document.getElementById("modalCloseFooterBtn");
  var focusMapBtn = document.getElementById("modalFocusMapBtn");

  if (closeBtn) closeBtn.addEventListener("click", closeProgramModal);
  if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeProgramModal);
  if (backdrop) backdrop.addEventListener("click", closeProgramModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) {
      closeProgramModal();
    }
  });

  if (focusMapBtn) {
    focusMapBtn.addEventListener("click", function () {
      if (!activeProgramIdForModal) return;
      var programs = programData.programs || [];
      var prg = programs.find(function (p) { return p.id === activeProgramIdForModal; });
      if (!prg || !mapInstance) return;

      closeProgramModal();

      mapInstance.setView([prg.lat, prg.lng], 10, { animate: true });
      var marker = programMarkersMap[prg.id];
      if (marker) {
        setTimeout(function () {
          marker.openPopup();
        }, 300);
      }

      var mapEl = document.getElementById("programMap");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
}

/**
 * Fetch Official Dataset Asynchronously
 */
function fetchProgramData() {
  var candidates = [
    "../../data/program-kinerja-jabar.json",
    "/data/program-kinerja-jabar.json",
    "../data/program-kinerja-jabar.json"
  ];

  function tryFetch(index) {
    if (index >= candidates.length) {
      console.info("Using embedded program-kinerja dataset fallback.");
      return;
    }

    fetch(candidates[index])
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (json) {
        if (json && json.programs && json.programs.length > 0) {
          programData = json;
          renderKPIs();
          renderMapMarkers();
          renderProgramsTable();
          renderKpiTable();
          renderQuarterlyTable();
        }
      })
      .catch(function () {
        tryFetch(index + 1);
      });
  }

  tryFetch(0);
}

// Global window exposure for inline onclick handlers
window.showProgramDetail = showProgramDetail;

/**
 * Application Bootstrap
 */
document.addEventListener("DOMContentLoaded", function () {
  initClock();
  initSidebar();
  renderKPIs();
  initMap();
  initBidangFilter();
  initTabs();
  initTableFilters();
  initModalListeners();
  renderProgramsTable();
  renderKpiTable();
  renderQuarterlyTable();
  fetchProgramData();
});
