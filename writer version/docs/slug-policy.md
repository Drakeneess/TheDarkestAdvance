# Política de slugs editoriales

Los slugs de Writer son identidades editoriales estables. Se asignan cuando se crea o migra una entidad y no se recalculan cuando cambia su título.

## Normalización

`normalizeSlug` aplica una transformación determinista:

1. normalización Unicode NFKD;
2. eliminación de marcas diacríticas;
3. conversión a minúsculas;
4. sustitución de secuencias no alfanuméricas por `-`;
5. eliminación de guiones iniciales y finales.

Si el título no produce un slug utilizable se usa el fallback estable de la entidad y, como último recurso, `untitled`.

## Resolución de colisiones

`createUniqueSlug` conserva el slug base cuando está libre. Si ya existe, prueba de forma determinista `base-2`, `base-3`, etc. hasta encontrar el primer valor disponible.

La reserva local incluye entidades eliminadas mediante tombstone. Un slug previamente asignado no se reutiliza automáticamente para otra historia o capítulo, incluso si la entidad original fue eliminada.

El alcance de unicidad es:

- **Story:** único entre historias del Writer y único globalmente en la proyección pública.
- **Chapter:** único entre capítulos de la misma historia y único en la proyección pública dentro de `(workspaceId, storyId)`.

## Estabilidad de URL

Renombrar una Story o un Chapter cambia el título, pero no su slug. El slug no se deriva nuevamente del título después de la creación.

Duplicar una entidad crea una identidad nueva y resuelve su slug contra los slugs ya reservados.

Esto significa que una URL pública ya asignada permanece estable aunque el título editorial cambie.

## Publicación

El servidor de publicación no modifica ni renombra silenciosamente un slug para resolver conflictos. La proyección pública valida la propiedad del slug antes del `upsert` y PostgreSQL mantiene restricciones de unicidad como última defensa.

Si un slug ya pertenece a otra entidad, publicar falla de forma explícita:

- `STORY_SLUG_CONFLICT`: `El slug público de la historia ya está en uso.`
- `CHAPTER_SLUG_CONFLICT`: `El slug público del capítulo ya está en uso dentro de la historia.`

La transacción de publicación usa aislamiento `Serializable`. El Codex consume los slugs entregados por la API pública y no genera identidades alternativas.

## Consecuencia para sincronización offline

Dos dispositivos pueden crear entidades homónimas antes de sincronizarse. Writer resuelve determinísticamente las colisiones que conoce localmente; si una colisión solo aparece después de combinar estados remotos, la publicación es el límite autoritativo y rechaza el slug ocupado en lugar de cambiar una URL sin intervención editorial.
