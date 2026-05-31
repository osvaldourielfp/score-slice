import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import prisma from "../utils/prisma.js";
import { PdfService } from "../services/pdf.service.js";

interface UserPayload {
  id: string;
  email: string;
}

export default async function documentRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new Error("Unauthorized");
    }
  });

  fastify.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    let documentId: string | null = null;
    let filePath: string | null = null;

    try {
      const data = await request.file();
      if (!data) return reply.code(400).send({ message: "No file uploaded" });

      const user = request.user as UserPayload;
      const rootDir = process.cwd();
      const uploadDir = path.join(rootDir, "uploads/pdfs");
      const imageDir = path.join(rootDir, "uploads/images");

      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

      const fileName = `${Date.now()}-${data.filename}`;
      filePath = path.join(uploadDir, fileName);

      // Save the file using a buffer to ensure it's fully written before processing
      const buffer = await data.toBuffer();
      fs.writeFileSync(filePath, buffer);

      const stats = fs.statSync(filePath);
      fastify.log.info(`File uploaded: ${data.filename}, Size: ${stats.size} bytes`);

      // Verify PDF Header (%PDF-)
      const header = buffer.toString("utf8", 0, 5);
      if (header !== "%PDF-") {
        throw new Error(`Invalid PDF header: ${header}. The file might be corrupted or not a PDF.`);
      }

      const document = await prisma.document.create({
        data: {
          title: data.filename,
          filePath: filePath,
          userId: user.id,
        },
      });
      documentId = document.id;

      const imageUrls = await PdfService.convertToImages(filePath, imageDir);

      await prisma.page.createMany({
        data: imageUrls.map((url, index) => ({
          documentId: document.id,
          pageNumber: index + 1,
          imageUrl: url,
        })),
      });

      return { document, pages: imageUrls.length };
    } catch (error: any) {
      fastify.log.error("Upload Error:", error);
      
      // CLEANUP on failure
      if (documentId) {
        await prisma.page.deleteMany({ where: { documentId } }).catch(() => {});
        await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
      }
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return reply.code(500).send({ 
        message: "Failed to process PDF", 
        error: error.message || String(error) 
      });
    }
  });

  fastify.get("/", async (request: FastifyRequest) => {
    const user = request.user as UserPayload;
    return prisma.document.findMany({
      where: { userId: user.id },
      include: { pages: true },
    });
  });

  fastify.delete("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user as UserPayload;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { pages: true }
    });

    if (!document || document.userId !== user.id) {
      return reply.code(403).send({ message: "Forbidden" });
    }

    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
      
      const imageDir = path.join(process.cwd(), "uploads/images");
      for (const page of document.pages) {
        const imageName = path.basename(page.imageUrl);
        const fullImagePath = path.join(imageDir, imageName);
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
        }
      }
    } catch (fsError) {
      fastify.log.error("File deletion error:", fsError);
    }

    await prisma.comment.deleteMany({ where: { pageId: { in: document.pages.map(p => p.id) } } });
    await prisma.slice.deleteMany({ where: { pageId: { in: document.pages.map(p => p.id) } } });
    await prisma.sliceSession.deleteMany({ where: { documentId: id } });
    await prisma.page.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id: id } });

    return { success: true };
  });
}
