# Writer

Base local-first para un editor y versionador de historias construido con React, TypeScript y SignalDB.

## Stack

- React + TypeScript + Vite
- SignalDB
- IndexedDB
- Maverick Signals para reactividad
- PWA con `vite-plugin-pwa`
- Capacitor 8 preparado para Android

## Ejecutar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Android

La configuración de Capacitor ya está incluida. La primera vez:

```bash
npm install
npx cap add android
npm run mobile:android
```

Después de modificar la aplicación web basta con:

```bash
npm run mobile:android
```

`mobile:android` compila React, sincroniza `dist` con el proyecto Android y abre Android Studio.

## Servidor de sincronización

El backend vive en `server/` y requiere PostgreSQL, `DATABASE_URL` y credenciales de Writer configuradas mediante `WRITER_AUTH_TOKENS`.

Después de configurar `server/.env`:

```bash
cd server
npm install
npm run prisma:migrate
npm run dev
```

### Conceder acceso a un workspace

Autenticarse no concede acceso a ningún workspace automáticamente. Cada combinación `workspaceId` + `userId` debe existir en `sync_workspace_access` antes de sincronizar.

Ejemplo para el workspace de desarrollo actual:

```sql
INSERT INTO "sync_workspace_access" ("workspaceId", "userId")
VALUES ('writer-test', 'local-writer')
ON CONFLICT ("workspaceId", "userId") DO NOTHING;
```

El `userId` debe coincidir con una clave configurada en `WRITER_AUTH_TOKENS`. El `workspaceId` enviado por el cliente no se considera prueba de acceso.

### Sesión del cliente de sync

La credencial Bearer se conserva en `sessionStorage`; no forma parte de las entidades de SignalDB, checkpoints ni mutaciones del outbox. Un 401 elimina la credencial local para evitar seguir usando una sesión rechazada.

Mientras no exista una pantalla de autenticación, el bridge de desarrollo permite iniciar la sesión manualmente. Configura `VITE_SYNC_DEBUG=true` y, desde la consola del navegador:

```js
await window.__writerSyncDebug?.auth('<bearer-token>')
```

El helper guarda la sesión y solicita inmediatamente un ciclo de sync. También están disponibles:

```js
window.__writerSyncDebug?.hasAuth()
window.__writerSyncDebug?.clearAuth()
```

No uses una variable `VITE_*` para almacenar el Bearer token: Vite incorpora esas variables al bundle del cliente.

### Pruebas de Secure Sync

La suite de acceso necesita una base PostgreSQL separada. No apuntes `TEST_DATABASE_URL` a producción ni a una base con datos que quieras conservar.

Primero aplica las migraciones sobre la base de test:

```bash
DATABASE_URL="postgresql://.../writer_sync_test" npm run prisma:deploy
```

Luego ejecuta:

```bash
TEST_DATABASE_URL="postgresql://.../writer_sync_test" npm run test:access
```

La suite limpia únicamente el workspace `secure-sync-test-workspace` y cubre acceso sin autenticación, workspace sin grant, allowlist CORS y un flujo autorizado con mutación aplicada + pull remoto.

## Modelo actual

- `stories`: obras/proyectos narrativos.
- `chapters`: capítulos pertenecientes a una historia.
- `chapterVersions`: snapshots inmutables del contenido de un capítulo.

Cada nueva versión guarda `parentVersionId`, dejando preparada la estructura para diff, restauración y ramas.

## Persistencia

Las tres colecciones se persisten en IndexedDB mediante `@signaldb/indexeddb`. Los datos siguen disponibles al recargar o trabajar offline.

## Próximos pasos

1. Navegación y editor real de capítulos.
2. Historial de versiones y diff.
3. Autosave/drafts y snapshots explícitos.
4. Importar/exportar `.md` y `.mdx`.
5. Backend de sincronización con `@signaldb/sync`.
6. Generar APK/AAB desde el proyecto Android de Capacitor.
