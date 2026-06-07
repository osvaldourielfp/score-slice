import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

export class SupabaseService {
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

  static async deleteImage(imageIdentifier: string): Promise<void> {
    let fileName = imageIdentifier;
    if (imageIdentifier.startsWith("http")) {
      const bucketMarker = "/images/";
      const index = imageIdentifier.indexOf(bucketMarker);
      if (index !== -1) {
        fileName = imageIdentifier.substring(index + bucketMarker.length);
      } else {
        fileName = imageIdentifier.substring(imageIdentifier.lastIndexOf("/") + 1);
      }
    }

    const { error } = await supabase.storage
      .from("images")
      .remove([fileName]);

    if (error) {
      console.error(`Error deleting image from Supabase Storage: ${error.message}`);
    }
  }
}
