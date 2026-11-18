import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  Vector2,
} from '@iwsdk/core';

export const GEO_NAMES = [
  'Cube',
  'Sphere',
  'Pyramid',
  'Cone',
  'Torus',
  'Cylinder',
  'Dodecahedron',
  'Icosahedron',
  'Octahedron',
  'Tetrahedron',
  'Diamond',
  'Crystal',
  'Star',
  'Spiral',
  'Helix',
  'Geometric Flower',
  'Wireframe',
  'Polyhedron',
  'Sculpture',
] as const;

export const ORG_NAMES = [
  'Butterfly',
  'Rose',
  'Lotus',
  'Sunflower',
  'Lily',
  'Heart',
  'Leaf',
  'Tree',
  'Jellyfish',
  'Dragonfly',
  'Feather',
  'Shell',
  'Coral',
  'Mushroom',
  'Bird',
  'Fish',
  'Peacock Feather',
  'Organic Flower',
  'Flowing Sculpture',
  'Nature Form',
] as const;

const FUSION_TITLES = [
  'Crystal Butterfly',
  'Galaxy Flower',
  'Diamond Rose',
  'Celestial Heart',
  'Cosmic Tree',
  'Neon Jellyfish',
  'Aurora Lotus',
  'Quantum Peacock',
  'Eternal Bloom',
  'Crystal Dragonfly',
  'Solar Phoenix',
  'Cosmic Planet',
  'Infinity Sculpture',
  'Dreamcatcher',
  'Galactic Coral',
  'Enchanted Crystal Garden',
  'Stardust Butterfly',
  'Eternal Universe',
  'Living Geometry',
  'Aurora Wings',
  'Prism Lotus',
  'Void Rose',
  'Helix Heart',
  'Starfall Tree',
  'Lumen Shell',
  'Orbit Feather',
  'Nova Coral',
  'Sapphire Lily',
  'Chromatic Bird',
  'Pulse Mushroom',
  'Mirror Fish',
  'Spiral Sunflower',
] as const;

function mat(color: string, emissive: string, intensity: number, metal: number, rough: number, opacity = 1): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(color),
    emissive: new Color(emissive),
    emissiveIntensity: intensity,
    metalness: metal,
    roughness: rough,
    transparent: opacity < 1,
    opacity,
    side: DoubleSide,
  });
}

const cyan = () => mat('#7ee7ff', '#1468ff', 0.55, 0.72, 0.22);
const glass = () => mat('#d8fbff', '#3ec8ff', 0.9, 0.35, 0.08, 0.82);
const violet = () => mat('#e38bff', '#a020c8', 0.55, 0.18, 0.36);
const petal = () => mat('#ff7ad9', '#7a18c8', 0.45, 0.08, 0.42);
const leaf = () => mat('#c9a0ff', '#5a20a0', 0.4, 0.12, 0.48);

