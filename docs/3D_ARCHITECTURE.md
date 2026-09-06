# Arquitectura del universo 3D

Este documento describe cómo funciona la capa 3D del portafolio (`js/universe.js` + `js/universe/*`), cómo se relaciona con el HTML/CSS existente, y cómo sustituir cada pieza procedural por un asset real cuando exista.

## Stack y principio general

- Vanilla JS + [Three.js](https://threejs.org) r128 cargado desde cdnjs, sin build step, sin framework. No se migró a React/R3F: el proyecto no lo usaba y no aportaba valor suficiente para justificar el cambio.
- **Un único `<canvas id="universeCanvas">`, fijo a pantalla completa, detrás de todo el HTML.** No se crea ni se destruye entre secciones — es el mismo lienzo del principio al final del recorrido.
- El HTML/CSS existente (cada `<section>`) sigue siendo la capa editorial de información real: textos, formularios, el carrusel de categorías, las páginas de proyecto. El 3D es la "arquitectura" detrás; el contenido real de María sigue viviendo en HTML/imágenes tal como estaba.
- El scroll de la página nunca se intercepta. El progreso de scroll (`scrollY / (scrollHeight - innerHeight)`) es lo único que `CameraController` lee para decidir dónde está la cámara — es una lectura, no un secuestro del evento wheel/touch.

## Módulos (`js/universe/`)

| Archivo | Responsabilidad |
|---|---|
| `PerformanceManager.js` | Detecta WebGL, `prefers-reduced-motion`, móvil/touch. Expone `canRunUniverse` (el interruptor maestro) y los presupuestos de calidad (sombras, pixel ratio, partículas). |
| `AssetManager.js` | Carga y cachea las **imágenes reales** usadas como textura (fotos de categoría, portadas de proyectos, íconos 3D existentes). No inventa ningún archivo. |
| `AvatarProvider.js` | `AvatarImageProvider` (activo hoy): billboard circular construido en un `<canvas>` con la foto real de perfil, siempre mirando a la cámara. `AvatarGLBProvider` (stub): lanza error intencionalmente si se invoca — solo se implementará cuando `camila-avatar.glb` exista y pueda inspeccionarse. |
| `CameraController.js` | Interpola la posición/mirada de la cámara entre "waypoints" según el progreso de scroll, con `smoothstep` + `lerp` para que el movimiento sea cinematográfico, no un salto. |
| `SceneManager.js` | Construye **todas** las zonas procedurales (ver abajo) con geometría primitiva de Three.js, y expone `waypoints` (cámara) y `avatarWaypoints` (avatar) que consume `universe.js`. |
| `InteractionManager.js` | Raycasting contra los objetos interactivos de `SceneManager`. Reutiliza el cursor existente del sitio (`#cursorDot`/`#cursorLabel`) en vez de crear uno nuevo. Click → navega a la página de proyecto real vía `location.href`. |

`js/universe.js` es el orquestador: crea el renderer/escena/cámara, arranca el loop de render, sincroniza `CameraController`/avatar/`InteractionManager` con el scroll, y pausa el loop cuando la pestaña está oculta.

## Zonas construidas (todas proceduralmente, con fotos reales como textura)

| Zona | Eje Z aprox. | Corresponde a | Texturas reales usadas |
|---|---|---|---|
| Studio | 4 → -8 | Hero | `Desarrollo web.jpg`, `coca-cola-mag-cover.jpg` |
| Manifesto | -18 | Manifiesto | Frase real renderizada en canvas-texture |
| Universe | -28 → -46 | Universo creativo (5 portales) | Las 5 fotos de `assets/categories/` |
| Gallery | -58 | Piezas editoriales/ilustración destacadas | `new-yorker-ilustracion.jpg`, `maca-manual-marca.jpg`, `estereo-picnic-poster.jpg` |
| Lab | -74 | Desarrollo Web + IA | `Desarrollo web.jpg`; nodo generativo abstracto (no es un asset, es geometría) |
| Workflow | -90 → -110 | Proceso (6 estaciones reales) | Los 5 renders `icon3d-*.jpg` + una foto de categoría |
| Studio 2 | -122 | Sobre mí | `maria-camila-ortiz.jpg` |
| Threshold | -138 | Contacto | — (arco de luz procedural) |

Nada de esto reemplaza el contenido 2D real: cada zona es la ambientación detrás de la sección HTML correspondiente, que sigue mostrando el texto/carrusel/formulario real sin cambios.

## Avatar

- Hoy: `AvatarImageProvider`, un `THREE.Sprite` (billboard) con tu foto de perfil recortada en círculo, posicionado a lo largo de `avatarWaypoints` (sincronizado al mismo progreso de scroll que la cámara) — da la sensación de que te acompaña sin fingir una caminata 3D real.
- Mañana: cuando `assets/avatar/camila-avatar.glb` exista, cambia `Universe.AVATAR_MODEL_READY` a `true` en `js/universe/AvatarProvider.js` e implementa el cuerpo de `AvatarGLBProvider` (hoy deliberadamente lanza un error — no se escribió una implementación especulativa contra un archivo que no se puede inspeccionar). `universe.js` no necesita ningún cambio: ya decide cuál provider instanciar según ese flag.

## Fallback (sin WebGL / `prefers-reduced-motion`)

`PerformanceManager.canRunUniverse` es el único punto de control. Si es `false`, `universe.js` retorna inmediatamente: no se crea renderer, no se añade la clase `body.universe-active`, y por lo tanto **todo el CSS de transparencia queda inactivo** — cada sección conserva su fondo 100% opaco original. El sitio 2D funciona exactamente igual que antes de esta implementación.

## Transparencia de secciones (`body.universe-active`)

Cada sección que actúa como "ventana" al universo (hero, manifiesto, categorías, especialidades, proceso, contacto) solo se vuelve translúcida cuando `universe-active` está presente en `<body>`. "Sobre mí" y el footer se dejaron **siempre opacos** — contienen la biografía real y los enlaces de navegación, y la prioridad ahí es legibilidad, no atmósfera.

## Rendimiento

- Three.js y el arranque de la escena se difieren hasta después de `window.load` + `requestIdleCallback`, para no competir con el primer render.
- `shadowMap.autoUpdate = false`: las sombras solo se recalculan al cruzar de "década" de progreso de scroll (10 puntos de corte), no cada frame.
- Móvil: mismo universo, pero sin sombras y con `pixelRatio` limitado a 1.5 (ver `PerformanceManager`).
- El loop de render se pausa por completo si la pestaña se oculta (`visibilitychange`).

## Cómo sustituir cada placeholder por el asset real

| Placeholder actual | Se reemplaza por | Dónde |
|---|---|---|
| `AvatarImageProvider` (billboard con foto) | `AvatarGLBProvider` (modelo rigueado) | `js/universe/AvatarProvider.js`, flag `AVATAR_MODEL_READY` |
| Escritorio/monitor/revista procedurales del Studio | `studio.glb` | Dentro de `SceneManager._build()`, sección STUDIO — reemplazar las llamadas a `_pedestal`/`_framedImage` por `GLTFLoader.load('assets/environments/studio.glb', ...)` |
| Nodo generativo del Lab | `abstract-object.glb` | Sección LAB de `SceneManager._build()` |
| Pedestales/marcos de Gallery, Universe, Workflow | `frame.glb`, `magazine.glb`, `package.glb`, etc. | Cada sección correspondiente en `SceneManager._build()` |

En todos los casos, el patrón es el mismo: la función que hoy construye geometría con `THREE.BoxGeometry`/`THREE.CylinderGeometry` se reemplaza por una llamada a `GLTFLoader`, manteniendo la misma posición/rotación/`userData.link` — el resto del sistema (cámara, scroll, interacción) no necesita cambios.
