// The low-detail 3D monuments standing on the map (mosque + Tophane Çeşmesi), as
// one MapLibre custom layer that shares MapLibre's WebGL context (MapLibre's
// "3D model with three.js" approach). One renderer, one scene, one material kit.
// Renders only when MapLibre repaints — no animation loop.
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import { buildMosque, addLights, disposeMosque } from './mosque.js';
import { buildFountain } from './fountain.js';
import { PIXEL_RATIO } from './perf.js';

/**
 * @param {{
 *   mosque: {lngLat:[number,number], qiblaAzimuth:number},
 *   fountain: {lngLat:[number,number], azimuth:number},
 *   onTap: (which: 'mosque'|'fountain') => void,
 * }} opts
 * @returns {maplibregl.CustomLayerInterface & {hitTest:(p:{x:number,y:number})=>string|null}}
 */
export function createMonumentsLayer({ mosque: M, fountain: F, onTap }) {
  // Scene space = the mosque's local frame in metres: +x east-ish, +y up, +z toward the qibla.
  // Model space -> mercator: rotating about Y by (180° - azimuth) points +z at `qiblaAzimuth`.
  const mc = maplibregl.MercatorCoordinate.fromLngLat(M.lngLat, 0);
  const s = mc.meterInMercatorCoordinateUnits();
  const modelMatrix = new THREE.Matrix4()
    .makeTranslation(mc.x, mc.y, mc.z)
    .scale(new THREE.Vector3(s, -s, s))
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
    .multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(180 - M.qiblaAzimuth)));
  // The fountain's OSM centroid expressed in that frame (the ~46 m offset is too small for mercator scale to matter).
  const fc = maplibregl.MercatorCoordinate.fromLngLat(F.lngLat, 0);
  const fLocal = new THREE.Vector3(fc.x, fc.y, 0).applyMatrix4(modelMatrix.clone().invert());
  const fYaw = THREE.MathUtils.degToRad(M.qiblaAzimuth - F.azimuth);

  const camera = new THREE.Camera();
  const scene = new THREE.Scene();
  const mvp = new THREE.Matrix4(), inv = new THREE.Matrix4();
  const raycaster = new THREE.Raycaster();
  let renderer, map, mosque, fountain, models = [], onClick;

  const layer = {
    id: 'monuments-3d',
    type: 'custom',
    renderingMode: '3d',

    onAdd(m, gl) {
      map = m;
      mosque = buildMosque({ detail: 'low' });
      const kit = mosque.userData.kit;
      kit.hull.uniforms.uPx.value = 0.9 * PIXEL_RATIO;
      fountain = buildFountain({ detail: 'low', kit, x: fLocal.x, z: fLocal.z, ry: fYaw });
      scene.add(mosque, fountain);
      addLights(scene).position.set(-30, 80, 50);
      // Generous invisible tap targets (fingers are bigger than a 30px mosque or a 12px fountain).
      const hitMat = new THREE.MeshBasicMaterial();
      const hit = (w, h, d, x, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(x, h / 2, z), hitMat); b.visible = false; scene.add(b); return b; };
      models = [
        { id: 'mosque', box: hit(34, 30, 42, 0, 0), meshes: mosque.userData.meshes, axis: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 24, 0)] },
        { id: 'fountain', box: hit(16, 10, 16, fLocal.x, fLocal.z), meshes: fountain.userData.meshes, axis: [new THREE.Vector3(fLocal.x, 0, fLocal.z), new THREE.Vector3(fLocal.x, 8, fLocal.z)] },
      ];
      if (import.meta.env.DEV) console.info(`[map models] ${(mosque.userData.triangles + fountain.userData.triangles) | 0} triangles`);

      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;

      onClick = e => { const id = layer.hitTest(e.point); if (id) onTap(id); };
      map.on('click', onClick);
    },

    render(gl, args) {
      mvp.fromArray(args.defaultProjectionData.mainMatrix).multiply(modelMatrix);
      camera.projectionMatrix.copy(mvp);
      mosque.userData.kit.setResolution(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.resetState();
      renderer.render(scene, camera);
    },

    onRemove() {
      map.off('click', onClick);
      models.forEach(m => { m.box.geometry.dispose(); m.box.material.dispose(); });
      fountain.traverse(o => o.geometry && o.geometry.dispose());   // its materials are the mosque kit's
      disposeMosque(mosque);
      renderer.dispose();
    },

    /** Ray from the tapped pixel into model space, tested against padded boxes. Returns the model id or null. */
    hitTest({ x, y }) {
      if (!renderer) return null;
      const el = map.getCanvas();
      const nx = (x / el.clientWidth) * 2 - 1, ny = 1 - (y / el.clientHeight) * 2;
      inv.copy(mvp).invert();
      const near = new THREE.Vector3(nx, ny, -1).applyMatrix4(inv);
      const far = new THREE.Vector3(nx, ny, 1).applyMatrix4(inv);
      raycaster.set(near, far.sub(near).normalize());
      let best = null, bestD = Infinity;
      for (const m of models) {
        const h = raycaster.intersectObjects([m.box, ...m.meshes], false)[0];
        if (h && h.distance < bestD) { best = m.id; bestD = h.distance; }
      }
      if (best) return best;
      // Fallback for very small on-screen sizes: within 28px of a projected vertical axis.
      const px = v => { const p = v.clone().applyMatrix4(mvp); return [(p.x + 1) / 2 * el.clientWidth, (1 - p.y) / 2 * el.clientHeight]; };
      let bestPx = 28;
      for (const m of models) {
        const [ax, ay] = px(m.axis[0]), [bx, by] = px(m.axis[1]), dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        const d = Math.hypot(ax + t * dx - x, ay + t * dy - y);
        if (d < bestPx) { best = m.id; bestPx = d; }
      }
      return best;
    },
  };
  return layer;
}
