/**
 * Procedural fantasy set for Reverse Reality. Parentless prototypes only:
 * the manifest is evaluated by both the runtime and the editor.
 */

import {
  Color,
  createScenePrimitiveObject,
  Group,
  MeshStandardMaterial,
} from '@iwsdk/core';

const grass = new MeshStandardMaterial({
  color: '#1d4d55',
  roughness: 0.88,
  metalness: 0,
});

const stone = new MeshStandardMaterial({
  color: '#2a3148',
  roughness: 0.74,
  metalness: 0.06,
});

const leaf = new MeshStandardMaterial({
  color: '#163a48',
  roughness: 0.8,
  metalness: 0,
});

const gold = new MeshStandardMaterial({
  color: '#c6a15a',
  roughness: 0.42,
  metalness: 0.35,
});

function lathe(
  profile: Array<[number, number]>,
  material: MeshStandardMaterial,
  segments = 48,
) {
  return createScenePrimitiveObject(
    { geometry: { type: 'lathe', profile, segments } },
    material,
  );
}

/** Walkable-looking island. Top surface sits on y = 0. */
export function createIsland(): Group {
  const root = new Group();
  root.name = 'Island';

  const disc = lathe(
    [
      [0.02, -0.55],
      [1.55, -0.42],
      [2.15, -0.18],
      [2.35, -0.02],
      [2.05, 0],
      [0.02, 0],
    ],
    grass,
    64,
  );
  disc.name = 'Hull';
  disc.castShadow = true;
  disc.receiveShadow = true;

  const rim = createScenePrimitiveObject(
    {
      geometry: {
        type: 'torus',
        radius: 1.85,
        tube: 0.045,
        radialSegments: 8,
        tubularSegments: 64,
      },
    },
    stone,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.02;
  rim.name = 'Rim';

  const arch = lathe(
    [
      [0.08, 0],
      [0.16, 0],
      [0.18, 0.12],
      [0.1, 1.15],
      [0.16, 1.35],
      [0.08, 1.42],
    ],
    stone,
    24,
  );
  arch.position.set(-1.15, 0, -0.35);
  arch.name = 'BrokenPillar';

  const rift = createScenePrimitiveObject(
    {
      geometry: {
        type: 'box',
        size: [0.06, 2.4, 0.06],
      },
    },
    new MeshStandardMaterial({
      color: '#ffd6ff',
      emissive: new Color('#ff4ad8'),
      emissiveIntensity: 1.6,
      roughness: 0.25,
    }),
  );
  rift.position.set(0.85, 1.2, -0.35);
  rift.name = 'rift';

  const bloom = createScenePrimitiveObject(
    {
      geometry: { type: 'sphere', radius: 0.16 },
    },
    new MeshStandardMaterial({
      color: '#ffe6ff',
      emissive: new Color('#ff7ae0'),
      emissiveIntensity: 1.4,
      roughness: 0.3,
    }),
  );
  bloom.position.set(0.85, 2.45, -0.35);
  bloom.scale.setScalar(0.05);
  bloom.name = 'bloom';

  const willow = createScenePrimitiveObject(
    { geometry: { type: 'cone', radius: 0.28, height: 0.9 } },
    leaf,
  );
  willow.position.set(1.45, 0.35, 0.15);
  willow.name = 'Willow';

  const islet = lathe(
    [
      [0.02, 0],
      [0.55, 0],
      [0.7, -0.18],
      [0.35, -0.42],
      [0.02, -0.48],
    ],
    stone,
    28,
  );
  islet.position.set(-1.7, 0.85, -1.15);
  islet.name = 'FarIsland';

  root.add(disc, rim, arch, rift, bloom, willow, islet);
  return root;
}

export function createSocket(): Group {
  const root = new Group();
  root.name = 'Socket';
  const cup = lathe(
    [
      [0.02, 0],
      [0.16, 0],
      [0.18, 0.04],
      [0.12, 0.16],
      [0.14, 0.2],
      [0.02, 0.2],
    ],
    stone,
    32,
  );
  cup.name = 'Cup';
  const glow = createScenePrimitiveObject(
    {
      geometry: {
        type: 'torus',
        radius: 0.13,
        tube: 0.012,
        radialSegments: 8,
        tubularSegments: 32,
      },
    },
    new MeshStandardMaterial({
      color: '#ffffff',
      emissive: new Color('#888888'),
      emissiveIntensity: 0.5,
      roughness: 0.3,
    }),
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.y = 0.205;
  glow.name = 'glow';
  const cap = createScenePrimitiveObject(
    { geometry: { type: 'cylinder', radius: 0.045, height: 0.02 } },
    gold,
  );
  cap.position.y = 0.21;
  cap.name = 'Cap';
  root.add(cup, glow, cap);
  return root;
}

export function createFragment(hex: string): Group {
  const root = new Group();
  root.name = 'Fragment';
  const core = createScenePrimitiveObject(
    { geometry: { type: 'sphere', radius: 0.07 } },
    new MeshStandardMaterial({
      color: hex,
      emissive: new Color(hex),
      emissiveIntensity: 1.2,
      roughness: 0.25,
      metalness: 0.05,
    }),
  );
  core.name = 'core';
  const ring = createScenePrimitiveObject(
    {
      geometry: {
        type: 'torus',
        radius: 0.09,
        tube: 0.008,
        radialSegments: 6,
        tubularSegments: 24,
      },
    },
    gold,
  );
  ring.rotation.x = Math.PI / 2;
  ring.name = 'Ring';
  root.add(core, ring);
  return root;
}
