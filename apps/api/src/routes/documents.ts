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

function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_");
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
    let fileName: string | null = null;
    const uploadedUrls: string[] = [];

    try {
      const user = request.user as UserPayload;
      
      let pdfFile: { filename: string; buffer: Buffer } | null = null;
      const imageFiles: { filename: string; buffer: Buffer }[] = [];

      for await (const part of request.parts()) {
        if (part.type === "file") {
          const buffer = await part.toBuffer();
          if (part.fieldname === "pdf") {
            pdfFile = {
              filename: part.filename,
              buffer,
            };
          } else if (part.fieldname === "images") {
            imageFiles.push({
              filename: part.filename,
              buffer,
            });
          }
        }
      }

      if (!pdfFile) {
        return reply.code(400).send({ message: "No PDF file uploaded" });
      }

      fileName = `${Date.now()}-${sanitizeFilename(pdfFile.filename)}`;

      // Verify PDF Header (%PDF-)
      const header = pdfFile.buffer.toString("utf8", 0, 5);
      if (header !== "%PDF-") {
        throw new Error(`Invalid PDF header: ${header}. The file might be corrupted or not a PDF.`);
      }

      // Sort images by page number from filename to ensure correct page ordering
      imageFiles.sort((a, b) => {
        const aNum = parseInt(a.filename.match(/-page-(\d+)\.png$/)?.[1] || "0", 10);
        const bNum = parseInt(b.filename.match(/-page-(\d+)\.png$/)?.[1] || "0", 10);
        return aNum - bNum;
      });

      const folderName = fileName.replace(/\.[^/.]+$/, "");

      // Upload converted images to Supabase Storage and collect public URLs
      for (const img of imageFiles) {
        const imgPath = `${folderName}/${sanitizeFilename(img.filename)}`;
        const publicUrl = await SupabaseService.uploadImage(imgPath, img.buffer);
        uploadedUrls.push(publicUrl);
      }

      // Create records in the database
      const document = await prisma.document.create({
        data: {
          title: pdfFile.filename,
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

      return { document, pages: uploadedUrls.length };
    } catch (error: any) {
      fastify.log.error("Upload Error:", error);
      
      // Database rollback on failure
      if (documentId) {
        await prisma.page.deleteMany({ where: { documentId } }).catch(() => {});
        await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
      }

      for (const url of uploadedUrls) {
        await SupabaseService.deleteImage(url).catch(() => {});
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