function mesh(geometry: ConstructorParameters<typeof Mesh>[0], material: MeshStandardMaterial): Mesh {
  const item = new Mesh(geometry, material);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function lathe(points: Array<[number, number]>, segments: number, material: MeshStandardMaterial): Mesh {
  return mesh(
    new LatheGeometry(
      points.map(([x, y]) => new Vector2(x, y)),
      segments,
    ),
    material,
  );
}

function ringOf(count: number, radius: number, build: (index: number) => Mesh): Group {
  const group = new Group();
  for (let i = 0; i < count; i += 1) {
    const item = build(i);
    const angle = (i / count) * Math.PI * 2;
    item.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    item.rotation.y = -angle;
    group.add(item);
  }
  return group;
}

export function buildGeometric(index: number): Group {
  const root = new Group();
  const form = ((index % GEO_NAMES.length) + GEO_NAMES.length) % GEO_NAMES.length;
  root.name = GEO_NAMES[form] ?? 'Cube';
  root.userData.spin = 0.4 + (form % 5) * 0.08;
  const metal = cyan();
  const crystal = glass();

  if (form === 0) root.add(mesh(new BoxGeometry(0.28, 0.28, 0.28), metal));
  if (form === 1) root.add(mesh(new SphereGeometry(0.17, 32, 24), metal));
  if (form === 2) root.add(mesh(new ConeGeometry(0.16, 0.34, 4), metal));
  if (form === 3) root.add(mesh(new ConeGeometry(0.15, 0.32, 24), metal));
  if (form === 4) root.add(mesh(new TorusGeometry(0.14, 0.045, 16, 48), metal));
  if (form === 5) root.add(mesh(new CylinderGeometry(0.11, 0.11, 0.32, 24), metal));
  if (form === 6) root.add(mesh(new DodecahedronGeometry(0.17, 0), metal));
  if (form === 7) root.add(mesh(new IcosahedronGeometry(0.18, 0), metal));
  if (form === 8) root.add(mesh(new OctahedronGeometry(0.18, 0), metal));
  if (form === 9) root.add(mesh(new TetrahedronGeometry(0.2, 0), metal));
  if (form === 10) {
    const gem = mesh(new OctahedronGeometry(0.16, 1), crystal);
    gem.scale.set(0.85, 1.35, 0.85);
    root.add(gem);
  }
  if (form === 11) {
    root.add(mesh(new OctahedronGeometry(0.1, 0), crystal));
    for (let i = 0; i < 6; i += 1) {
      const shard = mesh(new ConeGeometry(0.028, 0.22, 5), crystal);
      const angle = (i / 6) * Math.PI * 2;
      shard.position.set(Math.cos(angle) * 0.05, 0.02, Math.sin(angle) * 0.05);
      shard.rotation.z = Math.cos(angle) * 1.1;
      shard.rotation.x = Math.sin(angle) * 1.1;
      root.add(shard);
    }
  }
  if (form === 12) {
    for (let i = 0; i < 8; i += 1) {
      const point = mesh(new ConeGeometry(0.04, 0.22, 4), i % 2 === 0 ? metal : crystal);
      const angle = (i / 8) * Math.PI * 2;
      point.position.set(Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08);
      point.rotation.z = Math.PI / 2;
      point.rotation.y = -angle;
      root.add(point);
    }
    root.add(mesh(new OctahedronGeometry(0.06, 0), crystal));
  }
  if (form === 13) {
    for (let i = 0; i < 18; i += 1) {
      const bead = mesh(new SphereGeometry(0.025, 10, 8), i % 3 === 0 ? crystal : metal);
      const t = i / 18;
      const angle = t * Math.PI * 4;
      bead.position.set(Math.cos(angle) * (0.04 + t * 0.14), t * 0.22 - 0.08, Math.sin(angle) * (0.04 + t * 0.14));
      root.add(bead);
    }
  }
  if (form === 14) {
    for (let i = 0; i < 16; i += 1) {
      const rung = mesh(new TorusGeometry(0.04 + i * 0.008, 0.008, 8, 16), metal);
      rung.position.y = i * 0.018 - 0.12;
      rung.rotation.y = i * 0.4;
      root.add(rung);
    }
  }
  if (form === 15) {
    root.add(ringOf(8, 0.12, () => mesh(new ConeGeometry(0.035, 0.16, 4), metal)));
    root.children.forEach((child) => {
      child.rotation.z = 0.7;
    });
    root.add(mesh(new DodecahedronGeometry(0.05, 0), crystal));
  }
  if (form === 16) {
    const cage = mesh(new IcosahedronGeometry(0.16, 1), metal);
    const wire = cage.material;
    if (wire instanceof MeshStandardMaterial) {
      wire.wireframe = true;
      wire.emissiveIntensity = 1.1;
    }
    root.add(cage, mesh(new SphereGeometry(0.05, 16, 12), crystal));
  }
  if (form === 17) {
    root.add(mesh(new DodecahedronGeometry(0.12, 0), metal));
    root.add(mesh(new IcosahedronGeometry(0.16, 0), crystal));
    const outer = root.children[1];
    if (outer instanceof Mesh && outer.material instanceof MeshStandardMaterial) {
      outer.material.wireframe = true;
      outer.material.opacity = 0.55;
      outer.material.transparent = true;
    }
  }
  if (form === 18) {
    root.add(mesh(new TorusKnotGeometry(0.1, 0.028, 90, 10), metal));
    root.add(mesh(new OctahedronGeometry(0.06, 0), crystal));
  }
  return root;
}

function petals(count: number, radius: number, length: number, material: MeshStandardMaterial, tilt: number): Group {
  return ringOf(count, radius, () => {
    const item = lathe(
      [
        [0, 0],
        [0.04, length * 0.25],
        [0.055, length * 0.55],
        [0.02, length * 0.85],
        [0, length],
      ],
      8,
      material,
    );
    item.rotation.z = tilt;
    return item;
  });
}

export function buildOrganic(index: number): Group {
  const root = new Group();
  const form = ((index % ORG_NAMES.length) + ORG_NAMES.length) % ORG_NAMES.length;
  root.name = ORG_NAMES[form] ?? 'Butterfly';
  root.userData.spin = 0.25 + (form % 4) * 0.05;
  const bloom = petal();
  const foliage = leaf();
  const body = violet();

  if (form === 0) {
    const wing = lathe(
      [
        [0, 0],
        [0.12, 0.03],
        [0.18, 0.1],
        [0.08, 0.18],
        [0, 0.2],
      ],
      8,
      bloom,
    );
    const left = wing;
    const right = wing.clone();
    left.position.x = -0.06;
    right.position.x = 0.06;
    left.rotation.z = 0.9;
    right.rotation.z = -0.9;
    const lowerL = wing.clone();
    const lowerR = wing.clone();
    lowerL.scale.setScalar(0.65);
    lowerR.scale.setScalar(0.65);
    lowerL.position.set(-0.05, -0.08, 0);
    lowerR.position.set(0.05, -0.08, 0);
    lowerL.rotation.z = 1.2;
    lowerR.rotation.z = -1.2;
    root.add(left, right, lowerL, lowerR, mesh(new CylinderGeometry(0.012, 0.012, 0.16, 8), body));
  }
  if (form === 1) {
    root.add(petals(6, 0.05, 0.16, bloom, 0.85));
    root.add(petals(5, 0.03, 0.1, foliage, 0.5));
    const bud = mesh(new SphereGeometry(0.035, 12, 10), body);
    bud.position.y = 0.02;
    root.add(bud);
  }
  if (form === 2) {
    root.add(petals(10, 0.07, 0.14, bloom, 0.35));
    root.add(petals(8, 0.04, 0.09, foliage, 0.15));
    root.add(mesh(new SphereGeometry(0.03, 12, 10), body));
  }
  if (form === 3) {
    root.add(petals(14, 0.1, 0.16, bloom, 0.2));
    root.add(mesh(new CylinderGeometry(0.06, 0.06, 0.04, 16), foliage));
  }
  if (form === 4) {
    root.add(petals(6, 0.06, 0.22, bloom, 0.15));
    const stamen = mesh(new CylinderGeometry(0.008, 0.008, 0.12, 6), body);
    stamen.position.y = 0.08;
    root.add(stamen);
  }
  if (form === 5) {
    const lobe = lathe(
      [
        [0, -0.12],
        [0.09, -0.02],
        [0.11, 0.05],
        [0.04, 0.12],
        [0, 0.05],
      ],
      16,
      bloom,
    );
    const twin = lobe.clone();
    lobe.rotation.z = 0.35;
    twin.rotation.z = -0.35;
    lobe.position.x = -0.02;
    twin.position.x = 0.02;
    root.add(lobe, twin);
  }
  if (form === 6) {
    const blade = lathe(
      [
        [0, -0.16],
        [0.07, -0.02],
        [0.045, 0.1],
        [0.01, 0.18],
        [0, 0.2],
      ],
      6,
      foliage,
    );
    blade.rotation.z = 0.3;
    const vein = mesh(new BoxGeometry(0.008, 0.28, 0.008), body);
    root.add(blade, vein);
  }
  if (form === 7) {
    const trunk = mesh(new CylinderGeometry(0.02, 0.035, 0.28, 8), body);
    trunk.position.y = -0.02;
    root.add(trunk);
    for (let i = 0; i < 5; i += 1) {
      const crown = mesh(new ConeGeometry(0.08 - i * 0.01, 0.1, 7), foliage);
      crown.position.y = 0.08 + i * 0.06;
      root.add(crown);
    }
  }
  if (form === 8) {
    root.add(mesh(new SphereGeometry(0.07, 16, 12), bloom));
    for (let i = 0; i < 8; i += 1) {
      const tentacle = mesh(new CylinderGeometry(0.006, 0.014, 0.22, 6), body);
      const angle = (i / 8) * Math.PI * 2;
      tentacle.position.set(Math.cos(angle) * 0.04, -0.12, Math.sin(angle) * 0.04);
      tentacle.rotation.z = Math.cos(angle) * 0.4;
      root.add(tentacle);
    }
  }
  if (form === 9) {
    const wing = mesh(new BoxGeometry(0.22, 0.008, 0.06), bloom);
    const left = wing;
    const right = wing.clone();
    left.position.set(-0.12, 0.04, 0);
    right.position.set(0.12, 0.04, 0);
    const tailL = mesh(new BoxGeometry(0.16, 0.006, 0.04), foliage);
    const tailR = tailL.clone();
    tailL.position.set(-0.1, -0.04, 0);
    tailR.position.set(0.1, -0.04, 0);
    root.add(left, right, tailL, tailR, mesh(new CylinderGeometry(0.012, 0.01, 0.18, 8), body));
  }
  if (form === 10) {
    const vane = lathe(
      [
        [0, -0.18],
        [0.05, -0.04],
        [0.035, 0.08],
        [0.01, 0.16],
        [0, 0.2],
      ],
      6,
      bloom,
    );
    vane.rotation.z = -0.4;
    root.add(vane, mesh(new CylinderGeometry(0.006, 0.006, 0.32, 6), body));
  }
  if (form === 11) {
    const shell = lathe(
      [
        [0.02, -0.08],
        [0.1, -0.02],
        [0.12, 0.06],
        [0.04, 0.12],
        [0.01, 0.04],
      ],
      16,
      bloom,
    );
    shell.rotation.z = Math.PI;
    root.add(shell);
  }
  if (form === 12) {
    for (let i = 0; i < 9; i += 1) {
      const branch = mesh(new CylinderGeometry(0.01, 0.016, 0.12 + (i % 3) * 0.04, 5), i % 2 === 0 ? bloom : foliage);
      const angle = (i / 9) * Math.PI * 2;
      branch.position.set(Math.cos(angle) * 0.06, (i % 3) * 0.04, Math.sin(angle) * 0.06);
      branch.rotation.z = Math.cos(angle) * 0.8;
      root.add(branch);
    }
  }
  if (form === 13) {
    const cap = mesh(new SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), bloom);
    cap.position.y = 0.06;
    const stem = mesh(new CylinderGeometry(0.025, 0.03, 0.12, 8), foliage);
    root.add(cap, stem);
  }
  if (form === 14) {
    const wing = mesh(new ConeGeometry(0.08, 0.2, 3), bloom);
    const left = wing;
    const right = wing.clone();
    left.rotation.z = 1.4;
    right.rotation.z = -1.4;
    left.position.set(-0.08, 0.04, 0);
    right.position.set(0.08, 0.04, 0);
    root.add(left, right, mesh(new SphereGeometry(0.04, 10, 8), body));
  }
  if (form === 15) {
    const fish = mesh(new SphereGeometry(0.08, 16, 12), bloom);
    fish.scale.set(1.8, 0.7, 0.55);
    const tail = mesh(new ConeGeometry(0.06, 0.12, 3), foliage);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.16;
    root.add(fish, tail);
  }
  if (form === 16) {
    const eye = mesh(new SphereGeometry(0.035, 12, 10), cyan());
    for (let i = 0; i < 7; i += 1) {
      const barb = lathe(
        [
          [0, 0],
          [0.03 - i * 0.002, 0.06],
          [0.012, 0.14 + i * 0.01],
          [0, 0.2 + i * 0.015],
        ],
        5,
        i % 2 === 0 ? bloom : foliage,
      );
      barb.position.set(0.02, -0.02, (i - 3) * 0.012);
      barb.rotation.z = -0.5 - i * 0.05;
      root.add(barb);
    }
    root.add(eye);
  }
  if (form === 17) {
    root.add(petals(12, 0.09, 0.18, bloom, 0.55));
    root.add(petals(8, 0.05, 0.1, foliage, 0.3));
    root.add(mesh(new SphereGeometry(0.04, 12, 10), body));
  }
  if (form === 18) {
    root.add(mesh(new TorusKnotGeometry(0.09, 0.025, 80, 8), bloom));
    for (let i = 0; i < 5; i += 1) {
      const ribbon = mesh(new TorusGeometry(0.12 + i * 0.015, 0.006, 8, 24), foliage);
      ribbon.rotation.x = 0.4 + i * 0.2;
      root.add(ribbon);
    }
  }
  if (form === 19) {
    const pod = mesh(new SphereGeometry(0.08, 16, 12), bloom);
    pod.scale.y = 1.4;
    root.add(pod, petals(6, 0.1, 0.12, foliage, 1.1));
  }
  return root;
}

