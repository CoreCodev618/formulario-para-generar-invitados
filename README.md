<div align="center">

# ✦ Registro de Invitados ✦

**Generador de listas de invitados para cualquier evento** — con vista previa y descarga en `.txt` y **PDF**.

JavaScript puro. Sin frameworks, sin bibliotecas externas.

[🌐 Ver el sitio en vivo](https://corecodev618.github.io/formulario-para-generar-invitados/)

---

</div>

## ✨ Características

- **Datos del evento**: tipo (Boda, Cumpleaños, Aniversario, Graduación, Bautizo, Baby Shower, Compromiso, Reunión familiar, Fiesta de empresa, Velorio u *Otro*…), fecha y lugar.
- **Accesos rápidos de fecha**: chips para *Hoy*, *Mañana* y *+7 días*.
- **Lista de invitados dinámica**: de 1 a 50 invitados, con campos de:
  - Nombre completo
  - Correo electrónico ✓ (validado)
  - Teléfono con selector de **24 países** (Perú 🇵🇪 primero) y tope de dígitos según el país
  - Relación con el anfitrión (Familia, Amigo, Trabajo u *Otro*… con campo extra)
- **Validación en tiempo real**: los errores se muestran solo al salir de cada campo o al guardar, sin molestar mientras escribes.
- **Eliminar invitados**: cada bloque se puede quitar y la lista se renumerá automáticamente.
- **Vista previa en modal** antes de descargar, con dos pestañas: `.txt` y diseño PDF elegante (marco dorado, ornamento y fuentes clásicas).
- **Descarga real de archivos** sin servidor (Blob + `URL.createObjectURL`):
  - 📄 `.txt` con formato estructurado
  - 🖨️ **PDF A4 generado a bajo nivel** (objetos, `xref`, texto WinAnsi) — sin librerías
- **Reiniciar** el formulario completo con un clic.
- **Accesibilidad**: etiquetas, `aria-label`, soporte de teclado (Esc cierra el modal).

## 🖥️ Cómo usarlo

1. Completa los datos del evento.
2. Elige cuántos invitados quieres (1–50) y pulsa **Agregar invitados**.
3. Llena los datos de cada invitado.
4. Pulsa **Guardar** → revisa la vista previa.
5. Elige **Descargar .txt** o **Descargar PDF**.

## 🧱 Estructura del proyecto

```
formulario-para-generar-invitados/
├── index.html      → Estructura del formulario y modal
├── styles.css      → Estilos y diseño visual
├── script.js       → Toda la lógica (validación, PDF, descargas)
├── icono-lista.ico → Favicon
└── README.md       → Este archivo
```

### Organización de `script.js`

1. Referencias al DOM
2. Constantes (países, límites, relaciones)
3. Utilidades
4. Validación
5. Bloques dinámicos de invitados
6. Selector de evento + fecha rápida
7. Recolección de datos y formato `.txt`
8. Descargas (Blob)
9. Generador de PDF (sección independiente)
10. Guardar y modal de vista previa
11. Reiniciar formulario

> El generador de PDF está separado a propósito: dibuja las páginas a bajo nivel (~línea por línea) y es la parte más avanzada del código.

## 🔗 Enlace

| Recurso | URL |
|---|---|
| 🌐 Sitio web (GitHub Pages) | https://corecodev618.github.io/formulario-para-generar-invitados/ |
| 📦 Repositorio | https://github.com/CoreCodev618/formulario-para-generar-invitados |

---

<div align="center">

**Tarea I · Programación Web II**

Hecho con HTML, CSS y JavaScript puro 🚀

</div>