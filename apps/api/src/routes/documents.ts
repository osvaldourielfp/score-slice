import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import prisma from "../utils/prisma.js";
import { PdfService } from "../services/pdf.service.js";
import { SupabaseService } from "../services/supabase.service.js";

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
    let fileName: string | null = null;
    let tempImageDir: string | null = null;
    const uploadedUrls: string[] = [];

    try {
      const data = await request.file();
      if (!data) return reply.code(400).send({ message: "No file uploaded" });

      const user = request.user as UserPayload;
      const rootDir = process.cwd();
      const uploadDir = path.join(rootDir, "uploads/tmp");
      fileName = `${Date.now()}-${data.filename}`;
      filePath = path.join(uploadDir, fileName);
      tempImageDir = path.join(uploadDir, `${Date.now()}-images`);

      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      if (!fs.existsSync(tempImageDir)) fs.mkdirSync(tempImageDir, { recursive: true });

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

      // Convert PDF to images locally in the temp directory
      const imageUrls = await PdfService.convertToImages(filePath, tempImageDir);

      // Upload PDF to Supabase Storage
      await SupabaseService.uploadPdf(fileName, buffer);

      // Upload converted images to Supabase Storage and collect their public URLs
      for (const url of imageUrls) {
        const imageName = path.basename(url);
        const imageLocalPath = path.join(tempImageDir, imageName);
        const imageBuffer = fs.readFileSync(imageLocalPath);
        const publicUrl = await SupabaseService.uploadImage(imageName, imageBuffer);
        uploadedUrls.push(publicUrl);
      }

      // Create records in the database
      const document = await prisma.document.create({
        data: {
          title: data.filename,
          filePath: fileName,
          userId: user.id,
        },
      });
      documentId = document.id;

      await prisma.page.createMany({
        data: uploadedUrls.map((publicUrl, index) => ({
          documentId: document.id,
          pageNumber: index + 1,
          imageUrl: publicUrl,
        })),
      });

      // Cleanup local temp files on success
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(tempImageDir)) {
        const files = fs.readdirSync(tempImageDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempImageDir, file));
        }
        fs.rmdirSync(tempImageDir);
      }

      return { document, pages: uploadedUrls.length };
    } catch (error: any) {
      fastify.log.error("Upload Error:", error);
      
      // Database rollback on failure
      if (documentId) {
        await prisma.page.deleteMany({ where: { documentId } }).catch(() => {});
        await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
      }

      // Storage cleanup on failure
      if (fileName) {
        await SupabaseService.deletePdf(fileName).catch(() => {});
      }
      for (const url of uploadedUrls) {
        await SupabaseService.deleteImage(url).catch(() => {});
      }

      // Local files cleanup on failure
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (tempImageDir && fs.existsSync(tempImageDir)) {
        try {
          const files = fs.readdirSync(tempImageDir);
          for (const file of files) {
            fs.unlinkSync(path.join(tempImageDir, file));
          }
          fs.rmdirSync(tempImageDir);
        } catch {}
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
      // Delete PDF from Supabase Storage
      await SupabaseService.deletePdf(document.filePath);
      
      // Delete page images from Supabase Storage
      for (const page of document.pages) {
        await SupabaseService.deleteImage(page.imageUrl);
      }
    } catch (storageError) {
      fastify.log.error(storageError as Error, "Supabase storage file deletion error");
    }

    await prisma.comment.deleteMany({ where: { pageId: { in: document.pages.map(p => p.id) } } });
    await prisma.slice.deleteMany({ where: { pageId: { in: document.pages.map(p => p.id) } } });
    await prisma.sliceSession.deleteMany({ where: { documentId: id } });
    await prisma.page.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id: id } });

    return { success: true };
  });
}
