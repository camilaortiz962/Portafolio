/* ==========================================================================
   universe.js — boots the continuous 3D universe: one fixed full-viewport
   canvas behind the whole page, one scene, one camera that travels along
   SceneManager's waypoints as the user scrolls the normal HTML page.

   Load order matters here (all <script defer>, in this sequence, before
   this file): PerformanceManager, AssetManager, AvatarProvider,
   CameraController, SceneManager, InteractionManager.

   Fallback: if WebGL is unavailable or the visitor has requested reduced
   motion, this file does nothing at all — the mount stays empty and the
   existing HTML/CSS page (which never depended on this) is the whole
   experience, exactly as before today's change.
   ========================================================================== */
(function () {
  'use strict';

  var mount = document.getElementById('universeCanvas');
  if (!mount) return;

  var perf = new window.Universe.PerformanceManager();
  if (!perf.canRunUniverse) return; // no WebGL, or prefers-reduced-motion: leave the 2D page as-is

  function loadThree(cb) {
    if (window.THREE) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = cb;
    s.onerror = function () { /* CDN blocked: silently stay on the 2D page */ };
    document.head.appendChild(s);
  }

  function boot() {
    if (!window.THREE) return;
    var THREE = window.THREE;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: mount, alpha: true, antialias: true });
    } catch (e) {
      return; // context creation failed on this device: stay on the fully opaque 2D page
    }
    perf.clampPixelRatio(renderer);
    renderer.shadowMap.enabled = perf.shadowsEnabled;
    renderer.shadowMap.autoUpdate = false;

    // The single flag every section's CSS checks before turning translucent —
    // added only once a renderer genuinely exists, so a WebGL/CDN failure
    // always leaves every section at its original, fully opaque background.
    document.body.classList.add('universe-active');

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);

    var assets = new window.Universe.AssetManager('');
    var sceneManager = new window.Universe.SceneManager(scene, assets, perf);
    var cameraController = new window.Universe.CameraController(camera, sceneManager.waypoints);
    var interaction = new window.Universe.InteractionManager(camera, renderer, sceneManager.getInteractiveObjects(), perf.isTouch);

    var avatar = window.Universe.AVATAR_MODEL_READY
      ? new window.Universe.AvatarGLBProvider()
      : new window.Universe.AvatarImageProvider();
    var avatarAdded = false;

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }, { passive: true });

    function docProgress() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return Math.min(1, Math.max(0, window.scrollY / scrollable));
    }

    function avatarProgress(progress) {
      var wp = sceneManager.avatarWaypoints;
      var i = 0;
      while (i < wp.length - 2 && progress > wp[i + 1].t) i++;
      var a = wp[i], b = wp[i + 1];
      var span = b.t - a.t || 1;
      var localT = Math.min(1, Math.max(0, (progress - a.t) / span));
      return new THREE.Vector3(
        a.position[0] + (b.position[0] - a.position[0]) * localT,
        a.position[1] + (b.position[1] - a.position[1]) * localT,
        a.position[2] + (b.position[2] - a.position[2]) * localT
      );
    }

    var running = true;
    var lastZoneIndex = -1;
    var clock = new THREE.Clock();

    function frame() {
      if (!running) return;
      requestAnimationFrame(frame);

      var progress = docProgress();
      cameraController.setProgress(progress);
      cameraController.update();

      if (avatar.getObject3D && avatar.getObject3D() && !avatarAdded) {
        scene.add(avatar.getObject3D());
        avatarAdded = true;
      }
      if (avatar.moveTo) avatar.moveTo(avatarProgress(progress));

      sceneManager.tick(clock.getElapsedTime());
      interaction.update();

      // Cheap shadow-map refresh: only recompute when we've crossed into a
      // new zone, not every frame — shadows barely change within a zone.
      var zoneIndex = Math.floor(progress * 10);
      if (zoneIndex !== lastZoneIndex) {
        lastZoneIndex = zoneIndex;
        renderer.shadowMap.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) frame();
    });

    frame();
  }

  // Wait for full page load so this never competes with first paint / LCP.
  function schedule() {
    if (window.requestIdleCallback) window.requestIdleCallback(function () { loadThree(boot); }, { timeout: 2000 });
    else setTimeout(function () { loadThree(boot); }, 1);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
