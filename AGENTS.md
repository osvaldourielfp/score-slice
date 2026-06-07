# AGENTS.md - Guía para Agentes de IA (Score-Slice)

Este documento proporciona una visión técnica detallada y directrices operativas para que otros agentes de IA puedan comprender, mantener y replicar el proyecto **Score-Slice**.

## 1. Visión General del Proyecto
**Score-Slice** es una plataforma web para músicos y educadores que permite gestionar partituras en formato PDF, convertirlas en imágenes de alta resolución y crear "slices" (fragmentos) específicos para la práctica o enseñanza.

### Objetivos Clave:
- Conversión fiel de PDF a imágenes (realizada del lado del cliente).
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
- **Almacenamiento:** Integración con **Supabase Storage** (buckets `pdfs` y `images`).
- **Autenticación:** JWT (`@fastify/jwt`).
- **Procesamiento de PDF (Legacy/Fallback):** Puente con **Python 3** (librerías `pdf2image` y `Pillow`) y **Poppler** (disponible en `src/scripts/pdf_to_images.py` pero el flujo principal ahora es en el cliente).

### Frontend (`apps/web`)
- **Framework:** **React 19** (Vite).
- **Procesamiento de PDF:** **PDF.js** (`pdfjs-dist`) para renderizar páginas a PNG en el navegador.
- **Estilos:** **Tailwind CSS v4** (Configuración CSS-first en `index.css`).
- **Gestión de Estado/Datos:** **TanStack React Query v5**.
- **Enrutado:** **React Router 7**.
- **Iconos:** **Lucide React**.

## 3. Configuración del Entorno

### Requisitos Previos
1. **Node.js** (v20+ recomendado).
2. **Docker:** Para la base de datos PostgreSQL local.
3. **Proyecto de Supabase:** Con buckets de almacenamiento `pdfs` (privado) e `images` (público).

### Pasos de Instalación
```bash
# Instalar dependencias de Node.js en la raíz
npm install

# Levantar la base de datos con Docker
docker-compose up -d

# Generar cliente de Prisma y correr migraciones
npm run build -w api
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
```

### Variables de Entorno
- **API (`apps/api/.env`):**
  - `DATABASE_URL`: Conexión a PostgreSQL (por ej. local o alojado en la nube).
  - `JWT_SECRET`: Clave secreta para tokens.
  - `SUPABASE_URL`: URL del proyecto de Supabase.
  - `SUPABASE_SERVICE_ROLE_KEY`: Token de servicio de Supabase (para omitir políticas RLS al escribir).
  - `PORT`: Puerto del servidor (por defecto 3001).
  - `CORS_ORIGINS`: Dominios permitidos para CORS (por defecto incluye localhost y ngrok).
- **Web (`apps/web/.env`):**
  - `VITE_API_URL`: URL del backend (por defecto `http://localhost:3001`).

## 4. Flujos Críticos de Negocio

### 4.1 Procesamiento de Documentos
Cuando se sube un PDF en el frontend:
1. El navegador renderiza cada página en un canvas usando **PDF.js** a una escala de 2.0x y las convierte a Blobs de tipo PNG.
2. Se envía una petición multipart a `/documents/upload` que contiene tanto el PDF original (`pdf`) como los archivos PNG de las páginas (`images`).
3. El backend valida el archivo y lo sube al bucket privado `pdfs` de Supabase Storage.
4. Las imágenes PNG se suben al bucket público `images` de Supabase Storage, obteniendo sus URLs públicas.
5. Se registran las páginas y el documento en la base de datos vinculados al usuario.

### 4.2 Lógica de Slicing
- Los "slices" se guardan como coordenadas relativas (`x`, `y`, `width`, `height`) respecto al tamaño original de la página.
- Esto permite que el visor sea responsivo sin perder la precisión del recorte.

## 5. Directrices para Agentes de IA

### Desarrollo de Código
- **Tipado:** Usa TypeScript de forma estricta. Evita `any`. Define interfaces en `packages/shared` si serán usadas en ambos extremos.
- **Estilos:** Usa clases de Tailwind CSS v4. No intentes configurar un archivo `tailwind.config.js` clásico, ya que v4 se basa en variables CSS en `apps/web/src/index.css`.
- **Base de Datos:** Cualquier cambio en el esquema debe hacerse en `apps/api/prisma/schema.prisma` seguido de `npx prisma migrate dev`.
- **Backend:** Prefiere el uso de plugins de Fastify para modularizar la lógica (rutas, hooks, servicios).

### Comandos Comunes
- `npm run dev`: Inicia API (puerto 3001) y Web (puerto 5173) simultáneamente.
- `npm run dev:api`: Solo el backend.
- `npm run dev:web`: Solo el frontend.
- `npx prisma studio`: Explorador de base de datos.

## 6. Estado Actual y Roadmap
- [x] Subida y conversión de PDF (Con PDF.js en el cliente).
- [x] Almacenamiento en la nube (Integración con Supabase Storage).
- [x] Editor de slices interactivo.
- [x] Dashboard de documentos.
- [x] Sistema de comentarios (Contextuales a página o slice).
- [x] Soporte para autenticación real (JWT completo en API y Web).
- [ ] Refactorización de tipos a `packages/shared`.
- [ ] Implementación de testing (Vitest/Playwright).

---
*Este documento es dinámico. Si realizas cambios estructurales significativos, actualiza las secciones correspondientes.*

