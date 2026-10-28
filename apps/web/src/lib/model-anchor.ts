import { Box3, Vector3, type Mesh, type Object3D } from "three";

/** Scenery that only the story viewer shows (ground, surroundings, scale figures, courtyard trees and lawn). */
export const PRESENTATION_PARTS = /^(Zemin|Cevre|Olcek|Avlu_Agac|Avlu_Cim)/;

export interface ModelBase {
  /**
   * Position for the loaded scene inside a group that stands on the map point: the base point's
   * horizontal centre lands on the origin and the lowest point rests on the ground (y = 0).
   * `altitudeM` is added by the caller.
   */
  offset: Vector3;
  /** Horizontal extent of the model's parts in metres, relative to the base point, before heading and scale. */
  footprint: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Size of the box the footprint comes from (presentation scenery excluded). */
  size: Vector3;
}

const isPresentation = (item: Object3D, root: Object3D): boolean => {
  for (
    let node: Object3D | null = item;
    node && node !== root;
    node = node.parent
  )
    if (PRESENTATION_PARTS.test(node.name)) return true;
  return false;
};

/**
 * Base point of a loaded model, shared by the map and the panel preview.
 * Presentation parts are ignored. The horizontal centre comes from the `anchorNode` part's bounding box
 * when the model has such a part, else from the remaining parts, so courtyards, side buildings and
 * fountains do not shift it. The bottom is the lowest point of the remaining parts.
 */
export function modelBase(
  root: Object3D,
  anchorNode: string | null,
): ModelBase {
  root.updateMatrixWorld(true);
  const parts = new Box3();
  root.traverse((item) => {
    if ((item as Mesh).isMesh && !isPresentation(item, root))
      parts.expandByObject(item);
  });
  // A model made only of scenery still needs a base: fall back to everything it has.
  if (parts.isEmpty()) parts.setFromObject(root);
  if (parts.isEmpty()) {
    return {
      offset: new Vector3(),
      footprint: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 },
      size: new Vector3(),
    };
  }
  const part = anchorNode ? root.getObjectByName(anchorNode) : undefined;
  const anchor =
    part && !isPresentation(part, root) ? new Box3().setFromObject(part) : null;
  const centre = (anchor && !anchor.isEmpty() ? anchor : parts).getCenter(
    new Vector3(),
  );
  return {
    offset: new Vector3(-centre.x, -parts.min.y, -centre.z),
    footprint: {
      minX: parts.min.x - centre.x,
      maxX: parts.max.x - centre.x,
      minZ: parts.min.z - centre.z,
      maxZ: parts.max.z - centre.z,
    },
    size: parts.getSize(new Vector3()),
  };
}
