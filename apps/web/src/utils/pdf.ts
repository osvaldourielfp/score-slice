import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Converts a PDF file into an array of image Blobs (PNG) client-side.
 * @param file The PDF File object
 * @returns Array of image Blobs
 */
export async function convertPdfToImages(file: File): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const imageBlobs: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Render at 2.0 scale for high resolution (similar to DPI=200 in python)
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    
    if (!context) {
      throw new Error(`Failed to create 2d canvas context for page ${i}`);
    }

    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert canvas to blob for page ${i}`));
        },
        "image/png"
      );
    });

    imageBlobs.push(blob);
  }

  return imageBlobs;
}
