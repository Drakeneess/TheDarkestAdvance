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
