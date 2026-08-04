import os
import glob
import json
import re
import shutil
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

PRODUCTS_JSON = "src/lib/data/products.json"
PRODUCTS_DIR = "public/images/products/essential oils"
NEEDS_REVIEW_DIR = "public/images/needs_review"
HANDOFF_MD = "HANDOFF.md"

def normalize_text(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())

def extract_product_core(name):
    # Split by common separators used in the catalog
    core = re.split(r'\bessential oil\b|\boil\b|\b100%|\(|-', name.lower())[0].strip()
    core = re.sub(r'\bpure\b', '', core).strip()
    return core

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def main():
    if not os.path.exists(PRODUCTS_JSON):
        print(f"Error: {PRODUCTS_JSON} not found.")
        return

    # Ensure review directory exists
    os.makedirs(NEEDS_REVIEW_DIR, exist_ok=True)

    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)

    essential_oils = [p for p in products if "essential oil" in p.get("category", "").lower() or "essential oil" in p.get("name", "").lower()]
    print(f"Total essential oils in JSON: {len(essential_oils)}")

    # Get all PNG images in the directory
    image_files = glob.glob(os.path.join(PRODUCTS_DIR, "*.png"))
    # Also support jpgs if they exist
    image_files.extend(glob.glob(os.path.join(PRODUCTS_DIR, "*.jpg")))
    
    print(f"Found {len(image_files)} images to process.\n")

    ocr = RapidOCR()
    
    product_cores = {}
    for p in essential_oils:
        core = extract_product_core(p["name"])
        product_cores[p["id"]] = {"product": p, "core": core, "norm_core": normalize_text(core)}

    log_entries = []
    unmatched_images = []
    
    # Track files to delete later (old files)
    files_to_delete = set()
    
    for img_path in image_files:
        filename = os.path.basename(img_path)
        try:
            result, _ = ocr(img_path)
            detected_text = ""
            if result:
                detected_lines = [res[1] for res in result]
                detected_text = " ".join(detected_lines)
            
            # Clean up detected text
            clean_detected = detected_text.lower()
            for word in ['ekora bazaar', 'ekorabazaar', 'ekcra', 'bazaar', 'essential oil', 'essentialoil', 'essential', 'oil', 'pure', 'blend']:
                clean_detected = clean_detected.replace(word, ' ')
            
            # Extract keywords by splitting on & or and
            keywords = [k.strip() for k in re.split(r'\&|\band\b', clean_detected) if k.strip()]
            
            if not keywords:
                keywords = [clean_detected.strip()]
                
            matched_products = []
            
            for p_id, p_data in product_cores.items():
                p_norm = p_data["norm_core"]
                p_core = p_data["core"]
                
                if len(p_norm) < 3:
                    continue
                
                for kw in keywords:
                    kw_norm = normalize_text(kw)
                    if not kw_norm: continue
                    
                    if p_norm in kw_norm or kw_norm in p_norm:
                        if p_data not in matched_products:
                            matched_products.append(p_data)
                        break

            if matched_products:
                log_entries.append(f"- ✅ `{filename}` (OCR: '{detected_text}') matched to:")
                
                # Create WEBP compressed SEO friendly copies
                with Image.open(img_path) as img:
                    # Convert to RGB in case it's RGBA (PNG with transparency) because WebP supports RGBA but let's be safe
                    # Actually, WebP supports transparency, so we can just save it.
                    for match in matched_products:
                        core_slug = slugify(match["core"])
                        seo_filename = f"ekora-bazaar-{core_slug}-essential-oil.webp"
                        seo_path = os.path.join(PRODUCTS_DIR, seo_filename)
                        
                        img.save(seo_path, format="WEBP", quality=85)
                        
                        match["product"]["image"] = f"/images/products/essential oils/{seo_filename}"
                        log_entries.append(f"  - **{match['product']['name']}** -> saved as `{seo_filename}`")
                
                # Mark original file for deletion since we've generated webp versions
                files_to_delete.add(img_path)
            else:
                unmatched_images.append((filename, detected_text))
                log_entries.append(f"- ❌ `{filename}` (OCR: '{detected_text}') -> NO MATCH FOUND")
                
                # Move to needs_review
                review_path = os.path.join(NEEDS_REVIEW_DIR, filename)
                shutil.move(img_path, review_path)

        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    for old_file in files_to_delete:
        if os.path.exists(old_file):
            os.remove(old_file)

    with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
        
    with open(HANDOFF_MD, "a", encoding="utf-8") as f:
        f.write("\n\n## Essential Oil WEBP Mapping Verification Log\n")
        f.write("\n".join(log_entries))
        if unmatched_images:
            f.write("\n\n### NEEDS MANUAL REVIEW\n")
            f.write("The following images could not be confidently matched and were moved to `/public/images/needs_review/`:\n")
            for img, text in unmatched_images:
                f.write(f"- `{img}` (Extracted Text: `{text}`)\n")
                
    print("\n" + "="*50)
    print("Process Complete. Check HANDOFF.md for the Verification Log.")
    if unmatched_images:
        print(f"WARNING: {len(unmatched_images)} images moved to needs_review!")

if __name__ == "__main__":
    main()
