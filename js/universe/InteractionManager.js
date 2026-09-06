/* ==========================================================================
   InteractionManager — raycasts against SceneManager's interactive objects
   (the five category portals, the highlighted gallery pieces, the lab
   monitor/IA node) and wires them into the SITE'S EXISTING cursor
   (#cursorDot/#cursorLabel from script.js), rather than building a second,
   competing cursor system. Click navigates to the real project page.
   ========================================================================== */
window.Universe = window.Universe || {};

window.Universe.InteractionManager = (function () {
  function InteractionManager(camera, renderer, objects, isTouch) {
    this.camera = camera;
    this.renderer = renderer;
    this.objects = objects;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(2, 2); // starts off-screen: no accidental hover
    this.hovered = null;
    this.cursorDot = document.getElementById('cursorDot');
    this.cursorLabel = document.getElementById('cursorLabel');

    if (!isTouch) {
      var self = this;
      renderer.domElement.style.pointerEvents = 'auto';
      renderer.domElement.addEventListener('pointermove', function (e) { self._setPointer(e); }, { passive: true });
      renderer.domElement.addEventListener('click', function () { self._click(); });
    } else {
      renderer.domElement.style.pointerEvents = 'none'; // let touch scroll the page untouched
    }
  }

  InteractionManager.prototype._setPointer = function (e) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  InteractionManager.prototype._setCursorLabel = function (text) {
    if (!this.cursorLabel) return;
    if (text) {
      this.cursorLabel.textContent = text;
      this.cursorDot.classList.add('labeled');
    } else {
      this.cursorDot.classList.remove('labeled');
    }
  };

  InteractionManager.prototype._click = function () {
    if (this.hovered && this.hovered.userData.link) {
      window.location.href = this.hovered.userData.link;
    }
  };

  InteractionManager.prototype.update = function () {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    var hits = this.raycaster.intersectObjects(this.objects, true);
    var hitGroup = null;
    if (hits.length) {
      // Walk up to the interactive group/object itself (children are meshes).
      var obj = hits[0].object;
      while (obj && this.objects.indexOf(obj) === -1) obj = obj.parent;
      hitGroup = obj;
    }

    if (hitGroup !== this.hovered) {
      if (this.hovered) {
        var prevScale = this.hovered.userData.baseScale || 1;
        this.hovered.scale.set(prevScale, prevScale, prevScale);
      }
      this.hovered = hitGroup;
      if (this.hovered) {
        this.renderer.domElement.style.cursor = 'pointer';
        this._setCursorLabel('Explorar →');
      } else {
        this.renderer.domElement.style.cursor = 'default';
        this._setCursorLabel(null);
      }
    }
    if (this.hovered) {
      var target = this.hovered.userData.hoverScale || 1.08;
      this.hovered.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    }
  };

  return InteractionManager;
})();
