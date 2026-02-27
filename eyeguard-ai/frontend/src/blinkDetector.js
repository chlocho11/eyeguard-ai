import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// MediaPipe landmark indices for eyes (FaceMesh compatible)
const LEFT_EYE = { // around eye
  p1: 33, p2: 160, p3: 158, p4: 133, p5: 153, p6: 144,
};
const RIGHT_EYE = {
  p1: 362, p2: 385, p3: 387, p4: 263, p5: 373, p6: 380,
};

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// EAR = (||p2-p6|| + ||p3-p5||) / (2*||p1-p4||)
function ear(landmarks, eye) {
  const p1 = landmarks[eye.p1];
  const p2 = landmarks[eye.p2];
  const p3 = landmarks[eye.p3];
  const p4 = landmarks[eye.p4];
  const p5 = landmarks[eye.p5];
  const p6 = landmarks[eye.p6];

  const vertical = dist(p2, p6) + dist(p3, p5);
  const horizontal = 2 * dist(p1, p4);
  return horizontal === 0 ? 0 : vertical / horizontal;
}

export async function createBlinkDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    // CDN hosted assets (works in most setups)
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      // use model from CDN
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });

  return faceLandmarker;
}

export function computeBlinkMetrics(faceLandmarks) {
  // faceLandmarks: array of {x,y,z} points length ~ 478
  const left = ear(faceLandmarks, LEFT_EYE);
  const right = ear(faceLandmarks, RIGHT_EYE);
  const avg = (left + right) / 2;
  return { leftEAR: left, rightEAR: right, ear: avg };
}

// Estimate screen distance using face width in normalized coords.
// Landmarks 234 (left cheek) and 454 (right cheek) span the face.
// Larger faceWidth → user is closer to the camera.
// Tune TOO_CLOSE_THRESH and TOO_FAR_THRESH to your webcam setup.
export function computeDistanceAlert(faceLandmarks) {
  const leftCheek  = faceLandmarks[234];
  const rightCheek = faceLandmarks[454];

  if (!leftCheek || !rightCheek) return { too_close: false, too_far: false };

  const faceWidth = Math.hypot(
    rightCheek.x - leftCheek.x,
    rightCheek.y - leftCheek.y
  );

  // Empirical thresholds in normalised [0,1] coords.
  // faceWidth > 0.45  → face fills frame → too close
  // faceWidth < 0.18  → face is tiny    → too far
  const too_close = faceWidth > 0.45;
  const too_far   = faceWidth < 0.18;

  return { too_close, too_far, faceWidth };
}