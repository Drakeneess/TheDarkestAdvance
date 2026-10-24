# Story assets

Story Profile guarda **referencias públicas** a portada, hero/banner y logo/emblema. Los bytes viven fuera de SignalDB y fuera de PostgreSQL.

## Storage v1

El servidor Writer usa un directorio de archivos versionados:

- Desarrollo: `.data/story-assets` por defecto.
- Producción: un **Railway Volume persistente**, recomendado en `/data/story-assets`.

Configura:

```env
STORY_ASSET_STORAGE_DIR=/data/story-assets
STORY_ASSET_PUBLIC_BASE_URL=https://thedarkestadvance-production.up.railway.app/api/public/assets/stories
```

`STORY_ASSET_PUBLIC_BASE_URL` puede omitirse en desarrollo; el servidor la deriva de la petición. En producción conviene fijarla explícitamente para que la URL guardada no dependa de headers del proxy.

## Formatos y tamaño

Formatos aceptados:

- JPEG
- PNG
- WebP
- AVIF

Tamaño máximo: **10 MiB** por archivo.

SVG no forma parte de la v1. Para logos con transparencia usa PNG, WebP o AVIF.

## Ciclo de vida

Cada subida crea un objeto nuevo con un identificador UUID y extensión derivada del MIME:

```text
<uuid>.png
<uuid>.webp
...
```

Los objetos son **inmutables**. Reemplazar una portada no sobrescribe el archivo anterior:

1. Writer sube el nuevo archivo.
2. El servidor devuelve una URL pública nueva.
3. La UI coloca esa URL en el borrador de `Story.assets`.
4. `Guardar identidad` actualiza la Story local y su revisión.
5. `Publicar cambios` actualiza `PublishedStory` cuando el autor lo decide.
6. El asset anterior permanece disponible, por lo que una proyección pública anterior no queda rota durante la transición.

No hay garbage collection automática en v1. La retención deliberada prioriza URLs estables y rollback editorial. Una política de GC futura debe demostrar que una URL ya no está referenciada por ninguna proyección/publicación antes de eliminar el archivo.

## URL pública y caché

Los archivos se sirven desde:

```text
GET /api/public/assets/stories/:assetId
```

Respuesta:

```http
Cache-Control: public, max-age=31536000, immutable
X-Content-Type-Options: nosniff
```

Como cada reemplazo genera una URL nueva, un TTL de 1 año no produce contenido obsoleto: la identidad del recurso cambia junto con sus bytes.

## Upload desde Writer

Writer usa:

```text
POST /api/assets/stories/:storyId/:kind?workspaceId=<workspace>
```

`kind` puede ser:

- `cover`
- `hero`
- `logo`

El body es el archivo binario directo y `Content-Type` debe ser uno de los MIME soportados.

La ruta exige:

- sesión Writer válida;
- acceso al workspace;
- una Story sincronizada activa en ese workspace.

Subir un archivo **no modifica automáticamente la Story**. El usuario puede inspeccionar la nueva URL/preview y confirmarla con `Guardar identidad`.

## Operación en Railway

Antes de habilitar uploads en producción:

1. Crea/monta un Railway Volume en el servicio del backend.
2. Móntalo, por ejemplo, en `/data`.
3. Configura `STORY_ASSET_STORAGE_DIR=/data/story-assets`.
4. Configura `STORY_ASSET_PUBLIC_BASE_URL` con el dominio público estable del backend.
5. Redeploy.
6. Sube una imagen de prueba desde Writer y verifica que la URL pública sigue respondiendo después de un segundo deploy.

Sin un Volume persistente, el filesystem del contenedor es efímero y **no es válido para assets publicados**.

## Evolución

La UI y Story Profile solo conocen URLs públicas. El storage está encapsulado detrás de `server/src/assets/story-asset-storage.ts`, por lo que una migración futura a S3/R2/B2 puede conservar el contrato de Writer y Codex.
