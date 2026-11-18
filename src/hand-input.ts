export type HandSample = {
  present: boolean;
  pinch: boolean;
  openPalm: boolean;
  extended: number;
  x: number;
  y: number;
  z: number;
  wrist: number;
  /** Frames since this hand was last detected. */
  missing: number;
};

export type CameraState = 'off' | 'requesting' | 'live' | 'denied' | 'missing' | 'tracker-failed';

const sample = (): HandSample => ({
  present: false,
  pinch: false,
  openPalm: false,
  extended: 0,
  x: 0.5,
  y: 0.55,
  z: 0,
  wrist: 0,
  missing: 99,
});

export const handInput = {
  left: sample(),
  right: sample(),
  camera: 'off' as CameraState,
  status: 'Camera off',
  handsReady: false,
  restart: false,
  exit: false,
};
