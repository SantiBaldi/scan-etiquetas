# Scanner Etiquetas Pallet · v2.0

App web (PWA) para registrar las 3 etiquetas con código de barras de pallets en planta. Combina el pipeline confiable que ya validaste (barcode → OCR español → llena formulario) con captura desde **cámara en vivo + botón Escanear**, evitando tener que pasar por la cámara nativa del Android cada vez.

---

## Cambios v2.0 (vs versión anterior)

- **Cámara en vivo siempre visible** en la pantalla principal con `getUserMedia`.
- **Botón ESCANEAR captura el frame actual** y lo procesa con el mismo pipeline que ya te funciona.
- **Pipeline preservado**: barcode primero → si falta algo, OCR español sobre la misma imagen.
- **Tesseract precarga en background** al abrir la app — cuando necesitás OCR, ya está listo.
- **Compresión de imagen a 1280px** antes del OCR — velocidad similar a la versión que te funciona.
- **Soporte de linterna/flash** (botón aparece automáticamente si el dispositivo lo soporta).
- **Auto-focus continuo** activado si está disponible.
- **Frame congelado** después de escanear para que veas exactamente qué se procesó. Tap encima vuelve a preview en vivo.
- **Botón secundario para importar foto** (fallback si la cámara en vivo falla).
- **Botón GUARDAR** se habilita automáticamente cuando los 3 campos tienen datos (manual o automático).
- **PWA**: instalable en home screen, funciona offline después del primer load.
- **Service worker** cachea Tesseract + XLSX → todo offline una vez descargado.

---

## Flujo de uso

1. Abrís la app → cámara en vivo activa, lista.
2. Apuntás a la etiqueta dentro del recuadro guía.
3. Tap **📸 Escanear** → frame se congela, app procesa.
4. Pipeline:
   - **Barcode primero**: detecta los 3 barcodes y los asigna por formato.
   - **Si faltan campos** → OCR español automático sobre la misma imagen.
   - Llena los inputs con badges de color (verde = barcode, naranja = OCR).
5. Verificás los valores, corregís si hace falta tipeando directo en los inputs.
6. Tap **✚ Guardar** → registro persistido.
7. Vuelve a cámara en vivo, listo para el próximo pallet.

---

## Validaciones de formato (para clasificar barcodes)

| Campo | Formato | Ejemplo |
|---|---|---|
| Código Producto | `9` + 6 dígitos | `9012090` |
| Cantidad | Entero positivo | `22200` |
| OF / Lote | 7 dígitos + letras opcionales | `3264952C` |

El formulario **acepta cualquier valor** que tipees a mano (no bloquea registro por validación), porque a veces hay etiquetas atípicas.

---

## OCR — extracción de texto en español

Cuando los barcodes no alcanzan, busca:

- **Producto**: patrón `9XXXXXX` en el texto.
- **Cantidad**: número después de la palabra `CANTIDAD`. Fallback: cualquier entero de 3-6 dígitos que no sea producto.
- **OF/Lote**: patrón después de `OF/LOTE` o `LOTE`. Fallback: 7 dígitos + letra.

Idioma OCR: **español (`spa`)** — más preciso para etiquetas en español que el inglés.

---

## Linterna / Flash

Si tu Android lo soporta, aparece un botón con ícono de linterna arriba a la derecha del preview. Tap para encender/apagar. Útil en zonas oscuras de planta.

---

## Archivos

```
scan-etiquetas/
├── index.html              ← la app
├── manifest.json
├── sw.js                   ← service worker (cache offline)
├── icon-192.png
├── icon-512.png
├── icon-maskable-512.png
└── README.md
```

---

## Deploy en GitHub Pages

1. En tu repo `scan-etiquetas`: reemplazá `index.html`, `sw.js` y `README.md` con los nuevos.
2. Los íconos y `manifest.json` siguen igual (no necesitás re-subir).
3. Commit changes.
4. Esperá ~1 min y abrí tu URL `https://santibaldi.github.io/scan-etiquetas/`.

### Forzar actualización en dispositivos ya instalados

El `sw.js` nuevo trae `CACHE_VERSION = 'v2.0.0'` → la próxima vez que el dispositivo abra la app con internet, se actualiza solo. Si querés forzarlo:

- **PC Chrome**: `Ctrl + Shift + R`.
- **Android**: cerrá la app completamente (recientes → swipe), abrila de nuevo.

---

## Compatibilidad

| Plataforma | Cámara live | Import foto | OCR | PWA |
|---|---|---|---|---|
| Chrome Android | ✅ | ✅ | ✅ | ✅ |
| Edge Android | ✅ | ✅ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ | ✅ |
| Firefox Android | ❌ barcode | ✅ | ✅ | ⚠️ |
| iOS Safari | ❌ barcode | ✅ | ✅ | ⚠️ |

**Recomendado**: Chrome en Android (donde ya validaste que funciona la app vieja).

---

## Datos

- Storage: `localStorage` con clave `scanner_etiquetas_v2`.
- Export: `.xlsx` real (XLSX.js) con 5 columnas: `#`, `Fecha`, `Producto`, `Cantidad`, `OF/Lote`.
- Sobrevive: reinicios, modo avión, sin internet.
- Se borra: si tap "Borrar todo" + confirma, o si se limpia el navegador.

**Recomendación operativa**: exportar Excel al final de cada turno como backup.
