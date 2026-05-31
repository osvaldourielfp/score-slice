import "./utils/polyfills.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import sliceRoutes from "./routes/slices.js";
import commentRoutes from "./routes/comments.js";

const fastify = Fastify({ logger: true });

// Register Plugins
fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    if (env.CORS_ORIGINS.length > 0) {
      return cb(null, env.CORS_ORIGINS.includes(origin));
    }

    if (origin === "http://localhost:5173" || origin === "http://localhost:3000") {
      return cb(null, true);
    }

    if (/^https:\/\/.*\.(ngrok-free\.app|ngrok\.app)$/.test(origin)) {
      return cb(null, true);
    }

    if (/^https:\/\/.*\.(railway\.app|up\.railway\.app)$/.test(origin)) {
      return cb(null, true);
    }

    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "ngrok-skip-browser-warning",
  ],
  credentials: true,
});
fastify.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});
fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads/images"),
  prefix: "/uploads/images/",
});

// Register Routes
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(documentRoutes, { prefix: "/documents" });
fastify.register(sliceRoutes, { prefix: "/slices" });
fastify.register(commentRoutes, { prefix: "/comments" });

fastify.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = env.PORT;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.warn(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
