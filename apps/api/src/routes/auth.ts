import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post(
    "/register",
    async (
      request: FastifyRequest<{
        Body: { email?: string; password?: string; name?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { email, password, name } = request.body;

      if (!email || !password) {
        return reply
          .code(400)
          .send({ message: "Email and password are required" });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.code(400).send({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const token = fastify.jwt.sign({ id: user.id, email: user.email });
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      };
    },
  );

  // Login
  fastify.post(
    "/login",
    async (
      request: FastifyRequest<{ Body: { email?: string; password?: string } }>,
      reply: FastifyReply,
    ) => {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply
          .code(401)
          .send({ message: "Invalid credentials" });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.code(401).send({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.code(401).send({ message: "Invalid credentials" });
      }

      const token = fastify.jwt.sign({ id: user.id, email: user.email });
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      };
    },
  );
}
