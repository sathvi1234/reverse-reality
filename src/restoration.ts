import {
  Color,
  createSystem,
  Entity,
  Grabbed,
  Mesh,
  MeshStandardMaterial,
  UIKit,
  UIKitMLAsset,
  Vector3,
} from '@iwsdk/core';
import { handInput } from './hand-input.js';
import {
  EnergyFragment,
  FragmentKinds,
  Realm,
  RestorationSocket,
} from './restoration-components.js';

function kindColor(kind: string): string {
  switch (kind) {
    case FragmentKinds.Amber:
      return '#ffb020';
    case FragmentKinds.Azure:
      return '#3ec6ff';
    case FragmentKinds.Violet:
      return '#c07bff';
    default:
      return '#ffb020';
  }
}

function tintGlow(entity: Entity, hex: string, intensity: number): void {
  const glow = entity.object3D?.getObjectByName('glow');
  if (!(glow instanceof Mesh)) return;
  const material = glow.material;
  if (!(material instanceof MeshStandardMaterial)) return;
  material.emissive.set(hex);
  material.emissiveIntensity = intensity;
}

function cloneNamedMaterial(entity: Entity, name: string): void {
  const object = entity.object3D?.getObjectByName(name);
  if (!(object instanceof Mesh)) return;
  const material = object.material;
  if (material instanceof MeshStandardMaterial) {
    object.material = material.clone();
  }
}

