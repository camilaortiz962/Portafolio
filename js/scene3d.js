/* ==========================================================================
   Hero ambient 3D — a handful of procedural wireframe shapes floating behind
   the hero text, for real depth today without depending on any .glb file.

   Loads Three.js from a CDN only when it will actually be used: desktop,
   no prefers-reduced-motion, WebGL available. On mobile or when any of that
   fails (including a blocked CDN request), this silently does nothing and
   the page keeps its existing CSS hero-graphic decoration as the sole
   background layer — the hero never depends on this to look finished.
   ========================================================================== */
(function () {
  'use strict';

  var mount = document.getElementById('heroScene3d');
  if (!mount) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isNarrowViewport = window.matchMedia('(max-width: 780px)').matches;

  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (prefersReducedMotion || isNarrowViewport || !supportsWebGL()) return;

  function loadThree() {
    return new Promise(function (resolve, reject) {
      if (window.THREE) { resolve(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function buildScene() {
    var THREE = window.THREE;
    var width = mount.clientWidth;
    var height = mount.clientHeight;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 9;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    // Same accent trio as the CSS decorative dots, so the scene reads as one system.
    // Positions stay off to the sides and far back (large |x|, negative z) so the
    // shapes never drift across the centered hero text column.
    var palette = [0x3d7bff, 0x16a878, 0xff6b5e];
    var shapes = [];
    var geometries = [
      new THREE.IcosahedronGeometry(0.9, 0),
      new THREE.TorusGeometry(0.7, 0.22, 10, 24),
      new THREE.OctahedronGeometry(0.7, 0)
    ];
    var positions = [
      { x: -4.6, y: 1.6, z: -3 },
      { x: 4.8, y: -1.4, z: -3.5 },
      { x: 4.2, y: 2.2, z: -4.5 }
    ];

    geometries.forEach(function (geo, i) {
      var mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        wireframe: true,
        transparent: true,
        opacity: 0.24
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      mesh.userData.speed = 0.15 + i * 0.05;
      mesh.userData.bobOffset = i * 2;
      scene.add(mesh);
      shapes.push(mesh);
    });

    var pointer = { x: 0, y: 0 };
    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!isTouch) {
      window.addEventListener('mousemove', function (e) {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    var raf = null;
    var clock = new THREE.Clock();
    function animate() {
      var t = clock.getElapsedTime();
      shapes.forEach(function (mesh) {
        mesh.rotation.x += 0.0016 * mesh.userData.speed * 10;
        mesh.rotation.y += 0.0022 * mesh.userData.speed * 10;
        mesh.position.y += Math.sin(t * 0.6 + mesh.userData.bobOffset) * 0.0018;
      });
      camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.02;
      camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();
    mount.classList.add('is-ready');

    // Pause off-screen or when the tab is hidden; resume on return.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!raf) animate();
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    }, { threshold: 0.05 });
    io.observe(mount);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && !raf) animate();
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var w = mount.clientWidth, h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 150);
    }, { passive: true });
  }

  function start() {
    loadThree().then(buildScene).catch(function () {
      // CDN unreachable or blocked: no-op, the CSS hero-graphic layer stands alone.
    });
  }

  // Defer until the page has settled so this never competes with first paint.
  // requestIdleCallback's 2nd arg must be an options object ({timeout}), not a
  // plain number like setTimeout's — so the two calls can't share one line.
  function scheduleStart() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 1);
    }
  }

  if (document.readyState === 'complete') {
    scheduleStart();
  } else {
    window.addEventListener('load', scheduleStart);
  }
})();
