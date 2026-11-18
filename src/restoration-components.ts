import { createComponent, Types } from '@iwsdk/core';

export const FragmentKinds = {
  Amber: 'Amber',
  Azure: 'Azure',
  Violet: 'Violet',
} as const;

export const EnergyFragment = createComponent('EnergyFragment', {
  kind: {
    type: Types.Enum,
    default: FragmentKinds.Amber,
    enum: FragmentKinds,
  },
  seated: { type: Types.Boolean, default: false },
  dock: { type: Types.Entity, default: null },
});

export const RestorationSocket = createComponent('RestorationSocket', {
  kind: {
    type: Types.Enum,
    default: FragmentKinds.Amber,
    enum: FragmentKinds,
  },
  occupant: { type: Types.Entity, default: null },
  radius: { type: Types.Float32, default: 0.28 },
  rejectUntil: { type: Types.Float32, default: 0 },
});

export const Realm = createComponent('Realm', {
  placed: { type: Types.Int32, default: 0 },
  complete: { type: Types.Boolean, default: false },
});
