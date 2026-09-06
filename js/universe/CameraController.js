/* ==========================================================================
   CameraController — moves the camera along a fixed set of waypoints based
   on scroll progress (0 = top of page, 1 = bottom). The PAGE still scrolls
   natively; nothing hijacks the wheel/touch input. Scroll position is only
   ever *read*, then smoothed with a lerp so the camera never jumps or feels
   like a raw scrollbar-to-3D mapping.
   ========================================================================== */
window.Universe = window.Universe || {};

window.Universe.CameraController = (function () {
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function CameraController(camera, waypoints) {
    this.camera = camera;
    this.waypoints = waypoints; // [{ t, position:[x,y,z], lookAt:[x,y,z] }], t ascending 0..1
    this.currentPos = new THREE.Vector3().fromArray(waypoints[0].position);
    this.currentLookAt = new THREE.Vector3().fromArray(waypoints[0].lookAt);
    this.targetPos = this.currentPos.clone();
    this.targetLookAt = this.currentLookAt.clone();
    camera.position.copy(this.currentPos);
  }

  function lerpArr(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  // Given progress in [0,1], find the surrounding pair of waypoints and
  // interpolate between them — this is the whole "path" mechanism.
  CameraController.prototype.setProgress = function (progress) {
    var wp = this.waypoints;
    var i = 0;
    while (i < wp.length - 2 && progress > wp[i + 1].t) i++;
    var a = wp[i], b = wp[i + 1];
    var span = b.t - a.t || 1;
    var localT = smoothstep(Math.min(1, Math.max(0, (progress - a.t) / span)));

    var pos = lerpArr(a.position, b.position, localT);
    var look = lerpArr(a.lookAt, b.lookAt, localT);
    this.targetPos.set(pos[0], pos[1], pos[2]);
    this.targetLookAt.set(look[0], look[1], look[2]);
  };

  // Called every frame: eases current position/lookAt toward the target —
  // this is what makes the camera feel cinematic instead of snapping.
  CameraController.prototype.update = function () {
    this.currentPos.lerp(this.targetPos, 0.055);
    this.currentLookAt.lerp(this.targetLookAt, 0.055);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  };

  return CameraController;
})();
