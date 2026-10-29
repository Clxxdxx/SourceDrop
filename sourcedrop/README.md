# SourceDrop — MVP

> Capture provenance, not bibliography.

SourceDrop es una extensión Chrome Manifest V3, sin cuentas, sin IA y sin servidores. Permite seleccionar texto en una web, guardarlo junto con su procedencia y copiarlo posteriormente en varios formatos.

## Estructura

- `manifest.json`: configuración Manifest V3.
- `background.js`: service worker; crea los menús contextuales y procesa guardar/copiar.
- `popup.html/css/js`: historial, búsqueda, copia, favoritos, borrado y exportación.
- `options.html/js`: formato por defecto y preferencia de fecha.
- `lib/storage.js`: única capa de acceso a `chrome.storage.local`.
- `lib/formatters.js`: formatos Plain, Quote + URL y Markdown.
- `lib/license.js`: límite freemium y punto futuro de integración con ExtensionPay.
- `_locales/en`, `_locales/es`: textos traducidos con `chrome.i18n`.
- `icons/`: iconos PNG para Chrome.

## Decisiones del MVP

1. **Límite de selección:** 5.000 caracteres. Se rechaza una selección mayor para evitar clips accidentales enormes.
2. **Duplicados:** se considera duplicado el mismo texto + la misma URL. No se crea un segundo clip.
3. **Límite gratuito:** está definido una sola vez como `FREE_CLIP_LIMIT = 100` en `lib/license.js`.
4. **Fecha:** se guarda siempre como ISO en el clip. La opción de usuario controla si el formateador Markdown muestra la fecha de acceso.
5. **Copia desde el menú contextual:** se intenta mediante `chrome.scripting.executeScript` y `navigator.clipboard.writeText`. No se solicitan `host_permissions`.
6. **Páginas protegidas:** `chrome://`, `edge://`, `about:` y `devtools:` se rechazan explícitamente.
7. **Datos:** todo vive en `chrome.storage.local`. No hay fetch, XMLHttpRequest, analítica ni servicios externos.
8. **Seguridad DOM:** el contenido de usuario se inserta con `textContent`, nunca con `innerHTML`.
9. **Tags:** se guardan como `[]`, pero la interfaz de edición de tags queda fuera del MVP.

## Permisos

- `contextMenus`: necesario para mostrar las acciones de SourceDrop al hacer clic derecho sobre texto seleccionado.
- `storage`: necesario para persistir clips y ajustes en `chrome.storage.local`.
- `activeTab`: proporciona acceso temporal a la pestaña que el usuario está utilizando después de una interacción explícita.
- `scripting`: necesario para ejecutar de forma puntual la función de copia al portapapeles en la pestaña activa.

No se usa `host_permissions` ni `<all_urls>`. La extensión no realiza peticiones de red.

## Instalación local

1. Abre `chrome://extensions`.
2. Activa **Developer mode / Modo desarrollador**.
3. Pulsa **Load unpacked / Cargar descomprimida**.
4. Selecciona la carpeta `sourcedrop`.
5. Si ya había una versión cargada, pulsa Reload cuando cambies código.

## Pruebas manuales

- Seleccionar texto normal y usar **Save quote with source**.
- Seleccionar texto y usar **Copy quote with source**.
- Abrir el popup y comprobar que el clip aparece el primero.
- Buscar por texto.
- Buscar por título.
- Buscar por URL.
- Copiar un clip usando cada formato.
- Marcar/desmarcar favorito.
- Borrar un clip.
- Exportar JSON.
- Exportar Markdown.
- Cambiar formato por defecto en Options.
- Activar/desactivar fecha.
- Intentar guardar la misma combinación texto + URL dos veces.
- Seleccionar más de 5.000 caracteres.
- Usar una selección vacía.
- Probar `chrome://extensions` o `chrome://version`: debe avisar con badge.
- Para probar el límite de 100 sin realizar 100 capturas manuales, puedes usar DevTools de la página de extensión para poblar `chrome.storage.local`; después abre el popup y verifica el bloqueo. El comportamiento de límite se ejecuta en `lib/storage.js`.
- Cambiar `DEV_FORCE_PRO` a `true` en `lib/license.js` y recargar la extensión para inspeccionar el comportamiento Pro.

## Carga y revisión de Chrome Web Store

Antes de publicar:

- Preparar descripción corta y larga.
- Crear capturas del popup y Options.
- Preparar icono/branding final.
- Declarar una política de privacidad coherente con el hecho de que los datos son locales.
- Justificar los permisos solicitados.
- Revisar el flujo de copia en las superficies restringidas por Chrome.
- Revisar CSP y políticas actuales de Chrome Web Store.
- Incrementar la versión en `manifest.json` para cada subida.

## ExtensionPay futuro

`lib/license.js` es el punto único de decisión. En una integración real, ahí se inicializaría ExtensionPay y se consultaría el estado de licencia según el SDK y la documentación vigente. No se debe convertir `DEV_FORCE_PRO` en un mecanismo de licencia real.

No se carga ExtensionPay en este MVP para cumplir el requisito de cero servicios externos.

## Fuera del MVP a propósito

- Pagos.
- Cuentas.
- Servidor/backend.
- Sincronización de clips.
- Tags editables.
- Plantillas personalizadas.
- Búsqueda avanzada.
- Filtros de favoritos.
- Analítica.
- IA.
- Comandos de teclado.
- Edición avanzada de clips.
