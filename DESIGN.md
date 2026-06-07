---
version: alpha
name: "Score-Slice"
colors:
  primary:
    50: "#f0f9ff"
    100: "#e0f2fe"
    500: "#0ea5e9"
    600: "#0284c7"
    700: "#0369a1"
  slate:
    50: "#f8fafc"
    100: "#f1f5f9"
    200: "#e2e8f0"
    300: "#cbd5e1"
    400: "#94a3b8"
    500: "#64748b"
    600: "#475569"
    700: "#334155"
    800: "#1e293b"
    900: "#0f172a"
  accent:
    amber: "#f59e0b"
    blue: "#3b82f6"
typography:
  family:
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
  size:
    xs: "0.75rem"
    sm: "0.875rem"
    base: "1rem"
    lg: "1.125rem"
    xl: "1.25rem"
    "2xl": "1.5rem"
  weight:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700
rounded:
  none: "0px"
  sm: "0.125rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  "2xl": "1rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
---

# DESIGN.md - Sistema de Diseño de Score-Slice

Este documento define el lenguaje visual y los tokens de diseño de **Score-Slice** siguiendo la especificación oficial de **Google Stitch**. Actúa como una fuente de verdad para que tanto desarrolladores como agentes de IA mantengan la coherencia visual.

> [!NOTE]
> En la implementación actual, estos tokens están definidos como propiedades personalizadas de CSS dentro de la directiva `@theme` en el archivo de estilos principal del frontend: [index.css](file:///Users/osvaldo/Documents/Desarrollo/score-slice/apps/web/src/index.css).

## ## Overview
La estética de **Score-Slice** se define como **"Minimalismo Funcional con Acentos de Precisión"**. El objetivo es proporcionar un entorno de trabajo limpio y sin distracciones para músicos, utilizando efectos de "glassmorphism", elevaciones sutiles y una jerarquía tipográfica clara.

## ## Colors
El sistema utiliza una paleta base de **Slate** para la estructura y una gama de **Primary Blue** para las acciones principales.

*   **Primary (Sky/Blue):** Utilizado para botones de acción principal, indicadores de estado activo y branding.
*   **Slate:** Controla el fondo, las superficies y el texto. Proporciona un contraste suave que reduce la fatiga visual.
*   **Acentos:**
    *   **Amber:** Identifica slices activos o seleccionados en el editor.
    *   **Blue:** Identifica slices inactivos o áreas de referencia.

## ## Typography
Se prioriza el uso de tipografías **Sans-Serif** modernas para asegurar la legibilidad en pantallas de alta densidad.
*   **Títulos:** Pesos `bold` (700) o `semibold` (600) con tracking ajustado.
*   **Cuerpo:** Peso `normal` (400) en `slate-700` para legibilidad óptima.

## ## Spacing & Layout
El sistema se basa en una rejilla de **4px**.
*   **Paddings:** Se prefieren valores de `1rem` (16px) o `1.5rem` (24px) para separar contenedores lógicos.
*   **Layout:** Uso extensivo de `flex` y `grid` con gaps consistentes para mantener el ritmo visual.

## ## Components

### Buttons
*   **Primary:** Fondo `primary-600`, texto blanco, bordes `rounded-xl` y sombras suaves (`shadow-sm`).
*   **Ghost/Secondary:** Bordes sutiles o fondos translúcidos (`white/10`) con efectos de desenfoque (`backdrop-blur`).

### Cards
*   Contenedores con fondo blanco o `slate-50`, bordes de `1px` en `slate-200/80` y radio de curvatura `rounded-2xl`.

### Editor Canvas
*   Superficie de trabajo limpia con overlays interactivos. Las regiones seleccionadas deben tener un stroke definido y un relleno con opacidad reducida.

## ## Interaction & Motion
*   **Transiciones:** Todas las interacciones de hover deben usar `transition-all` con una duración de `300ms` y una curva de suavizado `ease-in-out`.
*   **Elevación:** Al pasar el cursor sobre las tarjetas de partituras, se aplica una traslación vertical negativa (`-translate-y-1`) y un incremento en la sombra (`shadow-xl`).

---
*Este archivo debe ser validado periódicamente con las herramientas de Google Stitch para asegurar el cumplimiento de ratios de contraste WCAG.*
