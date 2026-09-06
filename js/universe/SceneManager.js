/* ==========================================================================
   SceneManager — builds the whole procedural universe as a single continuous
   scene along the Z axis. Every zone below is architecture/decoration built
   from primitive Three.js geometry (boxes, cylinders, planes) — the only
   real content are the *textures*: María's actual project and category
   photography, loaded through AssetManager. Nothing here fabricates a
   project, a skill, or a result that isn't already on the 2D pages.

   Zones (in scroll order) and what each maps to on the existing site:
     STUDIO      → Hero
     MANIFESTO   → Manifiesto
     UNIVERSE    → Universo creativo (5 category portals, real cover photos)
     GALLERY     → highlighted real project pieces (editorial/illustration)
     LAB         → Desarrollo Web + Inteligencia Artificial
     WORKFLOW    → Proceso (6 real stations: Exploro…Entrego)
     STUDIO_2    → Sobre mí
     THRESHOLD   → Contacto
   ========================================================================== */
window.Universe = window.Universe || {};

window.Universe.SceneManager = (function () {
  var COLOR = {
    ink: 0x0a0a0c,
    ink2: 0x151519,
    bone: 0xf3efe6,
    electric: 0x3d7bff,
    emerald: 0x16a878,
    coral: 0xff6b5e,
    violet: 0x6b5b95
  };

  function canvasLabel(text, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    var scale = 2;
    canvas.width = (opts.width || 512) * scale;
    canvas.height = (opts.height || 128) * scale;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.bg || 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = opts.color || '#f3efe6';
    ctx.font = (opts.italic ? 'italic ' : '') + (opts.weight || 500) + ' ' + (opts.size || 46) * scale + 'px ' + (opts.font || 'Georgia, serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var lines = (opts.lines || [text]);
    var lineHeight = (opts.size || 46) * scale * 1.25;
    var startY = canvas.height / 2 - (lineHeight * (lines.length - 1)) / 2;
    lines.forEach(function (line, i) {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });
    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function SceneManager(scene, assets, perf) {
    this.scene = scene;
    this.assets = assets;
    this.perf = perf;
    this.interactive = [];
    this.zoneMeshes = [];
    this.sharedGeo = {
      box1: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(0.4, 0.45, 1, 20),
      plane: new THREE.PlaneGeometry(1, 1),
      floor: new THREE.PlaneGeometry(14, 40)
    };
    this._build();
  }

  SceneManager.prototype._pedestal = function (x, y, z, h) {
    h = h || 1.1;
    var mesh = new THREE.Mesh(this.sharedGeo.cylinder,
      new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.55, metalness: 0.3 }));
    mesh.scale.set(0.5, h, 0.5);
    mesh.position.set(x, y + h / 2 - 0.5, z);
    mesh.receiveShadow = mesh.castShadow = this.perf.shadowsEnabled;
    this.scene.add(mesh);
    return mesh;
  };

  SceneManager.prototype._floor = function (z, width) {
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(width || 14, 18),
      new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.9, metalness: 0.1 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -1.2, z);
    mesh.receiveShadow = this.perf.shadowsEnabled;
    this.scene.add(mesh);
    return mesh;
  };

  SceneManager.prototype._framedImage = function (relPath, x, y, z, w, h, opts) {
    opts = opts || {};
    var group = new THREE.Group();
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: opts.frameColor || 0x201c1a, roughness: 0.5, metalness: 0.25 })
    );
    group.add(frame);
    var img = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: this.assets.texture(relPath) })
    );
    img.position.z = 0.05;
    group.add(img);
    group.position.set(x, y, z);
    if (opts.rotationY) group.rotation.y = opts.rotationY;
    group.userData.link = opts.link || null;
    group.userData.hoverScale = 1.06;
    group.userData.baseScale = group.scale.x;
    this.scene.add(group);
    if (opts.link) this.interactive.push(group);
    return group;
  };

  SceneManager.prototype._pointLight = function (x, y, z, color, intensity, distance) {
    var light = new THREE.PointLight(color, intensity, distance || 14);
    light.position.set(x, y, z);
    this.scene.add(light);
    return light;
  };

  SceneManager.prototype._build = function () {
    var self = this;
    this.scene.fog = new THREE.Fog(COLOR.ink, 14, 46);
    this.scene.add(new THREE.HemisphereLight(0x8890ff, 0x0a0a0c, 0.55));

    /* ---------- STUDIO (Hero) — z: 4 to -8 ---------- */
    this._floor(-2, 16);
    var deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.6 }));
    deskTop.position.set(2.6, -0.9, -3);
    this.scene.add(deskTop);
    var monitor = this._framedImage('assets/categories/Desarrollo web.jpg', 2.6, -0.15, -3.55, 1.4, 0.9,
      { frameColor: 0x111114 });
    var studioMag = this._framedImage('assets/proyectos/coca-cola-mag-cover.jpg', -2.8, -0.35, -3.2, 0.9, 1.2,
      { rotationY: 0.35 });
    this._pedestal(-3.6, -1.2, -1.2, 0.9);
    var studioAbstract = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({ color: COLOR.electric, wireframe: true, transparent: true, opacity: 0.7 }));
    studioAbstract.position.set(-3.6, -0.3, -1.2);
    this.scene.add(studioAbstract);
    this.studioAbstract = studioAbstract;
    this._pointLight(0, 3, 0, 0xffffff, 0.9, 20);
    this._pointLight(-4, 2, -2, COLOR.violet, 0.6, 12);
    this._pointLight(4, 1.5, -4, COLOR.electric, 0.5, 12);

    /* ---------- MANIFESTO — z: -18 ---------- */
    var manifestoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 3.2),
      new THREE.MeshBasicMaterial({
        map: canvasLabel('', {
          lines: ['No diseño para llenar espacios.', 'Diseño para comunicar.'],
          size: 44, italic: true, color: '#f3efe6', width: 1400, height: 400
        }),
        transparent: true
      })
    );
    manifestoPanel.position.set(0, 0.4, -18);
    this.scene.add(manifestoPanel);
    this._pedestal(0, -1.2, -16.5, 0.6);
    this._pointLight(0, 2.5, -18, COLOR.bone, 0.7, 16);
    this._pointLight(0, -0.5, -15, COLOR.violet, 0.5, 10);
    this._floor(-18, 14);

    /* ---------- UNIVERSE — five category portals, z: -28 to -44 ---------- */
    var categories = [
      { img: 'assets/categories/Editorial.jpg', label: 'Editorial & Branding', link: 'proyectos/editorial-branding.html' },
      { img: 'assets/categories/Ilustracion.jpg', label: 'Ilustración', link: 'proyectos/ilustracion.html' },
      { img: 'assets/categories/3D.jpg', label: 'Animación & 3D', link: 'proyectos/animacion-3d.html' },
      { img: 'assets/categories/Desarrollo web.jpg', label: 'Desarrollo Web', link: 'proyectos/desarrollo-web.html' },
      { img: 'assets/categories/Inteligencia Artificial.jpg', label: 'Inteligencia Artificial', link: 'proyectos/inteligencia-artificial.html' }
    ];
    var universeStartZ = -28, universeStepZ = -4.4;
    categories.forEach(function (cat, i) {
      var z = universeStartZ + i * universeStepZ;
      var side = i % 2 === 0 ? -1 : 1;
      var x = side * 2.6;
      self._pedestal(x, -1.2, z, 1);
      var portal = self._framedImage(cat.img, x, 0.35, z, 1.7, 2.1, { link: cat.link });
      portal.rotation.y = -side * 0.28;
      var label = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4),
        new THREE.MeshBasicMaterial({ map: canvasLabel(cat.label, { size: 34, color: '#f3efe6', width: 700, height: 160 }), transparent: true }));
      label.position.set(x, -0.95, z + 0.1);
      self.scene.add(label);
      self._pointLight(x, 1.2, z, i % 2 ? COLOR.emerald : COLOR.electric, 0.6, 8);
      self._floor(z, 12);
    });

    /* ---------- GALLERY — real editorial/illustration highlights, z: -58 ---------- */
    var galleryZ = -58;
    this._floor(galleryZ, 14);
    this._framedImage('assets/proyectos/new-yorker-ilustracion.jpg', -2.4, 0.2, galleryZ, 1.5, 1.9,
      { link: 'proyectos/ilustracion.html', rotationY: 0.22 });
    this._framedImage('assets/proyectos/maca-manual-marca.jpg', 2.4, 0.2, galleryZ - 1.4, 1.5, 1.9,
      { link: 'proyectos/editorial-branding.html', rotationY: -0.22 });
    this._framedImage('assets/proyectos/estereo-picnic-poster.jpg', 0, 0.2, galleryZ - 3.2, 1.6, 2.1,
      { link: 'proyectos/editorial-branding.html' });
    this._pointLight(0, 2, galleryZ - 1.5, COLOR.bone, 0.55, 14);

    /* ---------- LAB — Desarrollo Web + IA, z: -74 ---------- */
    var labZ = -74;
    this._floor(labZ, 14);
    this._pedestal(-2.2, -1.2, labZ, 1.1);
    this._framedImage('assets/categories/Desarrollo web.jpg', -2.2, 0.15, labZ - 0.3, 1.6, 1.05,
      { link: 'proyectos/desarrollo-web.html', frameColor: 0x111114 });
    var iaNode = new THREE.Group();
    var nodeGeo = new THREE.SphereGeometry(0.06, 10, 10);
    var nodeMat = new THREE.MeshStandardMaterial({ color: COLOR.violet, emissive: COLOR.violet, emissiveIntensity: 0.4 });
    var nodePositions = [[0, 0.4, 0], [0.5, 0.1, 0.2], [-0.4, -0.1, -0.1], [0.2, -0.4, 0.3], [-0.3, 0.3, -0.2]];
    var lineMat = new THREE.LineBasicMaterial({ color: COLOR.electric, transparent: true, opacity: 0.5 });
    nodePositions.forEach(function (p, i) {
      var node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(p[0], p[1], p[2]);
      iaNode.add(node);
      if (i > 0) {
        var prev = nodePositions[i - 1];
        var geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(prev[0], prev[1], prev[2]),
          new THREE.Vector3(p[0], p[1], p[2])
        ]);
        iaNode.add(new THREE.Line(geo, lineMat));
      }
    });
    iaNode.position.set(2.2, 0.4, labZ);
    iaNode.userData.link = 'proyectos/inteligencia-artificial.html';
    iaNode.userData.baseScale = 1;
    this.scene.add(iaNode);
    this.interactive.push(iaNode);
    this.iaNode = iaNode;
    this._pointLight(2.2, 1.2, labZ, COLOR.violet, 0.7, 10);
    this._pointLight(-2.2, 1.2, labZ, COLOR.electric, 0.6, 10);

    /* ---------- WORKFLOW — six real process stations, z: -90 to -110 ---------- */
    var stations = [
      { num: '01', title: 'Exploro', img: 'assets/proyectos/icon3d-lupa.jpg' },
      { num: '02', title: 'Concepto', img: 'assets/proyectos/icon3d-bombilla.jpg' },
      { num: '03', title: 'Diseño', img: 'assets/proyectos/icon3d-libros.jpg' },
      { num: '04', title: 'Desarrollo', img: 'assets/proyectos/icon3d-globo.jpg' },
      { num: '05', title: 'Experimento', img: 'assets/proyectos/icon3d-birrete.jpg' },
      { num: '06', title: 'Entrego', img: 'assets/categories/Editorial.jpg' }
    ];
    var workflowStartZ = -90, workflowStepZ = -4;
    stations.forEach(function (st, i) {
      var z = workflowStartZ + i * workflowStepZ;
      var side = i % 2 === 0 ? 1 : -1;
      self._pedestal(side * 2, -1.2, z, 0.8);
      self._framedImage(st.img, side * 2, -0.35, z, 0.85, 0.85, { frameColor: 0x1a1712 });
      var lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3),
        new THREE.MeshBasicMaterial({ map: canvasLabel(st.num + ' — ' + st.title, { size: 28, color: '#f3efe6', width: 560, height: 120 }), transparent: true }));
      lbl.position.set(side * 2, 0.35, z + 0.05);
      self.scene.add(lbl);
      self._floor(z, 10);
    });
    this._pointLight(0, 2, workflowStartZ - 10, COLOR.coral, 0.4, 22);

    /* ---------- STUDIO_2 (Sobre mí), z: -122 ---------- */
    var aboutZ = -122;
    this._floor(aboutZ, 14);
    this._framedImage('assets/perfil/maria-camila-ortiz.jpg', 0, 0.3, aboutZ, 1.7, 2.2, {});
    this._pedestal(2.4, -1.2, aboutZ + 1, 0.9);
    this._pedestal(-2.4, -1.2, aboutZ + 1, 0.9);
    this._pointLight(0, 2, aboutZ + 1.5, COLOR.bone, 0.7, 14);

    /* ---------- THRESHOLD (Contacto), z: -138 ---------- */
    var contactZ = -138;
    this._floor(contactZ, 12);
    var doorway = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 12, 40),
      new THREE.MeshStandardMaterial({ color: COLOR.bone, emissive: COLOR.electric, emissiveIntensity: 0.25 }));
    doorway.position.set(0, 0.6, contactZ - 2);
    this.scene.add(doorway);
    this._pointLight(0, 1, contactZ - 1, COLOR.electric, 0.8, 16);

    /* Camera + avatar waypoints, one per zone, consumed by CameraController. */
    this.waypoints = [
      { t: 0.00, position: [0, 0.6, 4], lookAt: [0, 0.2, -2] },
      { t: 0.10, position: [1.2, 0.4, -6], lookAt: [0, 0.2, -12] },
      { t: 0.18, position: [0, 0.5, -14], lookAt: [0, 0.4, -18] },
      { t: 0.32, position: [1.6, 0.3, -30], lookAt: [-2.6, 0.3, -32] },
      { t: 0.46, position: [-1.6, 0.3, -40], lookAt: [2.6, 0.3, -42] },
      { t: 0.56, position: [0, 0.5, -55], lookAt: [0, 0.2, -58] },
      { t: 0.66, position: [0.6, 0.4, -70], lookAt: [1, 0.2, -74] },
      { t: 0.78, position: [0, 0.4, -92], lookAt: [1.6, -0.2, -96] },
      { t: 0.90, position: [0, 0.5, -118], lookAt: [0, 0.3, -122] },
      { t: 1.00, position: [0, 0.7, -134], lookAt: [0, 0.5, -140] }
    ];
    this.avatarWaypoints = [
      { t: 0.00, position: [-1.1, 0.1, 2.2] },
      { t: 0.10, position: [-0.6, 0, -5] },
      { t: 0.18, position: [0.8, 0.1, -15.5] },
      { t: 0.32, position: [-1.4, 0, -29] },
      { t: 0.46, position: [1.4, 0, -41] },
      { t: 0.56, position: [1, 0.1, -56.5] },
      { t: 0.66, position: [-0.9, 0, -72] },
      { t: 0.78, position: [-1.6, 0, -94] },
      { t: 0.90, position: [1.3, 0.1, -120.5] },
      { t: 1.00, position: [0, 0.1, -136] }
    ];
  };

  SceneManager.prototype.getInteractiveObjects = function () {
    return this.interactive;
  };

  SceneManager.prototype.tick = function (elapsed) {
    if (this.studioAbstract) {
      this.studioAbstract.rotation.y = elapsed * 0.3;
      this.studioAbstract.rotation.x = elapsed * 0.18;
    }
    if (this.iaNode) this.iaNode.rotation.y = elapsed * 0.15;
  };

  return SceneManager;
})();
