import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

export class SupabaseService {
  /**
   * Upload a PDF file to the private 'pdfs' bucket
   * @param fileName Name of the file inside the bucket
   * @param buffer File buffer
   */
  static async uploadPdf(fileName: string, buffer: Buffer): Promise<string> {
    const { data, error } = await supabase.storage
      .from("pdfs")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload PDF to Supabase: ${error.message}`);
    }

    return data.path; // e.g., '171717171-document.pdf'
  }

  /**
   * Upload a PNG page image to the public 'images' bucket
   * @param fileName Name of the file inside the bucket
   * @param buffer Image buffer
   * @returns Public URL of the uploaded image
   */
  static async uploadImage(fileName: string, buffer: Buffer): Promise<string> {
    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload page image to Supabase: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Delete a PDF file from the 'pdfs' bucket
   * @param fileName Path or filename in the bucket
   */
  static async deletePdf(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from("pdfs")
      .remove([fileName]);

    if (error) {
      console.error(`Error deleting PDF from Supabase Storage: ${error.message}`);
    }
  }

  /**
   * Delete a PNG image from the 'images' bucket
   * @param imageIdentifier Filename or full public URL of the image
   */
  static async deleteImage(imageIdentifier: string): Promise<void> {
    let fileName = imageIdentifier;
    if (imageIdentifier.startsWith("http")) {
      fileName = imageIdentifier.substring(imageIdentifier.lastIndexOf("/") + 1);
    }

    const { error } = await supabase.storage
      .from("images")
      .remove([fileName]);

    if (error) {
      console.error(`Error deleting image from Supabase Storage: ${error.message}`);
    }
  }
}
