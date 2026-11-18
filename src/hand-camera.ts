import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { handInput, type HandSample } from './hand-input.js';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const TIP = [4, 8, 12, 16, 20];
const PIP = [3, 6, 10, 14, 18];

let stream: MediaStream | null = null;
let running = false;
let landmarker: HandLandmarker | null = null;

function setStatus(text: string, live: boolean): void {
  handInput.status = text;
  const status = document.getElementById('camera-status');
  const lamp = document.getElementById('camera-lamp');
  if (status) status.textContent = text;
  if (lamp) lamp.dataset.live = live ? 'yes' : 'no';
}

function smooth(current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha;
}

function extendedCount(landmarks: NormalizedLandmark[]): number {
  const wrist = landmarks[0];
  if (wrist == null) return 0;
  let count = 0;
  for (let finger = 0; finger < 5; finger += 1) {
    const tip = landmarks[TIP[finger] ?? 0];
    const pip = landmarks[PIP[finger] ?? 0];
    if (tip == null || pip == null) continue;
    const tipReach = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const pipReach = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
    if (tipReach > pipReach * 1.08) count += 1;
  }
  return count;
}

function wristAngle(landmarks: NormalizedLandmark[]): number {
  const index = landmarks[5];
  const pinky = landmarks[17];
  if (index == null || pinky == null) return 0;
  return Math.atan2(pinky.y - index.y, pinky.x - index.x);
}

const HOLD_FRAMES = 12;

function applySample(sample: HandSample, landmarks: NormalizedLandmark[]): void {
  if (landmarks.length < 21) return;
  const thumb = landmarks[4];
  const indexTip = landmarks[8];
  const palm = landmarks[9];
  const wrist = landmarks[0];
  const pinchDistance =
    thumb != null && indexTip != null
      ? Math.hypot(thumb.x - indexTip.x, thumb.y - indexTip.y)
      : 1;
  const pinch = pinchDistance < 0.055;
  const extended = extendedCount(landmarks);
  const openPalm = !pinch && extended >= 4;
  const alpha = sample.missing > 4 ? 0.55 : 0.22;
  sample.present = true;
  sample.missing = 0;
  sample.pinch = pinch;
  sample.openPalm = openPalm;
  sample.extended = extended;
  sample.x = smooth(sample.x, palm?.x ?? sample.x, alpha);
  sample.y = smooth(sample.y, palm?.y ?? sample.y, alpha);
  sample.z = smooth(sample.z, wrist?.z ?? sample.z, alpha);
  sample.wrist = smooth(sample.wrist, wristAngle(landmarks), alpha);
}

function decay(sample: HandSample): void {
  if (sample.present) {
    sample.missing += 1;
    if (sample.missing > HOLD_FRAMES) {
      sample.present = false;
      sample.pinch = false;
      sample.openPalm = false;
    }
  }
}

function drawHands(
  canvas: HTMLCanvasElement,
  result: ReturnType<HandLandmarker['detectForVideo']>,
): void {
  const ctx = canvas.getContext('2d');
  if (ctx == null) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  result.landmarks.forEach((landmarks, index) => {
    const label = result.handednesses[index]?.[0]?.categoryName ?? 'Right';
    ctx.strokeStyle = label === 'Left' ? '#d46bff' : '#3ee0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const connection of HandLandmarker.HAND_CONNECTIONS) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (start == null || end == null) continue;
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    }
    ctx.stroke();
    for (const point of landmarks) {
      ctx.fillStyle = '#f4fbff';
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function stopHandCamera(): void {
  running = false;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  const video = document.getElementById('webcam');
  if (video instanceof HTMLVideoElement) video.srcObject = null;
  handInput.camera = 'off';
  handInput.handsReady = false;
  handInput.left.present = false;
  handInput.right.present = false;
  setStatus('Camera off', false);
}

export async function startHandCamera(): Promise<void> {
  if (running) return;
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('hand-overlay');
  if (!(video instanceof HTMLVideoElement) || !(canvas instanceof HTMLCanvasElement)) return;

  running = true;
  handInput.camera = 'requesting';
  setStatus('Requesting camera permission', false);

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false,
    });
  } catch (error) {
    running = false;
    const denied = error instanceof DOMException && error.name === 'NotAllowedError';
    handInput.camera = denied ? 'denied' : 'missing';
    setStatus(denied ? 'Camera permission denied' : 'No camera available', false);
    return;
  }

  video.srcObject = stream;
  await video.play();
  setStatus('Loading hand tracker', true);

  try {
    if (landmarker == null) {
      const vision = await FilesetResolver.forVisionTasks(WASM);
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    }
  } catch {
    handInput.camera = 'tracker-failed';
    setStatus('Hand tracker failed to load', false);
    return;
  }

  handInput.camera = 'live';
  setStatus('Show both hands', true);
  let lastVideoTime = -1;
  const tracker = landmarker;

  const tick = () => {
    if (!running || tracker == null) return;
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const result = tracker.detectForVideo(video, performance.now());
      drawHands(canvas, result);
      decay(handInput.left);
      decay(handInput.right);
      result.landmarks.forEach((landmarks, index) => {
        if (landmarks.length < 21) return;
        const handed = result.handednesses[index]?.[0];
        if (handed != null && handed.score < 0.5) return;
        // A front camera delivers an unmirrored frame, while MediaPipe assumes a mirrored selfie.
        // The user's right hand is therefore reported as Left.
        const reported = handed?.categoryName ?? 'Left';
        const sample = reported === 'Left' ? handInput.right : handInput.left;
        applySample(sample, landmarks);
      });
      if (handInput.left.present && handInput.right.present) handInput.handsReady = true;
      const seen = result.landmarks.length;
      const left = handInput.left.present ? 'left' : '—';
      const right = handInput.right.present ? 'right' : '—';
      setStatus(
        seen === 0 ? 'Camera live — show both hands' : `Tracking ${left} / ${right}`,
        true,
      );
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
