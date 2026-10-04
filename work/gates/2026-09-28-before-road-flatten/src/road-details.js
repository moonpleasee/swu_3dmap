import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { drapeGeometry } from './terrain.js';

// Road decoration is deliberately kept in its own module.  The source
// segments still come from the campus OSM export; this module only gives them
// a readable surface, edge and marking treatment.
// Calibrated against the light campus palette: asphalt stays charcoal gray,
// while blue-brick paths are clearly darker than concrete and pale terrain.
const asphalt = '#3d4140';
const asphaltEdge = '#555d59';
const asphaltMark = '#aaa99d';
const brick = '#4e5c56';
const brickSeam = '#303d38';
const brickEdge = '#3c4944';

const nonRoadKinds = new Set(['footway', 'path', 'steps', 'pedestrian', 'cycleway', 'corridor']);
const serviceKinds = new Set(['service', 'living_street', 'track', 'driveway', 'alley']);

function roadSurface(road) {
  const raw = String(road.surfaceType || road.surface || '').toLowerCase();
  if (['brick', 'paving_stones', 'pavers', 'sett', 'stone', '青砖'].includes(raw)) return 'brick';
  if (raw) return 'asphalt';
  return nonRoadKinds.has(road.highway) ? 'brick' : 'asphalt';
}

function roadKind(road) {
  return String(road.highway || road.kind || '').toLowerCase();
}

function finiteSegment(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  return Number.isFinite(length) && length > 0.01 ? { dx, dz, length } : null;
}

function plane(width, length, a, b, terrain, offset = 0, extra = 0) {
  const s = finiteSegment(a, b);
  if (!s || !(width > 0) || !(length > 0)) return null;
  // PlaneGeometry's local Y axis becomes world Z after rotateX(-PI/2).
  const g = new THREE.PlaneGeometry(width, length, 1, Math.max(1, Math.ceil(length / 1.3)));
  g.rotateX(-Math.PI / 2);
  g.rotateY(Math.atan2(s.dx, s.dz));
  g.translate((a[0] + b[0]) / 2, offset, (a[1] + b[1]) / 2);
  if (extra) {
    const nx = -s.dz / s.length, nz = s.dx / s.length;
    g.translate(nx * extra, 0, nz * extra);
  }
  return terrain ? drapeGeometry(g, terrain) : g;
}

function offsetSegment(a, b, offset, t0 = 0, t1 = 1) {
  const s = finiteSegment(a, b);
  if (!s) return null;
  const nx = -s.dz / s.length, nz = s.dx / s.length;
  const ax = a[0] + (b[0] - a[0]) * t0 + nx * offset;
  const az = a[1] + (b[1] - a[1]) * t0 + nz * offset;
  const bx = a[0] + (b[0] - a[0]) * t1 + nx * offset;
  const bz = a[1] + (b[1] - a[1]) * t1 + nz * offset;
  return [[ax, az], [bx, bz]];
}

function styleFor(road) {
  const surface = roadSurface(road);
  const width = Number(road.width) || (surface === 'brick' ? .55 : 1.3);
  const highway = roadKind(road);
  return {
    surface,
    width,
    highway,
    isService: serviceKinds.has(highway),
    edge: surface === 'brick' ? brickEdge : asphaltEdge,
    color: surface === 'brick' ? brick : asphalt,
  };
}

function addGeometry(bucket, geometry) {
  if (geometry) bucket.push(geometry);
}

function flush(group, geometries, material) {
  if (!geometries.length) return null;
  const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, material);
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function material(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: .94, metalness: 0 });
}

/**
 * Build detailed road sheets from the exported road segments.
 *
 * Usage in CampusScene.buildRoads():
 *   const details = buildRoadDetails({ roads: this.data.roads, terrain: this.terrain });
 *   this.layers.roads.add(details.group);
 *
 * The returned group is intentionally independent of scene state.  Existing
 * callers may add or remove it with the roads layer, and the `counts` object
 * helps the validation or handoff log report what was rendered.
 */
export function buildRoadDetails({ roads = [], terrain = null } = {}) {
  const group = new THREE.Group();
  group.name = 'road-details';
  const surfaces = { asphalt: [], brick: [] };
  const edges = { asphalt: [], brick: [] };
  const seams = [];
  const centreMarks = [];
  let segmentCount = 0, asphaltCount = 0, brickCount = 0;

  for (const road of roads) {
    const pts = Array.isArray(road?.points) ? road.points : [];
    const style = styleFor(road || {});
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], seg = finiteSegment(a, b);
      if (!seg) continue;
      segmentCount++;
      addGeometry(surfaces[style.surface], plane(style.width, seg.length + .08, a, b, terrain, .026));
      if (style.surface === 'asphalt') asphaltCount++; else brickCount++;

      // Low, inset edge bands sharpen the road boundary without making a
      // raised curb that could float over the DEM on steep paths.
      if (style.width >= (style.surface === 'brick' ? .48 : .9)) {
        const inset = Math.max(.018, Math.min(.055, style.width * .035));
        for (const side of [-1, 1]) {
          const edge = offsetSegment(a, b, side * (style.width / 2 - inset), 0, 1);
          if (!edge) continue;
          addGeometry(edges[style.surface], plane(Math.min(.055, style.width * .055), seg.length + .03, edge[0], edge[1], terrain, .041));
        }
      }

      if (style.surface === 'brick') {
        // Short transverse seams give paths a blue-brick reading while
        // remaining sparse on long service paths.
        const spacing = .68;
        const count = Math.floor(seg.length / spacing);
        for (let j = 1; j < count; j++) {
          const t = j / count;
          const p = [a[0] + seg.dx * t, a[1] + seg.dz * t];
          // Build a tiny line across the whole path using the original
          // segment normal; it remains stable for almost-horizontal paths.
          const nx = -seg.dz / seg.length, nz = seg.dx / seg.length;
          const seamA = [p[0] - nx * style.width * .44, p[1] - nz * style.width * .44];
          const seamB = [p[0] + nx * style.width * .44, p[1] + nz * style.width * .44];
          addGeometry(seams, plane(.014, style.width * .88, seamA, seamB, terrain, .046));
        }
      } else if (style.width >= 1.25 && !style.isService && seg.length >= 4.4) {
        // Main campus drives get short, muted centre dashes.  Small service
        // roads stay plain so the model does not look like a highway map.
        const dash = Math.min(1.55, Math.max(.7, seg.length * .18));
        const gap = Math.min(1.35, Math.max(.55, dash * .8));
        const stride = dash + gap;
        for (let start = gap * .5; start + dash < seg.length - .12; start += stride) {
          const pair = offsetSegment(a, b, 0, start / seg.length, (start + dash) / seg.length);
          addGeometry(centreMarks, plane(.027, dash, pair[0], pair[1], terrain, .052));
        }
      }
    }
  }

  const baseAsphalt = flush(group, surfaces.asphalt, material(asphalt));
  const baseBrick = flush(group, surfaces.brick, material(brick));
  flush(group, edges.asphalt, material(asphaltEdge));
  flush(group, edges.brick, material(brickEdge));
  flush(group, seams, material(brickSeam));
  flush(group, centreMarks, material(asphaltMark));
  if (baseAsphalt) baseAsphalt.name = 'asphalt-surfaces';
  if (baseBrick) baseBrick.name = 'blue-brick-surfaces';
  group.userData.roadDetails = true;
  group.userData.counts = { segments: segmentCount, asphalt: asphaltCount, brick: brickCount };
  return { group, counts: group.userData.counts };
}

export { roadSurface, styleFor as roadStyle };
