import { createSystem, UIKitMLAsset, VisibilityState } from '@iwsdk/core';

export class PanelSystem extends createSystem({}) {
  init(): void {
    const panel = this.world.getSceneObject<UIKitMLAsset>('guide-panel');
    const intro = panel?.getElementById('intro');
    const hud = panel?.getElementById('hud');
    const beginButton = panel?.getElementById('begin-button');
    const xrButton = panel?.getElementById('xr-button');
    const hudXr = panel?.getElementById('hud-xr');
    const exitButton = panel?.getElementById('exit-button');
    if (
      intro == null ||
      hud == null ||
      beginButton == null ||
      xrButton == null ||
      hudXr == null ||
      exitButton == null
    ) {
      return;
    }

    let started = false;
    const xrEnabled = this.world.xrEnabled;

    const applyMode = (is2D: boolean) => {
      intro.setProperties({ display: started ? 'none' : 'flex' });
      hud.setProperties({ display: started ? 'flex' : 'none' });
      const showEnter = xrEnabled && is2D;
      xrButton.setProperties({ display: showEnter ? 'flex' : 'none' });
      hudXr.setProperties({ display: started && showEnter ? 'flex' : 'none' });
      exitButton.setProperties({
        display: started && !is2D ? 'flex' : 'none',
      });
    };

    const startPlay = () => {
      started = true;
      const is2D = this.world.visibilityState.peek() === VisibilityState.NonImmersive;
      applyMode(is2D);
    };

    const launchXR = () => {
      startPlay();
      this.world.launchXR();
    };
    const exitXR = () => this.world.exitXR();
    const onBegin = () => startPlay();

    beginButton.addEventListener('click', onBegin);
    xrButton.addEventListener('click', launchXR);
    hudXr.addEventListener('click', launchXR);
    exitButton.addEventListener('click', exitXR);
    this.cleanupFuncs.push(
      () => beginButton.removeEventListener('click', onBegin),
      () => xrButton.removeEventListener('click', launchXR),
      () => hudXr.removeEventListener('click', launchXR),
      () => exitButton.removeEventListener('click', exitXR),
      this.world.visibilityState.subscribe((visibilityState) => {
        applyMode(visibilityState === VisibilityState.NonImmersive);
      }),
    );
    applyMode(this.world.visibilityState.peek() === VisibilityState.NonImmersive);
  }
}
