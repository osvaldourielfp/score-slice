# Score-Slice 🎵

**Score-Slice** is a modern, high-performance web application designed for musicians and music educators. It allows you to transform static PDF music scores into interactive, practice-ready fragments.

![Score-Slice Preview](https://via.placeholder.com/800x400?text=Score-Slice+Interface+Preview) <!-- Placeholder for actual screenshot -->

## ✨ Features

- **High-Fidelity Conversion:** Asynchronous conversion of PDF pages into high-resolution PNG images using a specialized Python/Poppler bridge.
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
- **Lucide React** (Iconography)

### Backend
- **Node.js** + **Fastify 5**
- **Prisma ORM** + **PostgreSQL**
- **Python 3** (PDF processing via `pdf2image` & `Pillow`)
- **JWT Authentication**

### Infrastructure
- **NPM Workspaces** (Monorepo architecture)
- **Docker Compose** (Local database management)
- **TypeScript** (Strict mode across the entire stack)

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20 or higher)
- **Python 3** and `pip`
- **Poppler Utils**
  - macOS: `brew install poppler`
  - Linux: `sudo apt-get install poppler-utils`
- **Docker** (for the database)

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

3. **Setup Backend dependencies:**
   ```bash
   cd apps/api
   pip install pdf2image Pillow
   ```

4. **Environment Variables:**
   Create `.env` files in `apps/api` and `apps/web` based on their respective `.env.example` files.

5. **Start Database:**
   ```bash
   docker-compose up -d
   ```

6. **Run Development Mode:**
   ```bash
   npm run dev
   ```
   *This will start both the API (port 3000) and the Web Frontend (port 5173).*

## 📂 Project Structure

```text
score-slice/
├── apps/
│   ├── api/          # Fastify backend & PDF processing scripts
│   └── web/          # React frontend with Tailwind v4
├── packages/
│   └── shared/       # Shared TypeScript types and utilities
├── uploads/
│   ├── pdfs/         # Original uploaded documents
│   └── images/       # Generated high-res page images
├── AGENTS.md         # Specialized guide for AI agents
└── SPECS.md          # Technical specifications and roadmap
```

## 🤝 Contributing

Contributions are welcome! Please check the `SPECS.md` for the current roadmap and `AGENTS.md` for technical conventions.

## 📄 License

[Private / MIT] - See individual package files for details.
