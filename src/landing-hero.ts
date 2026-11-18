import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  TorusGeometry,
  WebGLRenderer,
} from '@iwsdk/core';

let frame = 0;
let running = false;

export function startLandingHero(canvas: HTMLCanvasElement): void {
  if (running) return;
  running = true;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 20);
  camera.position.set(0.4, 0.35, 2.4);
  scene.add(new AmbientLight(0x6677aa, 0.6));
  const key = new DirectionalLight(0xc8f6ff, 2.2);
  key.position.set(2, 3, 2);
  scene.add(key);
  const violet = new PointLight(0xc45cff, 8, 6);
  violet.position.set(-1.2, 0.4, 1);
  scene.add(violet);

  const crystal = new MeshStandardMaterial({
    color: new Color('#9aefff'),
    emissive: new Color('#2a6cff'),
    emissiveIntensity: 0.7,
    metalness: 0.65,
    roughness: 0.18,
  });
  const bloom = new MeshStandardMaterial({
    color: new Color('#f0b6ff'),
    emissive: new Color('#c040e8'),
    emissiveIntensity: 0.65,
    metalness: 0.25,
    roughness: 0.3,
  });
  const sculpture = new Group();
  const core = new Mesh(new IcosahedronGeometry(0.48, 1), crystal);
  const ring = new Mesh(new TorusGeometry(0.92, 0.028, 16, 96), bloom);
  const ringB = new Mesh(new TorusGeometry(0.68, 0.016, 12, 80), crystal);
  ring.rotation.x = Math.PI / 2.4;
  ringB.rotation.x = Math.PI / 3.2;
  sculpture.add(core, ring, ringB);
  const orbit = new Group();
  for (let i = 0; i < 8; i += 1) {
    const shard = new Mesh(new IcosahedronGeometry(i % 2 === 0 ? 0.07 : 0.045, 0), i % 2 === 0 ? crystal : bloom);
    const angle = (i / 8) * Math.PI * 2;
    shard.position.set(Math.cos(angle) * 1.15, Math.sin(angle * 2) * 0.18, Math.sin(angle) * 1.15);
    orbit.add(shard);
  }
  sculpture.add(orbit);
  const count = 80;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 3.2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
  }
  const dust = new Points(
    new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3)),
    new PointsMaterial({
      color: new Color('#b7f4ff'),
      size: 0.018,
      transparent: true,
      opacity: 0.75,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(sculpture, dust);

  const resize = () => {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 640;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };
  resize();

  const tick = (time: number) => {
    if (!running) {
      renderer.dispose();
      return;
    }
    frame = requestAnimationFrame(tick);
    const t = time * 0.001;
    sculpture.rotation.y = t * 0.35;
    sculpture.rotation.x = Math.sin(t * 0.4) * 0.15;
    ring.rotation.z = t * 0.5;
    core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    dust.rotation.y = t * 0.08;
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);
  window.addEventListener('resize', resize);
}

export function stopLandingHero(): void {
  running = false;
  cancelAnimationFrame(frame);
}