export class RestorationSystem extends createSystem({
  fragments: { required: [EnergyFragment] },
  held: { required: [EnergyFragment, Grabbed] },
  free: { required: [EnergyFragment], excluded: [Grabbed] },
  sockets: { required: [RestorationSocket] },
  realm: { required: [Realm] },
}) {
  private fragmentPos = new Vector3();
  private socketPos = new Vector3();
  private red = new Color('#ff4d4d');
  private progress!: UIKit.Text;
  private complete!: UIKit.Text;
  private amber!: UIKit.Text;
  private azure!: UIKit.Text;
  private violet!: UIKit.Text;
  private rift: Mesh | null = null;
  private bloom: Mesh | null = null;
  private now = 0;
  private carried: Entity | null = null;
  private wasPinch = false;
  private score = 0;
  private homes = new Map<Entity, Vector3>();
  private cursor = new Vector3();

  init(): void {
    const panel = this.world.getSceneObject<UIKitMLAsset>('guide-panel');
    const progress = panel?.getElementById<UIKit.Text>('progress');
    const complete = panel?.getElementById<UIKit.Text>('complete');
    const amber = panel?.getElementById<UIKit.Text>('ind-amber');
    const azure = panel?.getElementById<UIKit.Text>('ind-azure');
    const violet = panel?.getElementById<UIKit.Text>('ind-violet');
    if (
      progress == null ||
      complete == null ||
      amber == null ||
      azure == null ||
      violet == null
    ) {
      return;
    }
    this.progress = progress;
    this.complete = complete;
    this.amber = amber;
    this.azure = azure;
    this.violet = violet;
    progress.name = 'progress';
    complete.name = 'complete';

    const island = this.world.getSceneObject('island');
    const rift = island?.getObjectByName('rift');
    const bloom = island?.getObjectByName('bloom');
    this.rift = rift instanceof Mesh ? rift : null;
    this.bloom = bloom instanceof Mesh ? bloom : null;

    const onFragment = (entity: Entity) => {
      cloneNamedMaterial(entity, 'core');
      const object = entity.object3D;
      if (object != null && !this.homes.has(entity)) {
        this.homes.set(entity, object.position.clone());
      }
    };
    const onSocket = (entity: Entity) => {
      cloneNamedMaterial(entity, 'glow');
      const kind = entity.getValue(RestorationSocket, 'kind') ?? FragmentKinds.Amber;
      tintGlow(entity, kindColor(kind), 0.45);
    };
    const onGrab = (entity: Entity) => {
      if (!entity.getValue(EnergyFragment, 'seated')) return;
      const dock = entity.getValue(EnergyFragment, 'dock');
      entity.setValue(EnergyFragment, 'seated', false);
      entity.setValue(EnergyFragment, 'dock', null);
      if (dock != null) {
        dock.setValue(RestorationSocket, 'occupant', null);
      }
      this.publishProgress();
    };
    const onRelease = (entity: Entity) => this.trySeat(entity);

    this.cleanupFuncs.push(
      this.queries.fragments.subscribe('qualify', onFragment),
      this.queries.sockets.subscribe('qualify', onSocket),
      this.queries.held.subscribe('qualify', onGrab),
      this.queries.free.subscribe('qualify', onRelease),
    );
    this.publishProgress();
  }

  update(_delta: number, time: number): void {
    this.now = time;
    for (const socket of this.queries.sockets.entities) {
      const until = socket.getValue(RestorationSocket, 'rejectUntil') ?? 0;
      const kind = socket.getValue(RestorationSocket, 'kind') ?? FragmentKinds.Amber;
      const occupied = socket.getValue(RestorationSocket, 'occupant') != null;
      if (time < until) {
        tintGlow(socket, '#ff4d4d', 1.6);
      } else if (occupied) {
        tintGlow(socket, kindColor(kind), 2.2);
      } else {
        tintGlow(socket, kindColor(kind), 0.45);
      }
    }

    for (const fragment of this.queries.fragments.entities) {
      const seated = fragment.getValue(EnergyFragment, 'seated');
      const object = fragment.object3D;
      if (object == null) continue;
      if (seated) {
        const dock = fragment.getValue(EnergyFragment, 'dock');
        const dockObject = dock?.object3D;
        if (dockObject != null) {
          dockObject.getWorldPosition(this.socketPos);
          object.parent?.worldToLocal(this.socketPos);
          object.position.copy(this.socketPos);
          object.position.y += 0.22;
        }
        continue;
      }
      if (this.queries.held.entities.has(fragment)) continue;
    }

    const placed = this.countPlaced();
    const realm = this.queries.realm.entities.values().next().value as
      | Entity
      | undefined;
    if (realm != null) {
      const shown = realm.getValue(Realm, 'placed') ?? 0;
      if (shown !== placed) this.publishProgress();
    }
    const open = 1 - placed / 3;
    if (this.rift != null) this.rift.scale.setScalar(Math.max(0.04, open));
    if (this.bloom != null) {
      const grown = 0.05 + (placed / 3) * 0.95;
      this.bloom.scale.setScalar(grown);
      this.bloom.rotation.y = time * 0.4;
    }
    this.driveHand();
    void this.red;
  }

  private driveHand(): void {
    const readout = document.getElementById('gesture-readout');
    if (readout != null) {
      readout.textContent = handInput.right.present
        ? `right ${handInput.right.pinch ? 'pinch' : 'open palm'}`
        : 'No hand';
    }
    if (handInput.restart) {
      handInput.restart = false;
      this.resetCrystals();
    }
    if (!handInput.right.present) {
      this.wasPinch = false;
      return;
    }
    this.cursor.set((0.5 - handInput.right.x) * 1.2, 0.7 + (1 - handInput.right.y) * 0.8, -0.9);
    if (handInput.right.pinch && !this.wasPinch) {
      this.carried = this.nearestFragment();
      if (this.carried?.getValue(EnergyFragment, 'seated')) {
        const dock = this.carried.getValue(EnergyFragment, 'dock');
        this.carried.setValue(EnergyFragment, 'seated', false);
        this.carried.setValue(EnergyFragment, 'dock', null);
        dock?.setValue(RestorationSocket, 'occupant', null);
      }
    }
    if (
      handInput.right.pinch &&
      this.carried != null &&
      !this.queries.held.entities.has(this.carried)
    ) {
      this.carried.object3D?.position.copy(this.cursor);
    }
    if (!handInput.right.pinch && this.wasPinch && this.carried != null) {
      this.trySeat(this.carried);
      this.carried = null;
    }
    this.wasPinch = handInput.right.pinch;
  }

  private nearestFragment(): Entity | null {
    let best: Entity | null = null;
    let bestDistance = 0.45;
    for (const fragment of this.queries.fragments.entities) {
      const object = fragment.object3D;
      if (object == null) continue;
      object.getWorldPosition(this.fragmentPos);
      const distance = this.fragmentPos.distanceTo(this.cursor);
      if (distance < bestDistance) {
        best = fragment;
        bestDistance = distance;
      }
    }
    return best;
  }

  private resetCrystals(): void {
    this.score = 0;
    this.carried = null;
    for (const fragment of this.queries.fragments.entities) {
      fragment.setValue(EnergyFragment, 'seated', false);
      fragment.setValue(EnergyFragment, 'dock', null);
      const home = this.homes.get(fragment);
      if (home != null) fragment.object3D?.position.copy(home);
    }
    for (const socket of this.queries.sockets.entities) {
      socket.setValue(RestorationSocket, 'occupant', null);
    }
    this.publishProgress();
  }

  private countPlaced(): number {
    let placed = 0;
    for (const fragment of this.queries.fragments.entities) {
      if (fragment.getValue(EnergyFragment, 'seated')) placed += 1;
    }
    return placed;
  }

  private publishProgress(): void {
    const placed = this.countPlaced();
    const complete = placed >= 3;
    for (const realm of this.queries.realm.entities) {
      realm.setValue(Realm, 'placed', placed);
      realm.setValue(Realm, 'complete', complete);
    }
    this.progress?.setProperties({ text: `${placed} / 3 CRYSTALS RESTORED` });
    this.complete?.setProperties({ display: complete ? 'flex' : 'none' });
    const seated = new Set<string>();
    for (const fragment of this.queries.fragments.entities) {
      if (fragment.getValue(EnergyFragment, 'seated')) {
        seated.add(fragment.getValue(EnergyFragment, 'kind') ?? '');
      }
    }
    this.paintChip(this.amber, seated.has(FragmentKinds.Amber), '#ffb020');
    this.paintChip(this.azure, seated.has(FragmentKinds.Azure), '#3ec6ff');
    this.paintChip(this.violet, seated.has(FragmentKinds.Violet), '#c07bff');
    const score = document.getElementById('score');
    const progress = document.getElementById('hud-progress');
    const mission = document.getElementById('mission');
    if (score) score.textContent = String(this.score);
    if (progress) progress.textContent = `${placed} / 3`;
    if (mission) {
      mission.textContent = complete
        ? 'World restored'
        : 'Place the three crystals';
    }
  }

  private paintChip(chip: UIKit.Text | undefined, filled: boolean, hex: string): void {
    chip?.setProperties({
      backgroundColor: filled ? hex : '#2a2d33',
      color: filled ? '#1c1d20' : '#fafaf7',
    });
  }

  private trySeat(entity: Entity): void {
    if (entity.getValue(EnergyFragment, 'seated')) return;
    const object = entity.object3D;
    if (object == null) return;
    object.getWorldPosition(this.fragmentPos);
    const kind = entity.getValue(EnergyFragment, 'kind') ?? FragmentKinds.Amber;

    let best: Entity | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const socket of this.queries.sockets.entities) {
      const socketObject = socket.object3D;
      if (socketObject == null) continue;
      socketObject.getWorldPosition(this.socketPos);
      const distance = this.fragmentPos.distanceTo(this.socketPos);
      const radius = socket.getValue(RestorationSocket, 'radius') ?? 0.28;
      if (distance < radius && distance < bestDistance) {
        best = socket;
        bestDistance = distance;
      }
    }
    if (best == null) return;

    const socketKind = best.getValue(RestorationSocket, 'kind') ?? FragmentKinds.Amber;
    const occupant = best.getValue(RestorationSocket, 'occupant');
    if (socketKind !== kind || (occupant != null && occupant !== entity)) {
      best.setValue(RestorationSocket, 'rejectUntil', this.now + 0.45);
      const mission = document.getElementById('mission');
      if (mission) mission.textContent = 'Wrong socket';
      return;
    }

    best.setValue(RestorationSocket, 'occupant', entity);
    entity.setValue(EnergyFragment, 'seated', true);
    entity.setValue(EnergyFragment, 'dock', best);
    const core = object.getObjectByName('core');
    if (core instanceof Mesh && core.material instanceof MeshStandardMaterial) {
      core.material.emissiveIntensity = 2.4;
    }
    this.score += 100;
    this.publishProgress();
  }
}
