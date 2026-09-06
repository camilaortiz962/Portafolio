/* ==========================================================================
   PerformanceManager — the single source of truth for "how much scene can
   we afford right now". Everything else (SceneManager, InteractionManager)
   reads from here instead of re-detecting device capability itself.
   ========================================================================== */
window.Universe = window.Universe || {};

window.Universe.PerformanceManager = (function () {
  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function PerformanceManager() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.matchMedia('(max-width: 780px)').matches;
    this.isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    this.hasWebGL = supportsWebGL();
    // The one gate everything else checks before doing any 3D work at all.
    this.canRunUniverse = this.hasWebGL && !this.prefersReducedMotion;
    // Mobile still gets the universe (rule: "no eliminar el 3D en mobile"),
    // just a cheaper one: no shadows, lower pixel ratio, fewer live objects.
    this.shadowsEnabled = !this.isMobile;
    this.maxPixelRatio = this.isMobile ? 1.5 : 2;
    this.particleBudget = this.isMobile ? 0 : 40;
  }

  PerformanceManager.prototype.clampPixelRatio = function (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
  };

  return PerformanceManager;
})();
