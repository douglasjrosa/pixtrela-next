/** Euclidean distance below this means faces match (1:1). */
export const FACE_MATCH_DISTANCE_THRESHOLD = 0.55;

/** Frames to sample during a verification attempt. */
export const FACE_VERIFY_FRAME_COUNT = 8;

/** Minimum matching frames required to accept identity. */
export const FACE_VERIFY_MIN_MATCHING_FRAMES = 3;

/** Max time waiting for a successful match (ms). */
export const FACE_VERIFY_TIMEOUT_MS = 12_000;

/** Delay between frame samples (ms). */
export const FACE_VERIFY_THROTTLE_MS = 250;

/** TinyFaceDetector input size (lower = faster on tablets). */
export const FACE_DETECTOR_INPUT_SIZE = 320;

/** Minimum face box width/height in pixels. */
export const FACE_MIN_BOX_SIZE_PX = 80;

/** Path to static models under Next `public/`. */
export const FACE_API_MODELS_URL = "/models/face-api";
