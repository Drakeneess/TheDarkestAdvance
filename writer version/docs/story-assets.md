# Story assets

Story Profile guarda **referencias públicas** a portada, hero/banner y logo/emblema. Los bytes viven fuera de SignalDB y fuera de PostgreSQL.

## Storage v1

El backend Writer usa un **Railway Storage Bucket privado y S3-compatible**.

El bucket se llama `story-assets` en el proyecto Railway. Los objetos se guardan con claves versionadas:

```text
stories/<uuid>.png
stories/<uuid>.webp
...
```

El backend es el único componente con credenciales S3. Writer nunca recibe secretos del bucket y Codex sigue consumiendo las URLs públicas del backend.

Variables del servicio:

```env
STORY_ASSET_S3_ENDPOINT=${{story-assets.ENDPOINT}}
STORY_ASSET_S3_BUCKET=${{story-assets.BUCKET}}
STORY_ASSET_S3_REGION=${{story-assets.REGION}}
STORY_ASSET_S3_ACCESS_KEY_ID=${{story-assets.ACCESS_KEY_ID}}
STORY_ASSET_S3_SECRET_ACCESS_KEY=${{story-assets.SECRET_ACCESS_KEY}}
STORY_ASSET_S3_URL_STYLE=virtual-host
STORY_ASSET_PUBLIC_BASE_URL=https://thedarkestadvance-production.up.railway.app/api/public/assets/stories
```

Railway Buckets son privados. Los archivos públicos se sirven mediante proxy desde el backend:

```text
GET /api/public/assets/stories/:assetId
```

## Formatos y tamaño

Formatos aceptados:

- JPEG
- PNG
- WebP
- AVIF

Tamaño máximo: **10 MiB** por archivo.

SVG no forma parte de la v1. Para logos con transparencia usa PNG, WebP o AVIF.

El servidor valida tanto el MIME declarado como la firma básica del archivo. Declarar bytes arbitrarios como `image/png` no crea un asset válido.

## Ciclo de vida

Cada subida crea un objeto nuevo con un identificador UUID y extensión derivada del MIME.

Los objetos son **inmutables por diseño**. Reemplazar una portada no sobrescribe el archivo anterior:

1. Writer sube el nuevo archivo.
2. El backend crea un nuevo objeto S3.
3. El servidor devuelve una URL pública nueva.
4. La UI coloca esa URL en el borrador de `Story.assets`.
5. `Guardar identidad` actualiza la Story local y su revisión.
6. `Publicar cambios` actualiza `PublishedStory` cuando el autor lo decide.
7. El asset anterior permanece disponible, por lo que una publicación anterior no queda rota durante la transición.

Railway Buckets no tienen object versioning habilitable actualmente; nuestra inmutabilidad se obtiene creando una clave UUID nueva en cada upload.

No hay garbage collection automática en v1. La retención deliberada prioriza URLs estables y rollback editorial. Una política de GC futura debe demostrar que una URL ya no está referenciada antes de eliminar el objeto.

Una subida cancelada antes de `Guardar identidad` puede dejar un asset huérfano. Esto es deliberado en v1 y entra en la misma futura política de GC.

## URL pública y caché

El backend responde con:

```http
Cache-Control: public, max-age=31536000, immutable
X-Content-Type-Options: nosniff
```

Como cada reemplazo genera una URL nueva, un TTL largo no produce contenido obsoleto: la identidad del recurso cambia junto con sus bytes.

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
- acceso al workspace.

No exige que la Story ya exista en `SyncEntity`. Esto permite subir la portada de una historia recién creada antes de su primer sync. La pertenencia editorial se confirma cuando la URL se guarda en `Story.assets`.

Subir un archivo **no modifica automáticamente la Story**. El usuario puede inspeccionar la nueva URL/preview y confirmarla con `Guardar identidad`.

## Implementación S3

`server/src/assets/story-asset-storage.ts` usa peticiones S3 firmadas con AWS Signature V4 mediante primitivas nativas de Node (`fetch`, `crypto` y streams). No añade AWS SDK ni modifica el lockfile.

Railway usa virtual-hosted style para este bucket, por lo que el backend construye URLs S3 de la forma:

```text
https://<bucket>.<endpoint>/stories/<assetId>
```

La URL S3 nunca se publica al navegador: se usa solamente entre backend y bucket.

## Operación en Railway

- El bucket `story-assets` debe existir en el mismo environment que el backend.
- Las credenciales se conectan mediante Variable References de Railway, no copiando secretos.
- Rotar credenciales del bucket no requiere cambiar código; las referencias siguen apuntando al recurso.
- `STORY_ASSET_PUBLIC_BASE_URL` debe apuntar al dominio estable del backend.

No se necesita Volume ni almacenamiento persistente montado en el servicio.
