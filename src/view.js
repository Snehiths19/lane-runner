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