export function fusionName(geo: number, org: number): string {
  const slot = Math.abs(geo * 7 + org * 13) % FUSION_TITLES.length;
  return FUSION_TITLES[slot] ?? 'Living Geometry';
}

export function fusionDescription(geo: number, org: number): string {
  const geometric = GEO_NAMES[((geo % GEO_NAMES.length) + GEO_NAMES.length) % GEO_NAMES.length] ?? 'Cube';
  const organic = ORG_NAMES[((org % ORG_NAMES.length) + ORG_NAMES.length) % ORG_NAMES.length] ?? 'Butterfly';
  return `${geometric} and ${organic} fused into one form. Cyan structure carries the violet growth.`;
}

function placeCopy(source: Group, x: number, y: number, z: number, scale: number, rotY: number): Group {
  const copy = source.clone();
  copy.position.set(x, y, z);
  copy.scale.setScalar(scale);
  copy.rotation.y = rotY;
  return copy;
}

export function buildFusion(geo: number, org: number): Group {
  const root = new Group();
  root.name = fusionName(geo, org);
  const geometric = buildGeometric(geo);
  const organic = buildOrganic(org);
  geometric.scale.setScalar(0.85);
  organic.scale.setScalar(0.85);
  const kind = Math.abs(geo * 3 + org * 5) % 8;
  const halo = mesh(new TorusGeometry(0.28 + (org % 5) * 0.015, 0.012, 10, 40), glass());
  halo.rotation.x = Math.PI / (2.2 + (geo % 4) * 0.15);

  if (kind === 0) {
    root.add(placeCopy(organic, 0, 0, 0, 1, 0));
    const left = placeCopy(geometric, -0.22, 0.04, 0, 0.55, 0.4);
    const right = placeCopy(geometric, 0.22, 0.04, 0, 0.55, -0.4);
    left.rotation.z = 0.6;
    right.rotation.z = -0.6;
    root.add(left, right);
  } else if (kind === 1) {
    root.add(placeCopy(geometric, 0, 0, 0, 0.7, 0));
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const bloom = placeCopy(organic, Math.cos(angle) * 0.2, 0.02, Math.sin(angle) * 0.2, 0.38, -angle);
      bloom.rotation.z = 0.5;
      root.add(bloom);
    }
  } else if (kind === 2) {
    root.add(placeCopy(organic, 0, -0.08, 0, 0.9, 0));
    root.add(placeCopy(geometric, 0, 0.2, 0, 0.65, 0.6));
    root.add(placeCopy(geometric, 0, 0.34, 0, 0.4, 1.2));
  } else if (kind === 3) {
    const planet = placeCopy(geometric, 0, 0, 0, 0.8, 0);
    const ringA = placeCopy(organic, 0, 0, 0, 1.15, 0);
    ringA.rotation.x = Math.PI / 2.4;
    const ringB = mesh(new TorusGeometry(0.32, 0.01, 8, 36), glass());
    ringB.rotation.x = Math.PI / 3;
    root.add(planet, ringA, ringB);
  } else if (kind === 4) {
    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const angle = t * Math.PI * 3;
      const piece = placeCopy(i % 2 === 0 ? geometric : organic, Math.cos(angle) * 0.16, t * 0.36 - 0.16, Math.sin(angle) * 0.16, 0.32, angle);
      root.add(piece);
    }
  } else if (kind === 5) {
    root.add(placeCopy(geometric, 0, 0.05, 0, 0.55, 0));
    root.add(placeCopy(organic, -0.16, -0.04, 0.06, 0.55, 0.3));
    root.add(placeCopy(organic, 0.14, -0.02, -0.08, 0.48, -0.5));
    root.add(placeCopy(organic, 0.02, 0.12, 0.1, 0.4, 1));
  } else if (kind === 6) {
    const knot = mesh(new TorusKnotGeometry(0.12, 0.02, 80, 8), cyan());
    root.add(knot);
    root.add(placeCopy(organic, 0, 0.02, 0, 0.7, 0));
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2;
      root.add(placeCopy(geometric, Math.cos(angle) * 0.22, 0, Math.sin(angle) * 0.22, 0.28, angle));
    }
  } else {
    root.add(placeCopy(organic, 0, 0, 0, 1.05, 0));
    const cage = mesh(new IcosahedronGeometry(0.24, 0), glass());
    if (cage.material instanceof MeshStandardMaterial) {
      cage.material.wireframe = true;
      cage.material.emissiveIntensity = 1.2;
    }
    root.add(cage, placeCopy(geometric, 0, 0, 0, 0.45, 0.8));
  }

  root.add(halo);
  return root;
}
