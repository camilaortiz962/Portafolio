/* ==========================================================================
   AvatarProvider — swappable representation of María in the 3D universe.

   AvatarImageProvider (active today): a circular billboard built from her
   real profile photo (assets/perfil/maria-camila-ortiz.jpg), always facing
   the camera, following a position along the same path the camera travels.
   This is explicitly NOT trying to fake a 3D character — it is a clearly
   flat, photo-based presence, exactly as instructed.

   AvatarGLBProvider (inactive): once assets/avatar/camila-avatar.glb exists,
   flip AVATAR_MODEL_READY in js/avatar.js-style fashion — set
   Universe.AVATAR_MODEL_READY = true below — and this provider takes over
   with no change to SceneManager, which only ever calls
   provider.getObject3D() / provider.moveTo(position, lookAt).
   ========================================================================== */
window.Universe = window.Universe || {};

// The one switch for the future rigged model. Today: false, always the photo.
window.Universe.AVATAR_MODEL_READY = false;

window.Universe.AvatarImageProvider = (function () {
  var PHOTO_URL = 'assets/perfil/maria-camila-ortiz.jpg';

  function buildCircularTexture(image) {
    var size = 512;
    var canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Cover-fit the source photo into the circle, same idea as CSS object-fit: cover.
    var scale = Math.max(size / image.width, size / image.height);
    var w = image.width * scale, h = image.height * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    ctx.restore();

    // Soft ring, matching the .avatar-frame CSS treatment elsewhere on the site.
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(243,239,230,0.7)';
    ctx.stroke();

    return canvas;
  }

  function AvatarImageProvider() {
    this.sprite = null;
    this.ready = false;
    var self = this;
    var loader = new THREE.ImageLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(PHOTO_URL, function (image) {
      var canvas = buildCircularTexture(image);
      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      self.sprite = new THREE.Sprite(mat);
      self.sprite.scale.set(1.6, 1.6, 1);
      self.ready = true;
    });
  }

  AvatarImageProvider.prototype.getObject3D = function () {
    return this.sprite;
  };

  AvatarImageProvider.prototype.moveTo = function (position) {
    if (this.sprite) this.sprite.position.copy(position);
  };

  return AvatarImageProvider;
})();

// Stub kept intentionally thin: the real work (GLTFLoader, animation mixer,
// idle/walk clips) only gets written once camila-avatar.glb is real and can
// be inspected — writing it against a guess today would likely be wrong.
window.Universe.AvatarGLBProvider = function () {
  throw new Error('AvatarGLBProvider is not implemented yet — camila-avatar.glb does not exist. Universe.AVATAR_MODEL_READY must stay false until it does.');
};
