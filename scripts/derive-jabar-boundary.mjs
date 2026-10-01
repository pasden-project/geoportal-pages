#!/usr/bin/env node
/* =====================================================================
   GeoPORTAL BPTD Jabar — Boundary Derivation Helper (PHASE 15B.1)
   ----------------------------------------------------------------
   Source : <repo>/src/data/Jabar_By_Kab.geojson (9,369,243 bytes, BPS/BIG)
   Output : <repo>/src/data/jabar-kabkota-min.geojson (<100KB)
   ----------------------------------------------------------------
   Deterministic Ramer-Douglas-Peucker (RDP) simplification +
   coordinate precision rounding (4 decimals ~11m).
   Preserves all 27 Kab/Kota MultiPolygon features, valid GeoJSON
   topology, ring closure, and provenance metadata.
   Node built-in only (fs, path, url). Tidak tergantung CWD.
   ===================================================================== */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const SOURCE_PATH = resolve(REPO, "src", "data", "Jabar_By_Kab.geojson");
const OUT_PATH = resolve(REPO, "src", "data", "jabar-kabkota-min.geojson");

const TOLERANCE_DEG = 0.005; // ~550m at equator
const COORD_DECIMALS = 4;    // 0.0001 deg ~ 11m

// Perpendicular distance squared from point p to line segment (p1, p2)
function getSqSegDist(p, p1, p2) {
    let x = p1[0];
    let y = p1[1];
    let dx = p2[0] - x;
    let dy = p2[1] - y;
    if (dx !== 0 || dy !== 0) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = p2[0];
            y = p2[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
}

// Ramer-Douglas-Peucker simplification
function simplifyRDP(points, sqTolerance) {
    if (points.length <= 2) return points;
    const len = points.length;
    const markers = new Uint8Array(len);
    markers[0] = markers[len - 1] = 1;
    const stack = [[0, len - 1]];

    while (stack.length > 0) {
        const [first, last] = stack.pop();
        let maxSqDist = 0;
        let index = 0;
        for (let i = first + 1; i < last; i++) {
            const sqDist = getSqSegDist(points[i], points[first], points[last]);
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }
        if (maxSqDist > sqTolerance) {
            markers[index] = 1;
            stack.push([first, index]);
            stack.push([index, last]);
        }
    }

    const result = [];
    for (let i = 0; i < len; i++) {
        if (markers[i]) {
            result.push(points[i]);
        }
    }
    return result;
}

function roundCoord(c, precision = COORD_DECIMALS) {
    const factor = Math.pow(10, precision);
    return [
        Math.round(c[0] * factor) / factor,
        Math.round(c[1] * factor) / factor
    ];
}
function ringArea(ring) {
    if (!ring || ring.length < 4) return 0;
    const x0 = ring[0][0];
    const y0 = ring[0][1];
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const x1 = ring[i][0] - x0;
        const y1 = ring[i][1] - y0;
        const x2 = ring[i + 1][0] - x0;
        const y2 = ring[i + 1][1] - y0;
        s += x1 * y2 - x2 * y1;
    }
    return Math.abs(s / 2);
}

function simplifyRing(ring, tolerance) {
    if (ring.length < 4) return ring;
    const isClosed = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
    const simplified = simplifyRDP(ring, tolerance * tolerance);

    // Ensure polygon ring retains at least 3 distinct vertices (4 points when closed)
    if (simplified.length < 4) {
        return ring.map(pt => roundCoord(pt));
    }

    const rounded = simplified.map(pt => roundCoord(pt));
    if (isClosed) {
        const lastIdx = rounded.length - 1;
        if (rounded[0][0] !== rounded[lastIdx][0] || rounded[0][1] !== rounded[lastIdx][1]) {
            rounded.push([rounded[0][0], rounded[0][1]]);
        }
    }
    return rounded;
}

function derive() {
    console.log(`Reading source: ${SOURCE_PATH}`);
    const srcStat = statSync(SOURCE_PATH);
    console.log(`Source size: ${srcStat.size} bytes (${(srcStat.size / (1024 * 1024)).toFixed(2)} MB)`);

    const raw = readFileSync(SOURCE_PATH, "utf8");
    const srcData = JSON.parse(raw);

    if (!srcData || srcData.type !== "FeatureCollection" || !Array.isArray(srcData.features)) {
        throw new Error("Invalid GeoJSON source structure");
    }

    const outFeatures = srcData.features.map(feat => {
        const geom = feat.geometry;
        let newCoords = [];
        const polygons = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];

        for (const polygon of polygons) {
            if (!polygon || polygon.length === 0) continue;
            const extRing = simplifyRing(polygon[0], TOLERANCE_DEG);
            if (ringArea(extRing) <= 0) {
                // Drop collapsed sliver/sub-tolerance polygon parts (<11m)
                continue;
            }

            const validRings = [extRing];
            for (let ri = 1; ri < polygon.length; ri++) {
                const holeRing = simplifyRing(polygon[ri], TOLERANCE_DEG);
                if (ringArea(holeRing) > 0) {
                    validRings.push(holeRing);
                }
                // Dropping collapsed interior holes is standard GIS simplification practice
            }
            newCoords.push(validRings);
        }

        if (newCoords.length === 0 && polygons.length > 0) {
            // Fail-safe: ensure no feature is left with empty geometry
            newCoords.push([polygons[0][0].map(pt => roundCoord(pt))]);
        }

        const outGeomType = geom.type === "Polygon" && newCoords.length === 1 ? "Polygon" : "MultiPolygon";
        const outCoordinates = outGeomType === "Polygon" ? newCoords[0] : newCoords;
        return {
            type: "Feature",
            properties: {
                OBJECTID: feat.properties.OBJECTID,
                KABKOT: feat.properties.KABKOT,
                ID_KAB: feat.properties.ID_KAB,
                PROVINSI: feat.properties.PROVINSI || "JAWA BARAT"
            },
            geometry: {
                type: outGeomType,
                coordinates: outCoordinates
            }
        };
    });

    const outGeoJSON = {
        type: "FeatureCollection",
        provenance: {
            source: "src/data/Jabar_By_Kab.geojson",
            authority: "BPS / Badan Informasi Geospasial (BIG)",
            method: "Ramer-Douglas-Peucker deterministic simplification",
            tolerance_degrees: TOLERANCE_DEG,
            coordinate_precision_decimals: COORD_DECIMALS,
            feature_count: outFeatures.length,
            purpose: "Lightweight regional boundary overlay for Command Center V2 mini-map",
            generated_at: "2026-09-11T00:00:00.000Z"
        },
        features: outFeatures
    };

    const outStr = JSON.stringify(outGeoJSON);
    writeFileSync(OUT_PATH, outStr, "utf8");

    const outStat = statSync(OUT_PATH);
    console.log(`Wrote: ${OUT_PATH}`);
    console.log(`Output size: ${outStat.size} bytes (${(outStat.size / 1024).toFixed(2)} KB)`);
    console.log(`Features: ${outFeatures.length}`);

    if (outStat.size > 100 * 1024) {
        console.warn(`WARNING: output size ${outStat.size} exceeds 100KB target!`);
    } else {
        console.log(`SUCCESS: output size is within target (<100KB).`);
    }
}

derive();