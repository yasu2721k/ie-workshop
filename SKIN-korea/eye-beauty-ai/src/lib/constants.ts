// Analysis thresholds
export const BRIGHTNESS_THRESHOLD = 100;
export const CONTRAST_THRESHOLD = 50;

// Animation timings (in ms)
export const ANALYZING_DURATION = 5000;
export const ANALYZING_STEPS = [
  { time: 0, progress: 0, textKey: 'analyzing.step1' },
  { time: 1500, progress: 30, textKey: 'analyzing.step2' },
  { time: 3000, progress: 60, textKey: 'analyzing.step3' },
  { time: 4500, progress: 90, textKey: 'analyzing.complete' },
];

// Camera settings
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

// Face API model URLs
export const FACE_API_MODELS_PATH = '/models';

// Score ranges
export const MIN_SCORE = 60;
export const MAX_SCORE = 100;

// Image settings
export const RECOMMENDED_IMAGE_WIDTH = 1200;
export const RECOMMENDED_IMAGE_HEIGHT = 1600;

// LINE settings (placeholder - update with actual LINE URL)
export const LINE_FRIEND_URL = 'https://line.me/R/ti/p/@example';

// Routes
export const ROUTES = {
  HOME: '/',
  GUIDE: '/guide',
  CAMERA: '/camera',
  ANALYZING: '/analyzing',
  GATE: '/gate',
  RESULT: '/result',
} as const;
