import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { CreationSystem } from './creation.js';
import { startHandCamera, stopHandCamera } from './hand-camera.js';
import { handInput } from './hand-input.js';
import { startLandingHero, stopLandingHero } from './landing-hero.js';
import { PanelSystem } from './panel.js';
import './story-studio.js';

const landing = document.getElementById('landing');
const gameUi = document.getElementById('game-ui');
const intro = document.getElementById('intro-overlay');
const hero = document.getElementById('hero-canvas');

function showLanding(): void {
  document.body.dataset.mode = 'landing';
  landing?.classList.remove('is-hidden');
  gameUi?.setAttribute('hidden', '');
  intro?.setAttribute('hidden', '');
  stopHandCamera();
  if (hero instanceof HTMLCanvasElement) startLandingHero(hero);
}

async function startExperience(): Promise<void> {
  landing?.classList.add('is-leaving');
  intro?.removeAttribute('hidden');
  const copy = document.getElementById('intro-copy');
  if (copy) copy.textContent = 'Two hands. Two forms. One creation.';
  window.setTimeout(() => {
    landing?.classList.add('is-hidden');
    stopLandingHero();
    document.body.dataset.mode = 'play';
    gameUi?.removeAttribute('hidden');
  }, 700);
  await startHandCamera();
  if (handInput.camera === 'denied' || handInput.camera === 'missing' || handInput.camera === 'tracker-failed') {
    intro?.removeAttribute('hidden');
    if (copy) copy.textContent = handInput.status;
    document.getElementById('camera-retry')?.removeAttribute('hidden');
  } else {
    window.setTimeout(() => intro?.setAttribute('hidden', ''), 1400);
  }
}

document.querySelectorAll('[data-start]').forEach((button) => {
  button.addEventListener('click', () => {
    void startExperience();
  });
});

document.getElementById('camera-retry')?.addEventListener('click', () => {
  document.getElementById('camera-retry')?.setAttribute('hidden', '');
  void startHandCamera().then(() => {
    if (handInput.camera === 'live') intro?.setAttribute('hidden', '');
    else document.getElementById('camera-retry')?.removeAttribute('hidden');
  });
});

document.getElementById('restart-game')?.addEventListener('click', () => {
  handInput.restart = true;
});

function leaveToHome(): void {
  document.getElementById('finale-screen')?.setAttribute('hidden', '');
  handInput.exit = true;
  handInput.restart = true;
  showLanding();
}

document.getElementById('exit-landing')?.addEventListener('click', leaveToHome);
document.getElementById('back-home')?.addEventListener('click', leaveToHome);
document.getElementById('create-again')?.addEventListener('click', () => {
  document.getElementById('finale-screen')?.setAttribute('hidden', '');
  handInput.restart = true;
});
document.getElementById('save-creation')?.addEventListener('click', () => {
  const name = document.getElementById('finale-name')?.textContent ?? 'Masterpiece';
  const description = document.getElementById('finale-blurb')?.textContent ?? '';
  const payload = {
    name,
    description,
    savedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll('[data-scroll]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = link.getAttribute('data-scroll');
    if (target == null) return;
    event.preventDefault();
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  });
});

showLanding();

World.create(document.getElementById('scene-container') as HTMLDivElement, projectOptions).then((world) => {
  world.registerSystem(PanelSystem);
  world.registerSystem(CreationSystem);
});
