import { AssetType, defineAssets } from '@iwsdk/core';
import { createAtelier } from './scene-assets/atelier.scene-asset.js';

const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

export default defineAssets({
  atelier: createAtelier(),
  'guide-panel': {
    url: publicAssetUrl('ui/guide.uikitml'),
    type: AssetType.UIKitML,
    name: 'Guide Panel',
  },
});
