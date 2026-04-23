# SCAN Etiquetas Pallet · PWA

App web para registrar las 3 etiquetas con código de barras de un pallet. Clasifica cada barcode por formato específico (producto, cantidad, OF/lote), tiene fallback OCR y edición manual. Persiste en el dispositivo y exporta a CSV.

Funciona como PWA: instalable en el home screen del Android, offline después del primer load.

---

## Novedades v1.1.0

- **Estabilización por slot con grace period de 2.5s** — el barcode detectado se mantiene en pantalla aunque el siguiente frame no lo vea, eliminando el parpadeo.
- **Validación por formato específico** por slot:
  - `01 Producto`: `9XXXXXX` (7 dígitos empezando con 9)
  - `02 Cantidad`: entero positivo
  - `03 OF/Lote`: `XXXXXXX` + letras opcionales (`3264952C`)
- **Clasificación robusta**: los barcodes se asignan a su slot por validación de formato (no por posición Y), así la lectura es correcta aunque la foto esté rotada.
- **Fallback OCR con Tesseract.js**: si después de 4 segundos no se leen los 3 barcodes, aparece el botón "LEER POR TEXTO (OCR)". Toma el frame actual, extrae texto con OCR local (offline tras primer uso) y parsea los 3 valores buscando keywords `Cantidad` y `OF/LOTE`.
- **Edición manual**: botón `EDIT` en cada slot abre modal para corregir a mano.
- **Indicadores visuales claros** por slot:
  - Verde `✓` = barcode leído y validado.
  - Amarillo `...` = detectado pero esperando confirmación.
  - Amarillo `FORMATO?` = leído pero no cumple el formato esperado.
  - Amarillo `OCR` / `MANUAL` = valor desde OCR o editado a mano.
- **Origen** de cada slot se preserva y se exporta al CSV.

---

## Características

- Escaneo en vivo con `BarcodeDetector` nativo.
- Importación de fotos (galería o cámara).
- Fallback OCR (Tesseract.js) para etiquetas dañadas o con barcodes ilegibles.
- Edición manual de cada slot.
- Persistencia en `localStorage`.
- Export CSV (BOM UTF-8, separador `;`, listo para Excel ES).
- Offline real (service worker cache).

---

## Archivos

```
scan-etiquetas/
├── index.html              ← la app
├── manifest.json           ← metadata PWA
├── sw.js                   ← service worker
├── icon-192.png
├── icon-512.png
├── icon-maskable-512.png
└── README.md
```

---

## Deploy en GitHub Pages

### Una sola vez

1. Crear repo público en GitHub.
2. Subir todos los archivos de esta carpeta a la raíz.
3. Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.
4. Esperar 1-2 min. URL: `https://TUUSUARIO.github.io/scan-etiquetas/`.

### Instalar en el Android

1. Abrir la URL en Chrome.
2. Aceptar permiso de cámara.
3. Menú ⋮ → "Instalar app" / "Agregar a pantalla principal".

### Actualizar después

1. Editás los archivos.
2. **Siempre** subí el número en `sw.js`: `const CACHE_VERSION = 'v1.1.0';` → `'v1.1.1'`. Sin eso, los dispositivos siguen sirviendo la versión cacheada.
3. Subí los cambios al repo.

---

## Flujo de uso

**Caso feliz (3 barcodes legibles):**

1. Apuntás la cámara a la etiqueta dentro del recuadro.
2. Los 3 slots se llenan y se ponen verdes con `✓`.
3. Botón REGISTRAR se ilumina verde.
4. Tap → registrado. Limpia slots para el próximo pallet.

**Caso degradado (barcodes rotos / ilegibles):**

1. Apuntás la cámara — no se leen los 3 barcodes.
2. Después de 4 segundos aparece el botón amarillo "LEER POR TEXTO (OCR)".
3. Tap → toma el frame actual → procesa con OCR (primera vez descarga ~3MB de wifi).
4. Llena los slots con los valores extraídos del texto.
5. Si alguno está mal o falta, tap `EDIT` en el slot y corregís.
6. Tap REGISTRAR.

**Importar foto:**

1. Botón arriba a la derecha del área de cámara (ícono de foto).
2. Elegí foto de galería o sacás una nueva.
3. Intenta leer barcodes; si fallan, podés tap OCR.

---

## Validaciones por slot

| Slot | Campo | Formato | Ejemplo |
|---|---|---|---|
| 01 | Producto | `^9\d{6}$` | `9012090` |
| 02 | Cantidad | `^\d+$` | `22200` |
| 03 | OF/Lote | `^\d{7}[A-Z]*$` | `3264952C` |

Si necesitás cambiar las reglas, editá el objeto `VALIDATORS` en `index.html`:
```js
const VALIDATORS = {
  1: { regex: /^9\d{6}$/, label: 'Producto', hint: '...', sample: '9012090' },
  2: { regex: /^\d+$/,    label: 'Cantidad', hint: '...', sample: '22200'   },
  3: { regex: /^\d{7}[A-Z]*$/i, label: 'OF/Lote', hint: '...', sample: '3264952C' }
};
```

---

## Notas sobre OCR

- **Librería**: Tesseract.js 5 (open source, MIT).
- **Procesamiento**: 100% local en el dispositivo. Nada se envía a servidores externos.
- **Primera carga**: ~3MB (código + idioma inglés). Requiere internet la primera vez.
- **Cargas siguientes**: el service worker lo cachea. Funciona offline.
- **Velocidad típica**: 3-8 segundos por foto en un Android medio.
- **Parsing**: busca `9` + 6 dígitos para producto, número después de `Cantidad`, y 7 dígitos + letras cerca de `OF/LOTE`. Si algún valor no lo encuentra, queda vacío para que lo completes con EDIT.

---

## CSV exportado

```
timestamp_iso;fecha;hora;producto_01;cantidad_02;of_lote_03;origen
2026-04-22T16:32:39.000Z;22/4/2026;16:32:39;9012090;22200;3264952C;cam
```

`origen` puede ser: `cam` (barcode en vivo), `foto` (barcode en foto importada), `ocr`, `manual`. Si los 3 slots tienen orígenes distintos, gana el de mayor "intervención" del usuario (manual > ocr > foto > cam).

---

## Datos

- Clave de localStorage: `scan_etiquetas_v1`.
- Se mantienen entre reinicios, modo avión y sin internet.
- Se borran si el usuario limpia datos del navegador, desinstala la PWA, o usa el botón "BORRAR".
- **Recomendación operativa**: exportar CSV al final de cada turno.
