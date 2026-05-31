import sys
import os
from pdf2image import convert_from_path

def convert_pdf(pdf_path, output_dir):
    try:
        # Pass poppler_path explicitly for Homebrew on Apple Silicon
        poppler_path = "/opt/homebrew/bin"
        
        # Convert PDF to list of PIL images
        images = convert_from_path(pdf_path, dpi=200, poppler_path=poppler_path)
        
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        image_paths = []
        
        for i, image in enumerate(images):
            image_name = f"{base_name}-page-{i+1}.png"
            image_path = os.path.join(output_dir, image_name)
            image.save(image_path, "PNG")
            image_paths.append(f"/uploads/images/{image_name}")
            
        print("|".join(image_paths))
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 pdf_to_images.py <pdf_path> <output_dir>")
        sys.exit(1)
        
    convert_pdf(sys.argv[1], sys.argv[2])
