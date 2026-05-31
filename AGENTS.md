# AGENTS.md - Guía para Agentes de IA (Score-Slice)

Este documento proporciona una visión técnica detallada y directrices operativas para que otros agentes de IA puedan comprender, mantener y replicar el proyecto **Score-Slice**.

## 1. Visión General del Proyecto
**Score-Slice** es una plataforma web para músicos y educadores que permite gestionar partituras en formato PDF, convertirlas en imágenes de alta resolución y crear "slices" (fragmentos) específicos para la práctica o enseñanza.

### Objetivos Clave:
- Conversión fiel de PDF a imágenes.
- Editor interactivo para definir regiones (slices) en las partituras.
- Modo de práctica para visualizar fragmentos secuencialmente.
- Sistema de comentarios contextuales sobre las partituras y fragmentos.

## 2. Arquitectura y Stack Tecnológico

### Estructura de Monorepo
El proyecto utiliza **NPM Workspaces**:
- `apps/api`: Servidor backend (Fastify + Prisma).
- `apps/web`: Aplicación frontend (React + Vite).
- `packages/shared`: Tipos y utilidades compartidas (en desarrollo).

### Backend (`apps/api`)
- **Runtime:** Node.js con `tsx` para desarrollo.
- **Framework:** **Fastify 5**.
- **ORM:** **Prisma** con PostgreSQL.
- **Procesamiento de PDF:** Puente con **Python 3** (librerías `pdf2image` y `Pillow`) y **Poppler**.
- **Autenticación:** JWT (`@fastify/jwt`).
- **Almacenamiento:** Local en `/uploads` (PDFs originales y PNGs generados).

### Frontend (`apps/web`)
- **Framework:** **React 19** (Vite).
- **Estilos:** **Tailwind CSS v4** (Configuración CSS-first).
- **Gestión de Estado/Datos:** **TanStack React Query v5**.
- **Enrutado:** **React Router 7**.
- **Iconos:** **Lucide React**.

## 3. Configuración del Entorno

### Requisitos Previos
1. **Node.js** (v20+ recomendado).
2. **Python 3** con `pip`.
3. **Poppler Utils:** 
   - macOS: `brew install poppler`
   - Ubuntu: `sudo apt-get install poppler-utils`
4. **Docker:** Para la base de datos PostgreSQL.

### Pasos de Instalación
```bash
# Instalar dependencias de Node.js
npm install

# Instalar dependencias de Python para el backend
cd apps/api
pip install pdf2image Pillow

# Levantar la base de datos con Docker
cd ../..
docker-compose up -d
```

### Variables de Entorno
- **API (`apps/api/.env`):**
  - `DATABASE_URL`: Conexión a PostgreSQL.
  - `JWT_SECRET`: Clave para tokens.
  - `PORT`: Puerto del servidor (por defecto 3000).
- **Web (`apps/web/.env`):**
  - `VITE_API_URL`: URL del backend.

## 4. Flujos Críticos de Negocio

### 4.1 Procesamiento de Documentos
Cuando se sube un PDF:
1. Se valida el archivo y se guarda en `uploads/pdfs`.
2. Se dispara un script de Python (`apps/api/src/scripts/pdf_to_images.py`) que convierte cada página en un PNG de alta resolución en `uploads/images`.
3. Se registran las páginas en la base de datos vinculadas al documento.

### 4.2 Lógica de Slicing
- Los "slices" se guardan como coordenadas relativas (`x`, `y`, `width`, `height`) respecto al tamaño original de la página.
- Esto permite que el visor sea responsivo sin perder la precisión del recorte.

## 5. Directrices para Agentes de IA

### Desarrollo de Código
- **Tipado:** Usa TypeScript de forma estricta. Evita `any`. Define interfaces en `packages/shared` si serán usadas en ambos extremos.
- **Estilos:** Usa clases de Tailwind CSS v4. No intentes configurar un archivo `tailwind.config.js` clásico, ya que v4 se basa en variables CSS.
- **Base de Datos:** Cualquier cambio en el esquema debe hacerse en `apps/api/prisma/schema.prisma` seguido de `npx prisma migrate dev`.
- **Backend:** Prefiere el uso de plugins de Fastify para modularizar la lógica (rutas, hooks, servicios).

### Comandos Comunes
- `npm run dev`: Inicia API y Web simultáneamente.
- `npm run dev:api`: Solo el backend.
- `npm run dev:web`: Solo el frontend.
- `npx prisma studio`: Explorador de base de datos.

## 6. Estado Actual y Roadmap
- [x] Subida y conversión de PDF.
- [x] Editor de slices interactivo.
- [x] Dashboard de documentos.
- [x] Sistema de comentarios.
- [ ] Refactorización de tipos a `packages/shared`.
- [ ] Implementación de testing (Vitest/Playwright).
- [ ] Soporte para multi-usuario real (Auth completa).

---
*Este documento es dinámico. Si realizas cambios estructurales significativos, actualiza las secciones correspondientes.*
