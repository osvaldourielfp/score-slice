import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import prisma from "../utils/prisma.js";

export default async function sliceRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new Error("Unauthorized");
    }
  });

  // Get or Create a default session for a document
  fastify.get(
    "/sessions/:documentId",
    async (
      request: FastifyRequest<{ Params: { documentId: string } }>,
      _reply: FastifyReply,
    ) => {
      const { documentId } = request.params;
      let sessions = await prisma.sliceSession.findMany({
        where: { documentId },
        include: { slices: true },
      });

      if (sessions.length === 0) {
        const defaultSession = await prisma.sliceSession.create({
          data: {
            name: "Default Session",
            documentId,
          },
          include: { slices: true },
        });
        return [defaultSession];
      }

      return sessions;
    },
  );

  // Create a new slice
  fastify.post(
    "/",
    async (
      request: FastifyRequest<{
        Body: {
          x: number;
          y: number;
          width: number;
          height: number;
          pageId: string;
          sessionId: string;
        };
      }>,
      _reply: FastifyReply,
    ) => {
      const { x, y, width, height, pageId, sessionId } = request.body;

      const slice = await prisma.slice.create({
        data: {
          x,
          y,
          width,
          height,
          pageId,
          sessionId,
        },
      });

      return slice;
    },
  );

  // Delete a slice
  fastify.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      _reply: FastifyReply,
    ) => {
      const { id } = request.params;
      await prisma.slice.delete({ where: { id } });
      return { success: true };
    },
  );
}
