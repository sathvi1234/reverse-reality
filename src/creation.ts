import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  createSystem,
  Float32BufferAttribute,
  Group,
  PointLight,
  Points,
  PointsMaterial,
  type Entity,
} from '@iwsdk/core';
import { CreationPhases, CreationStage } from './creation-components.js';
import { handInput, type HandSample } from './hand-input.js';
import { requestAi } from './ai-client.js';
import {
  buildFusion,
  buildGeometric,
  buildOrganic,
  fusionDescription,
  fusionName,
  GEO_NAMES,
  ORG_NAMES,
} from './shapes.js';

const CENTER_Y = 1.18;
const CENTER_Z = -1.02;
const FORM_SCALE = 2.35;
const FUSION_SCALE = 2.7;
const CLOSE_DISTANCE = 0.2;
const CLOSE_HOLD = 0.42;

type Side = 'left' | 'right';

export class CreationSystem extends createSystem({
  stage: { required: [CreationStage] },
}) {
  private root!: Group;
  private rightForm!: Group;
  private leftForm!: Group;
  private fusion!: Group;
  private particles!: Points;
  private particlePositions!: Float32Array;
  private wasPinch = { left: false, right: false };
  private spin = 0;
  private time = 0;
  private builtRight = -1;
  private builtLeft = -1;
  private pendingRight = 0;
  private pendingLeft = 0;
  private previewRight!: Group;
  private previewLeft!: Group;
  private closeHold = 0;
  private merging = false;
  private mergeT = 0;
  private revealed = false;
  private stageEntity: Entity | null = null;

  init(): void {
    const host = this.world.getSceneObject('atelier');
    this.root = new Group();
    this.root.name = 'CreationRoot';
    host?.add(this.root);
    this.rightForm = new Group();
    this.leftForm = new Group();
    this.previewRight = new Group();
    this.previewLeft = new Group();
    this.previewRight.position.set(0, 0.42, 0);
    this.previewLeft.position.set(0, 0.42, 0);
    this.previewRight.scale.setScalar(0.28);
    this.previewLeft.scale.setScalar(0.28);
    this.rightForm.add(this.previewRight);
    this.leftForm.add(this.previewLeft);
    this.fusion = new Group();
    this.fusion.visible = false;
    this.root.add(this.rightForm, this.leftForm, this.fusion);
    const cyan = new PointLight(new Color('#3ec8ff'), 8, 6, 2);
    const violet = new PointLight(new Color('#b44cff'), 8, 6, 2);
    cyan.position.set(0.4, 1.4, -0.4);
    violet.position.set(-0.4, 1.4, -0.4);
    this.root.add(cyan, violet);
    this.particlePositions = new Float32Array(360);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(this.particlePositions, 3));
    this.particles = new Points(
      geometry,
      new PointsMaterial({
        color: new Color('#f2d2ff'),
        size: 0.045,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.particles.frustumCulled = false;
    this.particles.visible = false;
    this.root.add(this.particles);
    this.stageEntity = this.queries.stage.entities.values().next().value ?? null;
    this.rebuild('right', 0);
    this.rebuild('left', 0);
    this.rightForm.position.set(0.55, CENTER_Y, CENTER_Z);
    this.leftForm.position.set(-0.55, CENTER_Y, CENTER_Z);
    this.syncHud();
  }

  private text(id: string, value: string): void {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  private showFinale(name: string, description: string): void {
    const screen = document.getElementById('finale-screen');
    screen?.removeAttribute('hidden');
    this.text('finale-name', name);
    this.text('finale-blurb', description);
    this.text('finale-parents', description);
    this.text('masterpiece-name', name);
  }

  private hideFinale(): void {
    document.getElementById('finale-screen')?.setAttribute('hidden', '');
    this.text('finale-name', '');
    this.text('finale-blurb', '');
    this.text('finale-parents', '');
    this.text('masterpiece-name', '');
  }

  private syncHud(): void {
    const entity = this.stageEntity;
    if (entity == null) return;
    const phase = entity.getValue(CreationStage, 'phase') ?? CreationPhases.Fusion;
    const rightForm = entity.getValue(CreationStage, 'rightForm') ?? 0;
    const leftForm = entity.getValue(CreationStage, 'leftForm') ?? 0;
    const tracking = handInput.handsReady ? 'Both hands tracked' : 'Show both hands';
    this.text('level-readout', phase === CreationPhases.Reveal ? 'Masterpiece' : 'Two-hand fusion');
    this.text('objective', phase === CreationPhases.Reveal ? 'Your creation is complete' : tracking);
    const rightName = GEO_NAMES[rightForm] ?? 'Cube';
    const leftName = ORG_NAMES[leftForm] ?? 'Butterfly';
    const rightNext = GEO_NAMES[this.pendingRight] ?? rightName;
    const leftNext = ORG_NAMES[this.pendingLeft] ?? leftName;
    this.text('right-status', rightNext === rightName ? `Geometric · ${rightName}` : `${rightName} → ${rightNext}`);
    this.text('left-status', leftNext === leftName ? `Organic · ${leftName}` : `${leftName} → ${leftNext}`);
    this.text(
      'fusion-status',
      phase === CreationPhases.Reveal ? 'Complete' : this.merging ? 'Fusing' : 'Bring hands together',
    );
    this.text(
      'gesture-readout',
      phase === CreationPhases.Reveal
        ? 'The masterpiece is frozen at the center.'
        : 'Pinch to cycle. Open palm to confirm. Bring both hands together to fuse.',
    );
    if (phase !== CreationPhases.Reveal) this.text('masterpiece-name', '');
  }

  private fillPreview(side: Side, index: number): void {
    const preview = side === 'right' ? this.previewRight : this.previewLeft;
    preview.clear();
    preview.add(side === 'right' ? buildGeometric(index) : buildOrganic(index));
  }

  private rebuild(side: Side, index: number): void {
    const parent = side === 'right' ? this.rightForm : this.leftForm;
    const preview = side === 'right' ? this.previewRight : this.previewLeft;
    parent.clear();
    parent.add(side === 'right' ? buildGeometric(index) : buildOrganic(index));
    parent.add(preview);
    parent.scale.setScalar(FORM_SCALE);
    if (side === 'right') this.builtRight = index;
    else this.builtLeft = index;
    this.fillPreview(side, side === 'right' ? this.pendingRight : this.pendingLeft);
  }

  private follow(sample: HandSample, group: Group, idleX: number): void {
    const idleY = CENTER_Y + Math.sin(this.time * 1.15 + idleX * 4) * 0.07;
    if (!sample.present) {
      group.position.x += (idleX - group.position.x) * 0.08;
      group.position.y += (idleY - group.position.y) * 0.08;
      group.position.z += (CENTER_Z - group.position.z) * 0.08;
      group.rotation.y += 0.006;
      return;
    }
    const mirrored = 1 - sample.x;
    const x = (mirrored - 0.5) * 1.85;
    const y = 1.55 - sample.y * 0.9;
    const z = CENTER_Z + sample.z * 0.45;
    group.position.x += (x - group.position.x) * 0.28;
    group.position.y += (y - group.position.y) * 0.28;
    group.position.z += (z - group.position.z) * 0.28;
    group.rotation.y += (sample.wrist * 0.35 - group.rotation.y) * 0.12;
    group.rotation.x = Math.sin(this.time * 0.8 + idleX) * 0.08;
  }

  private streamParticles(pull: number): void {
    const count = 120;
    for (let i = 0; i < count; i += 1) {
      const t = (i / count + this.spin * 0.15) % 1;
      const o = i * 3;
      const x = this.leftForm.position.x + (this.rightForm.position.x - this.leftForm.position.x) * t;
      const y = this.leftForm.position.y + (this.rightForm.position.y - this.leftForm.position.y) * t;
      const swirl = (i % 2 === 0 ? 1 : -1) * (0.04 + pull * 0.12);
      this.particlePositions[o] = x + Math.cos(this.spin * 3 + i) * swirl;
      this.particlePositions[o + 1] = y + Math.sin(this.spin * 2 + i) * swirl;
      this.particlePositions[o + 2] = CENTER_Z + Math.sin(this.spin + i * 0.2) * 0.08;
    }
    const position = this.particles.geometry.attributes.position;
    if (position != null) position.needsUpdate = true;
  }

  private resetForms(): void {
    this.fusion.clear();
    this.fusion.visible = false;
    this.rightForm.visible = true;
    this.leftForm.visible = true;
    this.rightForm.scale.setScalar(FORM_SCALE);
    this.leftForm.scale.setScalar(FORM_SCALE);
    this.builtRight = -1;
    this.builtLeft = -1;
    this.pendingRight = 0;
    this.pendingLeft = 0;
    this.closeHold = 0;
    this.merging = false;
    this.mergeT = 0;
    this.revealed = false;
    this.particles.visible = false;
    this.hideFinale();
    const entity = this.stageEntity;
    if (entity == null) return;
    entity.setValue(CreationStage, 'phase', CreationPhases.Fusion);
    entity.setValue(CreationStage, 'rightForm', 0);
    entity.setValue(CreationStage, 'leftForm', 0);
    entity.setValue(CreationStage, 'rightReady', true);
    entity.setValue(CreationStage, 'leftReady', true);
  }

  private beginFusion(entity: Entity): void {
    this.merging = true;
    this.mergeT = 0;
    this.fusion.clear();
    this.fusion.add(
      buildFusion(
        entity.getValue(CreationStage, 'rightForm') ?? 0,
        entity.getValue(CreationStage, 'leftForm') ?? 0,
      ),
    );
    this.fusion.visible = true;
    this.fusion.position.set(0, CENTER_Y, CENTER_Z);
    this.fusion.scale.setScalar(0.15);
    this.particles.visible = true;
  }

  private finishFusion(entity: Entity): void {
    const rightForm = entity.getValue(CreationStage, 'rightForm') ?? 0;
    const leftForm = entity.getValue(CreationStage, 'leftForm') ?? 0;
    entity.setValue(CreationStage, 'phase', CreationPhases.Reveal);
    entity.setValue(CreationStage, 'rightReady', true);
    entity.setValue(CreationStage, 'leftReady', true);
    this.rightForm.visible = false;
    this.leftForm.visible = false;
    this.fusion.position.set(0, CENTER_Y, CENTER_Z);
    this.fusion.scale.setScalar(FUSION_SCALE);
    this.revealed = true;
    const geometric = GEO_NAMES[rightForm] ?? 'Cube';
    const organic = ORG_NAMES[leftForm] ?? 'Butterfly';
    this.showFinale(fusionName(rightForm, leftForm), fusionDescription(rightForm, leftForm));
    void requestAi('masterpiece', { geometric, organic })
      .then((result) => {
        const name = typeof result.name === 'string' ? result.name : fusionName(rightForm, leftForm);
        const description = typeof result.description === 'string' ? result.description : fusionDescription(rightForm, leftForm);
        this.showFinale(name, description);
      })
      .catch(() => undefined);
  }

  update(delta: number): void {
    if (this.stageEntity == null) {
      this.stageEntity = this.queries.stage.entities.values().next().value ?? null;
    }
    const entity = this.stageEntity;
    if (entity == null) return;
    this.time += delta;
    this.spin += delta;
    if (handInput.restart) {
      handInput.restart = false;
      this.resetForms();
    }

    const phase = entity.getValue(CreationStage, 'phase') ?? CreationPhases.Fusion;
    const right = handInput.right;
    const left = handInput.left;
    if (left.present && right.present) handInput.handsReady = true;

    if (phase !== CreationPhases.Reveal && !this.merging) {
      if (entity.getValue(CreationStage, 'phase') !== CreationPhases.Fusion) {
        entity.setValue(CreationStage, 'phase', CreationPhases.Fusion);
      }
      if (right.present && right.pinch && !this.wasPinch.right) {
        const step = Math.max(1, right.extended);
        this.pendingRight = (this.pendingRight + step) % GEO_NAMES.length;
        this.fillPreview('right', this.pendingRight);
        this.rightForm.scale.setScalar(FORM_SCALE * 1.08);
      }
      if (left.present && left.pinch && !this.wasPinch.left) {
        const step = Math.max(1, left.extended);
        this.pendingLeft = (this.pendingLeft + step) % ORG_NAMES.length;
        this.fillPreview('left', this.pendingLeft);
        this.leftForm.scale.setScalar(FORM_SCALE * 1.08);
      }
      if (right.present && right.openPalm && this.pendingRight !== (entity.getValue(CreationStage, 'rightForm') ?? 0)) {
        entity.setValue(CreationStage, 'rightForm', this.pendingRight);
      }
      if (left.present && left.openPalm && this.pendingLeft !== (entity.getValue(CreationStage, 'leftForm') ?? 0)) {
        entity.setValue(CreationStage, 'leftForm', this.pendingLeft);
      }
      const rightForm = entity.getValue(CreationStage, 'rightForm') ?? 0;
      const leftForm = entity.getValue(CreationStage, 'leftForm') ?? 0;
      if (rightForm !== this.builtRight) this.rebuild('right', rightForm);
      if (leftForm !== this.builtLeft) this.rebuild('left', leftForm);
      this.follow(right, this.rightForm, 0.62);
      this.follow(left, this.leftForm, -0.62);

      if (left.present && right.present) {
        const distance = Math.hypot(left.x - right.x, left.y - right.y);
        const pull = Math.max(0, 1 - distance / 0.55);
        this.rightForm.position.x += (0.18 - this.rightForm.position.x) * pull * 0.15;
        this.leftForm.position.x += (-0.18 - this.leftForm.position.x) * pull * 0.15;
        this.particles.visible = pull > 0.15;
        if (this.particles.visible) this.streamParticles(pull);
        if (distance < CLOSE_DISTANCE) this.closeHold += delta;
        else this.closeHold = 0;
        if (this.closeHold >= CLOSE_HOLD) this.beginFusion(entity);
      } else {
        this.closeHold = 0;
        this.particles.visible = false;
      }
    }

    if (this.merging && !this.revealed) {
      this.mergeT += delta / 1.5;
      const reveal = Math.min(1, this.mergeT);
      const ease = reveal * reveal * (3 - 2 * reveal);
      this.rightForm.position.x += (0 - this.rightForm.position.x) * 0.12;
      this.leftForm.position.x += (0 - this.leftForm.position.x) * 0.12;
      this.rightForm.position.y += (CENTER_Y - this.rightForm.position.y) * 0.12;
      this.leftForm.position.y += (CENTER_Y - this.leftForm.position.y) * 0.12;
      this.rightForm.scale.setScalar(FORM_SCALE * (1 - ease));
      this.leftForm.scale.setScalar(FORM_SCALE * (1 - ease));
      this.fusion.position.set(0, CENTER_Y, CENTER_Z);
      this.fusion.scale.setScalar(0.2 + ease * (FUSION_SCALE - 0.2));
      this.fusion.rotation.y = this.spin * (1.4 - ease);
      this.streamParticles(1);
      if (reveal >= 1) this.finishFusion(entity);
    }

    if (this.revealed) {
      this.fusion.position.set(0, CENTER_Y + Math.sin(this.time * 0.7) * 0.03, CENTER_Z);
      this.fusion.rotation.y += delta * 0.25;
      this.streamParticles(0.4);
    }

    this.wasPinch.left = left.pinch && left.present;
    this.wasPinch.right = right.pinch && right.present;
    this.syncHud();
  }
}
