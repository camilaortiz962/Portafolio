# Assets faltantes

Verificado con `find . -iname "*.glb" -o -iname "*.gltf" -o -iname "*.fbx"` sobre todo el repositorio: **cero archivos 3D existen hoy.** Todo lo que se ve en el universo 3D es geometría procedural (Three.js) más las fotos/imágenes reales que ya existían en `assets/proyectos/`, `assets/categories/` y `assets/perfil/`.

| Archivo | Dónde se usaría | Para qué sirve | Prioridad | Formato recomendado |
|---|---|---|---|---|
| `assets/avatar/camila-avatar.glb` | Todo el recorrido (avatar protagonista) | Reemplaza el billboard 2D por tu avatar 3D real, rigueado | Alta | glb, rig humanoide, ≤5 MB, materiales embebidos |
| `assets/avatar/avatar-front.webp` | Fallback narrativo (presentación) | Ya soportado como recurso alternativo si se decide dejar de usar el billboard genérico | Media | webp, ≤200 KB |
| `assets/avatar/avatar-3quarter.webp` | Fallback narrativo (exploración) | Igual que arriba | Media | webp |
| `assets/avatar/avatar-back.webp` | Fallback narrativo (cierre/contacto) | Igual que arriba | Media | webp |
| `assets/environments/studio.glb` | Hero + Sobre mí | Reemplaza el escritorio/monitor/pedestales procedurales | Baja | glb optimizado, ≤3 MB |
| `assets/environments/gallery.glb` | Zona Gallery | Reemplaza los marcos/pedestales procedurales | Baja | glb optimizado |
| `assets/environments/laboratory.glb` | Zona Lab (IA/Web) | Reemplaza el nodo generativo procedural | Baja | glb optimizado |
| `assets/3d/magazine.glb` | Piezas editoriales (Coca-Cola Mag, catálogos) | Reemplaza el plano+marco procedural | Baja | glb, geometría simple |
| `assets/3d/monitor.glb` | Studio + Lab (Global Seguros, Desarrollo Web) | Reemplaza la carcasa procedural | Baja | glb |
| `assets/3d/package.glb` | Si se agrega una zona de packaging | No implementado aún — no existe categoría de packaging activa en el sitio actual | Baja | glb |
| `assets/3d/frame.glb` | Marcos de Gallery/Universe | Reemplaza el `BoxGeometry` usado como marco | Baja | glb |
| `assets/3d/camera.glb` | Especialidad "Multimedia" | Hoy es un ícono SVG 2D — reemplazo opcional | Muy baja | glb |
| `assets/3d/abstract-object.glb` | Especialidad "IA" / Lab | Hoy es geometría procedural (nodos+líneas) | Muy baja | glb |

## Nota sobre el avatar

No se recibieron en este repositorio las imágenes de referencia del avatar (frontal/3-4/espalda) mencionadas en la conversación. Si existen, deben copiarse literalmente a `assets/avatar/` con esos nombres — no se inventó ninguna imagen de reemplazo.

## Regla aplicada

Ningún placeholder de esta lista se presentó como si fuera un trabajo real de María. Todo lo que aparece como "trabajo real" en el universo (las 5 categorías, Coca-Cola Mag, Estéreo Picnic, los catálogos, los renders 3D del proceso) usa las imágenes reales que ya existían en el repositorio antes de esta implementación.
