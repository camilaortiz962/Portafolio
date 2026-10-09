---
name: analizar-sitio-web
description: Analiza un sitio web de referencia a partir de su URL (o del sitio abierto en el browser panel) y produce siempre tres entregables juntos — un resumen .md de menos de 300 palabras, la estructura semántica del sitio en .xml y una fila de 14 campos para la matriz comparativa CSV. Usar cuando la usuaria pida analizar, revisar o documentar un sitio web de referencia.
---

# Analizar sitio web de referencia

Proceso para analizar un sitio web de referencia y documentarlo de forma consistente, ejercicio tras ejercicio.

## Entrada

- Una URL que la usuaria da en el mensaje, **o**
- El sitio que tiene abierto en el browser panel (si no hay URL explícita, tomar la de la pestaña activa).

Si no hay ni URL ni sitio abierto, preguntar por la URL antes de seguir.

## 1. Recolectar información

1. Abrir el sitio (browser panel si está disponible; si no, WebFetch) y recorrer la home completa, de arriba abajo, incluyendo el menú abierto (hamburguesa / overlay) y el footer.
2. Visitar al menos un enlace interno para observar la **transición entre páginas**.
3. Revisar el código fuente / recursos cargados para detectar tecnología:
   - **CMS o builder**: WordPress (`wp-content`), Webflow (`data-wf-`, `webflow.js`), Framer (`framerusercontent`), Wix, Squarespace, Shopify, Next.js/Nuxt (`__NEXT_DATA__`, `_nuxt`), código a medida, etc.
   - **Librería de animación**: GSAP / ScrollTrigger, Lenis, Locomotive Scroll, Barba.js, Swup, Framer Motion, Three.js, Lottie, AOS, CSS puro, etc.
   - **Librería frontend**: React, Vue, Svelte, Astro, jQuery, vanilla JS, etc.
   - **Tipografía principal**: `font-family` de titulares (Google Fonts, Adobe Fonts, `@font-face`).
4. Si un dato no se puede verificar, escribir `no_detectado` (no inventar).

## 2. Nombres de archivo

Generar un `slug` a partir del dominio, sin `www.` ni TLD si no hace falta, en minúsculas y con guiones (ej. `https://www.lusion.co` → `lusion`). Si ya existe un archivo con ese slug, añadir sufijo `-2`, `-3`…

- Resumen: `OUTPUT/analisis_sitios_landing/resumenes/<slug>.md`
- XML: `OUTPUT/analisis_sitios_landing/xml/<slug>.xml`
- Matriz: `OUTPUT/analisis_sitios_landing/matriz_comparativa.csv`

Crear las carpetas si no existen.

## 3. Los tres entregables (siempre los tres, siempre juntos)

### Entregable 1 — Resumen (.md, < 300 palabras)

Encabezado con el nombre del sitio y la URL, y luego estas secciones breves:

- **Contenido**
- **Enfoque**
- **Público objetivo**
- **Estructura**
- **UX**
- **UI**

Contar las palabras antes de guardar: el total debe ser **menor a 300**.

### Entregable 2 — Estructura semántica (.xml)

Respetar exactamente este esquema. Usar solo estas etiquetas (las semánticas de HTML5 más las del esquema: `sitio`, `logo`, `nav`, `enlace`, `redes`, `contacto`). **No inventar nombres de etiqueta nuevos**; las variaciones se expresan con el atributo `tipo` de `section`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitio nombre="..." url="...">
  <header>
    <logo>...</logo>
    <nav tipo="fija | hamburguesa | mega-menu | overlay-fullscreen">
      <enlace>...</enlace>
    </nav>
  </header>
  <main>
    <section tipo="hero">...</section>
    <section tipo="...">...</section>
  </main>
  <footer>
    <redes>...</redes>
    <contacto>...</contacto>
  </footer>
</sitio>
```

Reglas:
- `nav tipo` toma **un solo** valor de: `fija`, `hamburguesa`, `mega-menu`, `overlay-fullscreen`.
- Una `<section>` por cada sección real de la home, en orden de aparición; la primera es `tipo="hero"`. El contenido de cada sección es una descripción corta de lo que contiene.
- Un `<enlace>` por cada ítem del menú principal.
- Escapar caracteres especiales (`&` → `&amp;`, etc.) y verificar que el XML esté bien formado.

### Entregable 3 — Fila de la matriz comparativa

Exactamente **14 campos**, en este orden, separados por ` ; ` (espacio, punto y coma, espacio):

```
url ; tipo_de_sitio ; cms_o_builder ; libreria_animacion ; libreria_frontend ; patron_navegacion ; num_secciones_home ; transicion_entre_paginas ; tipografia_principal ; estilo_visual ; fortaleza_ux ; oportunidad_mejora ; nombre_archivo_md ; nombre_archivo_xml
```

Reglas:
- `patron_navegacion` usa el mismo valor que `nav tipo` del XML.
- `num_secciones_home` es un número y coincide con la cantidad de `<section>` del XML.
- `nombre_archivo_md` y `nombre_archivo_xml` son solo el nombre del archivo (ej. `lusion.md`, `lusion.xml`).
- Ningún valor puede contener `;` ni saltos de línea. Si hay varias librerías, separarlas con ` + ` (ej. `GSAP + Lenis`).
- Valores cortos y concretos (frases breves en `fortaleza_ux`, `oportunidad_mejora` y `estilo_visual`).

**Guardar en el CSV sin borrar nada:**
- Si `matriz_comparativa.csv` no existe (o está vacío), crearlo con la línea de encabezado de arriba como primera línea y luego la fila.
- Si ya existe, **solo agregar** la nueva fila al final. Nunca sobrescribir ni reordenar las filas anteriores, ni repetir el encabezado.
- Si la URL ya tiene una fila, avisar a la usuaria y preguntar antes de agregar un duplicado.

## 4. Respuesta en el chat

Mostrar los tres entregables claramente marcados, en este orden:

```
## Entregable 1 — Resumen (.md)
<contenido del resumen>
Guardado en: OUTPUT/analisis_sitios_landing/resumenes/<slug>.md

## Entregable 2 — Estructura semántica (.xml)
<contenido del XML>
Guardado en: OUTPUT/analisis_sitios_landing/xml/<slug>.xml

## Entregable 3 — Fila de la matriz comparativa
<la fila>
Agregada a: OUTPUT/analisis_sitios_landing/matriz_comparativa.csv
```

Al final, indicar en una línea qué datos quedaron como `no_detectado`, si los hay.

## Checklist antes de terminar

- [ ] Resumen con menos de 300 palabras y las 6 secciones.
- [ ] XML bien formado, sin etiquetas inventadas, `nav tipo` con un valor válido.
- [ ] Fila con exactamente 14 campos separados por ` ; `.
- [ ] `num_secciones_home` = número de `<section>` en el XML.
- [ ] CSV con encabezado en la primera línea y filas anteriores intactas.
- [ ] Los tres entregables mostrados y marcados en el chat.
