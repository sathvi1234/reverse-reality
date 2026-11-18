import { createComponent, Types } from '@iwsdk/core';

export const CreationPhases = {
  Right: 'Right',
  Left: 'Left',
  Fusion: 'Fusion',
  Reveal: 'Reveal',
} as const;

export const CreationStage = createComponent('CreationStage', {
  phase: {
    type: Types.Enum,
    default: CreationPhases.Right,
    enum: CreationPhases,
  },
  rightForm: { type: Types.Int32, default: 0 },
  leftForm: { type: Types.Int32, default: 0 },
  rightReady: { type: Types.Boolean, default: false },
  leftReady: { type: Types.Boolean, default: false },
});
