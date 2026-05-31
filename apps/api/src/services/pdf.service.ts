import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class PdfService {
  static async convertToImages(
    pdfPath: string,
    outputDir: string,
  ): Promise<string[]> {
    const scriptPath = path.join(process.cwd(), "src/scripts/pdf_to_images.py");
    
    try {
      // Ensure Homebrew bin is in the path for pdftoppm
      const env = { 
        ...process.env, 
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}` 
      };

      const { stdout } = await execAsync(`python3 "${scriptPath}" "${pdfPath}" "${outputDir}"`, { env });
      
      const imageUrls = stdout.trim().split("|");
      
      if (imageUrls.length === 0 || imageUrls[0] === "" || imageUrls[0].startsWith("ERROR")) {
        throw new Error(stdout || "No images were generated.");
      }
      
      return imageUrls;
    } catch (err: any) {
      console.error("Python PDF conversion failed:", err.message || err);
      throw err; // Don't use a dummy fallback, fail clearly
    }
  }
}
