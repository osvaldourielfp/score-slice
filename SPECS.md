# Score-Slice Specification (Updated)

## 1. Project Overview
**Score-Slice** is a web-based application designed for musicians and educators to manage, annotate, and "slice" music scores. It converts PDF documents into high-quality images and provides a specialized editor for creating reusable slices (fragments) of music for practice or teaching.

---

## 2. Tech Stack (Current)
- **Architecture:** Monorepo using NPM Workspaces.
- **Language:** TypeScript (Strict mode, ESM enabled).
- **Frontend:** React.js (Vite) with **Tailwind CSS v4** (CSS-first configuration).
- **Backend:** Node.js with **Fastify 5**.
- **Runtime:** `tsx` for development execution.
- **Database:** PostgreSQL with **Prisma ORM**.
- **File Storage:** Local storage (`/uploads/pdfs` and `/uploads/images`).
- **PDF Processing:** Hybrid approach using **Python (pdf2image/Pillow)** and **Poppler** for high-fidelity conversion.
- **Linting:** ESLint 9+ with TypeScript-specific rules.

---

## 3. Functional Requirements (Implemented)

### 3.1 Document Management
- **Upload:** Users can upload PDF files up to 50MB. Includes header verification to prevent corruption.
- **Conversion:** Asynchronous conversion of PDF pages into high-resolution PNG images via a specialized Python bridge.
- **Gallery:** A responsive dashboard to view, manage, and delete uploaded documents.
- **Deletion:** Full cleanup of database records and filesystem assets (PDFs and images).

### 3.2 Slicing & Editor
- **Image Viewer:** High-performance canvas-based interface.
- **Slicing Tool:** Interactive drawing of bounding boxes with real-time visual feedback.
- **Slice Sessions:** Automatic session management per document.
- **Persistence:** Slices saved as precise coordinates relative to the original page resolution.
- **Slice Viewer:** A dedicated "Practice Mode" that displays only the cropped fragments (slices) one by one.
- **Keyboard Navigation:** Users can cycle through slices using keyboard arrows (Left/Right) for a seamless practice experience.

### 3.3 Collaboration & Feedback
- **Contextual Comments:** Dual-mode annotation system allowing comments on the entire page or linked to specific slices.
- **Visual Highlighting:** Active slices are visually distinguished (Amber) from inactive ones (Blue).

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Optimized Loading:** React Query used for efficient data fetching and cache management.
- **Fast Styling:** Tailwind CSS v4 provides lightning-fast build times and minimal runtime overhead.

### 4.2 Usability
- **Modern UI:** Glassmorphism effects, responsive grid layouts, and interactive hover states.
- **Feedback:** Real-time alerts for upload success/failure and deletion confirmation.

---

## 5. Security Requirements
- **Authentication:** JWT-based authentication with `request.jwtVerify()` hooks.
- **CORS:** Controlled origin and method access (currently permissive for development).
- **Data Isolation:** Prisma queries scoped to `userId` to ensure private access to scores.
- **Validation:** Strict multipart limits (50MB) and file header checks.

---

## 6. Deployment Strategy
**Target Platform:** **Railway.app**, **Render.com**, or **Docker-capable VPS**.
- **Requirements:** 
  - Node.js runtime.
  - Python 3 with `pip` dependencies.
  - **System Dependency:** `poppler-utils` must be installed on the host (e.g., `apt-get install poppler-utils`).
- **Storage:** Persistant disk volume required for the `/uploads` directory.

---

## 7. Development & Quality Control
- **Execution:** `npm run dev` starts both API and Web workspaces.
- **Database:** Managed via Prisma migrations and local Docker Compose.
- **Code Quality:** Prettier and ESLint integrated into the development workflow.
