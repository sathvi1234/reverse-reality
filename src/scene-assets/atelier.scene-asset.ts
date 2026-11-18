import {
  Color,
  createScenePrimitiveObject,
  Group,
  MeshStandardMaterial,
} from '@iwsdk/core';

const stone = new MeshStandardMaterial({
  color: new Color('#12182a'),
  roughness: 0.55,
  metalness: 0.35,
  emissive: new Color('#1a2748'),
  emissiveIntensity: 0.35,
});

const rim = new MeshStandardMaterial({
  color: new Color('#7ee7ff'),
  roughness: 0.25,
  metalness: 0.6,
  emissive: new Color('#2ec8ff'),
  emissiveIntensity: 0.8,
});

function lathe(
  profile: Array<[number, number]>,
  material: MeshStandardMaterial,
  segments = 64,
) {
  return createScenePrimitiveObject(
    { geometry: { type: 'lathe', profile, segments } },
    material,
  );
}

/** Parentless drawing dais. Top surface is y = 0. */
export function createAtelier(): Group {
  const root = new Group();
  root.name = 'Atelier';
  const disc = lathe(
    [
      [0.02, -0.18],
      [1.15, -0.16],
      [1.35, -0.04],
      [1.22, 0],
      [0.02, 0],
    ],
    stone,
  );
  const ring = lathe(
    [
      [1.18, 0.005],
      [1.28, 0.02],
      [1.18, 0.04],
    ],
    rim,
    72,
  );
  root.add(disc, ring);
  return root;
}
