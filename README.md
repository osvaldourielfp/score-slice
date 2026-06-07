# Score-Slice 🎵

**Score-Slice** is a modern, high-performance web application designed for musicians and music educators. It allows you to transform static PDF music scores into interactive, practice-ready fragments.

## ✨ Features

- **High-Fidelity Client-Side Conversion:** Renders PDF pages directly in the browser using **PDF.js** to generate high-resolution PNG images.
- **Supabase Storage Integration:** Uploads original PDFs to a private Supabase storage bucket (`pdfs`) and converted page images to a public bucket (`images`).
- **Interactive Slicing Editor:** A precision canvas-based editor to define and name specific regions ("slices") of a score.
- **Practice Mode:** A focused viewer to cycle through slices one by one, perfect for technical practice or teaching.
- **Contextual Annotations:** Leave comments on entire pages or link them to specific slices.
- **Keyboard Navigation:** Optimized for practice with keyboard shortcuts for easy navigation between fragments.
- **Modern UI:** Built with React 19 and Tailwind CSS v4, featuring a sleek, responsive interface with glassmorphism effects.

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite**
- **Tailwind CSS v4** (CSS-first engine)
- **TanStack React Query v5** (Data fetching & caching)
- **PDF.js** (`pdfjs-dist`) for client-side PDF processing
- **Lucide React** (Iconography)

### Backend
- **Node.js** + **Fastify 5**
- **Prisma ORM** + **PostgreSQL**
- **Supabase JS Client** (for Storage management)
- **JWT Authentication** (`@fastify/jwt`)
- **Python 3** (Legacy/Fallback PDF processing script via `pdf2image` & `Pillow`)

### Infrastructure
- **NPM Workspaces** (Monorepo architecture)
- **Docker Compose** (Local database management)
- **TypeScript** (Strict mode across the entire stack)

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20 or higher)
- **Docker** (for the local PostgreSQL database)
- **Supabase Project** (for storage buckets `pdfs` and `images`)
- *(Optional/Legacy)* **Python 3**, `pip`, and **Poppler Utils** (only if running the fallback backend conversion scripts)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/score-slice.git
   cd score-slice
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - In `apps/api/.env`:
     ```env
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/score_slice?schema=public"
     JWT_SECRET="your-jwt-secret-key"
     SUPABASE_URL="your-supabase-project-url"
     SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
     PORT=3001
     CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
     ```
   - In `apps/web/.env`:
     ```env
     VITE_API_URL="http://localhost:3001"
     ```

4. **Start the local Database:**
   ```bash
   docker-compose up -d
   ```

5. **Run Prisma Migrations:**
   ```bash
   npm run build -w api
   npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
   ```

6. **Run Development Mode:**
   ```bash
   npm run dev
   ```
   *This will start both the API (port 3001) and the Web Frontend (port 5173) concurrently.*

## 📂 Project Structure

```text
score-slice/
├── apps/
│   ├── api/          # Fastify backend & PDF scripts
│   └── web/          # React frontend with Tailwind v4 & PDF.js
├── packages/
│   └── shared/       # Shared TypeScript types and utilities
├── AGENTS.md         # Specialized guide for AI agents
├── DESIGN.md         # Visual design tokens & styling guidelines
└── SPECS.md          # Technical specifications and roadmap
```

## 🌐 Deployment

### 1. API (Backend) Deployment
The backend runs on Node.js/Fastify, interfaces with PostgreSQL via Prisma, and uses Supabase for storage.

#### Deployment Prerequisites
- A hosted PostgreSQL instance (e.g., Supabase DB, Neon, AWS RDS).
- A Supabase Project with two storage buckets:
  - `pdfs` (Private bucket for PDF documents)
  - `images` (Public bucket for page images)

#### Production Build & Run Commands
1. **Build the API workspace:**
   ```bash
   npm run build -w api
   ```
   *This runs `tsc` and outputs JavaScript to `apps/api/dist`.*
2. **Apply Database Migrations:**
   ```bash
   DATABASE_URL="your_prod_database_url" npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```
3. **Start the Server:**
   ```bash
   PORT=3001 DATABASE_URL="..." JWT_SECRET="..." SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node apps/api/dist/index.js
   ```
   *Or use the workspace script:*
   ```bash
   npm run start -w api
   ```

---

### 2. Frontend Deployment
The frontend is a static React application built with Vite.

#### Production Build Commands
1. **Build the Web workspace:**
   ```bash
   npm run build -w web
   ```
   *This compiles TypeScript and bundles assets into `apps/web/dist`.*
2. **Environment Configuration:**
   During build time, Vite embeds the backend API URL. Make sure the environment variable `VITE_API_URL` is set to your production API URL before building:
   ```bash
   VITE_API_URL="https://api.yourdomain.com" npm run build -w web
   ```
3. **Static Hosting:**
   Deploy the generated static folder `apps/web/dist` to any static hosting provider:
   - **Vercel** / **Netlify** / **Cloudflare Pages** (Set build command to `npm run build -w web` and output directory to `apps/web/dist`).
   - Or serve it locally for preview:
     ```bash
     npm run preview -w web
     ```

## 🤝 Contributing

Contributions are welcome! Please check the `SPECS.md` for the current roadmap and `AGENTS.md` for technical conventions.

## 📄 License

[Private / MIT] - See individual package files for details.

