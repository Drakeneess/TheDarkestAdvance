# Story Profile — Identidad visual

La pestaña **Identidad** de Writer guarda una configuración semántica. Writer no publica CSS arbitrario: el Codex resuelve estas claves contra registros cerrados y aplica fallbacks seguros cuando una clave no existe.

## Tema base

`themeKey` selecciona el tema del que hereda la obra. Actualmente el Codex registra:

- `codex`
- `fossil`
- `classified`
- `cruxball`
- `tundra`
- `sphere`
- `incident`

Una clave desconocida cae en `codex`.

## Colores

Los overrides `accent`, `accentSoft`, `background` y `panel` aceptan colores hexadecimales seguros:

- `#RGB`
- `#RGBA`
- `#RRGGBB`
- `#RRGGBBAA`

Ejemplo: `#8A2A45`.

Un valor vacío hereda del tema base. Un valor no reconocido por el Codex también conserva el valor del tema base.

## Tipografías

Claves soportadas:

- `serif` — Georgia / Times New Roman
- `sans` — pila sans del sistema
- `mono` — pila monoespaciada del sistema

Vacío o clave desconocida: se conserva la tipografía base del Codex.

## Ornamentos

Claves soportadas:

- `section` — §
- `diamond` — ◆
- `star` — ✦
- `none` — sin ornamento

## Texturas

Claves soportadas:

- `none`
- `grain`
- `paper`
- `scanlines`

Las texturas se aplican a catálogo y ficha de obra. No se aplican dentro del scroller del lector para conservar el presupuesto de renderizado.

## Ancho de lectura

- `narrow` — 44rem
- `standard` — 56rem
- `wide` — 68rem

El ancho modifica únicamente la columna de prosa; no altera la altura ni el containment del lector.

## Recursos visuales

`coverImageUrl`, `heroImageUrl` y `logoImageUrl` deben ser URLs públicas accesibles por el navegador. La subida y gestión de archivos no forma parte de Story Profile v1.

## Resolución en Codex

La precedencia es:

1. `themeKey` aporta la identidad base.
2. Story Profile aplica overrides seguros.
3. Claves desconocidas o colores inválidos caen al valor heredado.
4. El lector usa solo paleta, tipografía y ancho; no incorpora texturas ni efectos pesados.
