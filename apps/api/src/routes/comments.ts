import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import prisma from "../utils/prisma.js";

export default async function commentRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new Error("Unauthorized");
    }
  });

  // Get comments for a page or slice
  fastify.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: { pageId?: string; sliceId?: string };
      }>,
    ) => {
      const { pageId, sliceId } = request.query;
      return prisma.comment.findMany({
        where: {
          OR: [{ pageId: pageId || undefined }, { sliceId: sliceId || undefined }],
        },
        orderBy: { createdAt: "desc" },
      });
    },
  );

  // Create a comment
  fastify.post(
    "/",
    async (
      request: FastifyRequest<{
        Body: { content: string; pageId?: string; sliceId?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { content, pageId, sliceId } = request.body;

      if (!content)
        return reply.code(400).send({ message: "Content is required" });

      const comment = await prisma.comment.create({
        data: {
          content,
          pageId,
          sliceId,
        },
      });

      return comment;
    },
  );

  // Delete a comment
  fastify.delete(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      const { id } = request.params;
      await prisma.comment.delete({ where: { id } });
      return { success: true };
    },
  );
}
