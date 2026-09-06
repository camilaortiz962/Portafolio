/* ==========================================================================
   Avatar guide — progressive enhancement, no build step.

   Every [data-avatar-role] mount renders María's profile photo today. The
   "primary" mount (the hero) is the only one that ever attempts a live 3D
   render, and only once assets/avatar/camila-avatar.glb actually exists —
   everywhere else (manifiesto, universo creativo, contacto) stays a small,
   stylised photo mark on purpose, so the guide reads as a recurring visual
   signature rather than the same portrait repeated five times.

   To swap in the real model: drop camila-avatar.glb into assets/avatar/ and
   flip AVATAR_MODEL_READY to true below, then bump this file's ?v= in
   index.html. A probing fetch() isn't used here on purpose — even a caught
   404 still prints to the browser console, and this project's bar is zero
   console errors, so availability is a plain, explicit switch instead.
   ========================================================================== */
(function () {
  'use strict';

  // Flip this to true once assets/avatar/camila-avatar.glb exists — that's
  // the only change needed to turn on the live 3D hero avatar.
  var AVATAR_MODEL_READY = false;

  var AVATAR = {
    model: 'assets/avatar/camila-avatar.glb',
    photo: 'assets/perfil/maria-camila-ortiz.jpg'
  };

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

  function renderPhotoFallback(mount) {
    if (mount.dataset.rendered) return;
    mount.dataset.rendered = 'true';
    var img = document.createElement('img');
    img.src = AVATAR.photo;
    if (mount.dataset.avatarAlt) {
      img.alt = mount.dataset.avatarAlt;
    } else {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
    }
    img.loading = mount.dataset.avatarRole === 'primary' ? 'eager' : 'lazy';
    mount.appendChild(img);
    mount.classList.add('avatar-frame--photo');
  }

  var modelLoadPromise = null;
  function loadThreeAndModel() {
    if (modelLoadPromise) return modelLoadPromise;
    modelLoadPromise = new Promise(function (resolve, reject) {
      var threeSrc = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      var loaderSrc = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js';
      var s1 = document.createElement('script');
      s1.src = threeSrc;
      s1.onload = function () {
        var s2 = document.createElement('script');
        s2.src = loaderSrc;
        s2.onload = function () {
          try {
            var loader = new window.THREE.GLTFLoader();
            loader.load(AVATAR.model, resolve, undefined, reject);
          } catch (err) {
            reject(err);
          }
        };
        s2.onerror = reject;
        document.head.appendChild(s2);
      };
      s1.onerror = reject;
      document.head.appendChild(s1);
    });
    return modelLoadPromise;
  }

  function renderModel(mount, gltf) {
    var width = mount.clientWidth || 200;
    var height = mount.clientHeight || 200;
    var renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 3.2);

    scene.add(new window.THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.9));
    var key = new window.THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(2, 3, 2);
    scene.add(key);
    scene.add(gltf.scene);

    var raf = null;
    function animate() {
      if (!prefersReducedMotion) gltf.scene.rotation.y += 0.004;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    // Pause the render loop when the mount scrolls off-screen or the tab is hidden.
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
  }

  function initMount(mount) {
    if (mount.dataset.rendered) return;
    var role = mount.dataset.avatarRole || 'cameo';
    var canAttempt3D = role === 'primary' && AVATAR_MODEL_READY &&
      !prefersReducedMotion && !isNarrowViewport && supportsWebGL();

    if (!canAttempt3D) {
      renderPhotoFallback(mount);
      return;
    }

    loadThreeAndModel().then(function (gltf) {
      mount.dataset.rendered = 'true';
      mount.classList.add('avatar-frame--3d');
      renderModel(mount, gltf);
    }).catch(function () {
      renderPhotoFallback(mount);
    });
  }

  function init() {
    var mounts = document.querySelectorAll('[data-avatar-role]');
    mounts.forEach(initMount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
