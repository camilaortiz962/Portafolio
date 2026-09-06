/* ==========================================================================
   AssetManager — loads and caches the REAL project/category images used as
   textures inside the procedural universe (magazine covers, poster art,
   category photography). Nothing here is invented: every path points at a
   file that already ships with the site for the 2D pages.
   ========================================================================== */
window.Universe = window.Universe || {};

window.Universe.AssetManager = (function () {
  function AssetManager(basePath) {
    this.basePath = basePath || '';
    this.loader = new THREE.TextureLoader();
    this.cache = {};
  }

  AssetManager.prototype.texture = function (relPath) {
    if (this.cache[relPath]) return this.cache[relPath];
    var tex = this.loader.load(this.basePath + relPath, undefined, undefined, function () {
      // A missing/renamed file fails silently into a flat placeholder color —
      // the mesh's own base material color still reads fine without it.
    });
    tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
    this.cache[relPath] = tex;
    return tex;
  };

  return AssetManager;
})();
