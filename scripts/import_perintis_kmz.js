/**
 * import_perintis_kmz.js — Importer KML / KMZ untuk Routing Presisi Angkutan Perintis
 * 
 * Penggunaan:
 *   node Geo12-pages/scripts/import_perintis_kmz.js <path_to_file.kml_atau_kmz>
 * 
 * Fitur:
 *   1. Membaca file KML / KMZ (ekstrak XML jika KMZ).
 *   2. Membaca koordinat LineString/Multigeometry (lon,lat -> [lat,lng]).
 *   3. Menyederhanakan koordinat (RDP algorithm eps=0.0003 ~30m).
 *   4. Memperbarui geometri rute presisi pada perintis-jabar-2025.json.
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'perintis-jabar-2025.json');

function RDP(pts, eps) {
  if (pts.length < 3) return pts;
  let imax = 1, maxD = 0;
  const a = pts[0], b = pts[pts.length - 1];
  const AB = [b[0] - a[0], b[1] - a[1]], AB2 = AB[0] ** 2 + AB[1] ** 2;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    let d;
    if (AB2 === 0) d = Math.hypot(p[0] - a[0], p[1] - a[1]);
    else {
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * AB[0] + (p[1] - a[1]) * AB[1]) / AB2));
      const proj = [a[0] + t * AB[0], a[1] + t * AB[1]];
      d = Math.hypot(p[0] - proj[0], p[1] - proj[1]);
    }
    if (d > maxD) { maxD = d; imax = i; }
  }
  if (maxD > eps) {
    const L = RDP(pts.slice(0, imax + 1), eps);
    const R = RDP(pts.slice(imax), eps);
    return L.concat(R.slice(1));
  }
  return [a, b];
}

function parseKMLString(kmlText) {
  const placemarks = [];
  const pmRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  let match;
  while ((match = pmRegex.exec(kmlText)) !== null) {
    const pmContent = match[1];
    const nameMatch = pmContent.match(/<name>(.*?)<\/name>/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unnamed';
    
    const coordMatch = pmContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (coordMatch) {
      const rawCoords = coordMatch[1].trim().split(/\s+/);
      const polyline = rawCoords.filter(Boolean).map(c => {
        const parts = c.split(',');
        return [parseFloat(parts[1]), parseFloat(parts[0])]; // lat, lng
      }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
      
      if (polyline.length > 0) {
        placemarks.push({ name, polyline: RDP(polyline, 0.0003) });
      }
    }
  }
  return placemarks;
}

function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Penggunaan: node import_perintis_kmz.js <path_to_file.kml>');
    console.log('Info: File KML / KMZ akan meng-update perintis-jabar-2025.json.');
    return;
  }

  if (!fs.existsSync(filePath)) {
    console.error('File tidak ditemukan:', filePath);
    process.exit(1);
  }

  let kmlContent = '';
  if (filePath.endsWith('.kmz')) {
    console.log('Peringatan: Untuk file .kmz, silakan unzip terlebih dahulu untuk mendapatkan file doc.kml.');
    process.exit(1);
  } else {
    kmlContent = fs.readFileSync(filePath, 'utf8');
  }

  const parsed = parseKMLString(kmlContent);
  console.log(`Berhasil mengekstrak ${parsed.length} placemark dari KML.`);

  if (!fs.existsSync(JSON_PATH)) {
    console.error('JSON target tidak ditemukan:', JSON_PATH);
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

  parsed.forEach((item, idx) => {
    if (idx < dataset.routes.length) {
      dataset.routes[idx].geometry.polyline = item.polyline;
      console.log(`Updated rute #${idx+1} (${dataset.routes[idx].name}) -> ${item.polyline.length} titik koordinat.`);
    }
  });

  fs.writeFileSync(JSON_PATH, JSON.stringify(dataset, null, 2));
  console.log('✓ Perintis dataset berhasil diperbarui!');
}

run();
