// Camera fit: size the view by width so all 3 lanes always fit.
// Returns the camera's vertical field of view in degrees. Wide screens keep
// baseFov; narrow (upright phone) screens widen until the horizontal view
// reaches minHorizontalFov.

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

export function fovForAspect(aspect, { baseFov = 60, minHorizontalFov = 55, maxFov = 100 } = {}) {
  const needed = toDeg(2 * Math.atan(Math.tan(toRad(minHorizontalFov) / 2) / aspect));
  return Math.min(maxFov, Math.max(baseFov, needed));
}

// Camera follow (CAM-1): eases cam.x and cam.lift toward the target, each with its own lag in
// seconds. Exponential easing, so the motion is the same at any frame rate.
export function followCamera(cam, target, dt, { sideLag, liftLag }) {
  cam.x += (target.x - cam.x) * (1 - Math.exp(-dt / sideLag));
  cam.lift += (target.lift - cam.lift) * (1 - Math.exp(-dt / liftLag));
}
