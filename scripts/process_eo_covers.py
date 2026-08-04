import os
import glob
import json
import re
import shutil
from rapidocr_onnxruntime import RapidOCR

PRODUCTS_JSON = "src/lib/data/products.json"
PRODUCTS_DIR = "public/images/products/essential oils"
TARGET_DIR = "public/images/products/essential oils"

def normalize_text(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())

def main():
    if not os.path.exists(PRODUCTS_JSON):
        print(f"Error: {PRODUCTS_JSON} not found.")
        return

    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)

    # Focus on Essential Oils
    essential_oils = [p for p in products if "essential oil" in p.get("category", "").lower()]
    print(f"Total essential oils in JSON: {len(essential_oils)}")

    # Get all Gemini generated image files
    gemini_files = glob.glob(os.path.join(PRODUCTS_DIR, "Gemini_Generated_Image_*.png"))
    print(f"Found {len(gemini_files)} new Gemini images to process.\n")

    ocr = RapidOCR()

    matched_count = 0
    unmatched_files = []

    # Map product normalized names to product objects
    product_map = {}
    for p in essential_oils:
        full_name = p["name"].lower()
        # Extract core name by taking everything before "essential oil", "oil", "100%", "(", or "-"
        core_name = re.split(r'\bessential oil\b|\boil\b|\b100%|\(|-', full_name)[0].strip()
        core_name = re.sub(r'\bpure\b', '', core_name).strip()
        
        norm_name = normalize_text(core_name)
        if norm_name:
            product_map[norm_name] = p

    for img_path in gemini_files:
        try:
            result, _ = ocr(img_path)
            detected_text = ""
            if result:
                detected_lines = [res[1] for res in result]
                detected_text = " ".join(detected_lines)
            
            norm_detected = normalize_text(detected_text)
            
            # Extract core from detected text by removing common words
            core_detected = norm_detected.replace('ekorabazaar', '').replace('ekcra', '').replace('bazaar', '').replace('essentialoil', '').replace('essential', '').replace('oil', '').replace('pure', '')
            
            best_match = None
            best_score = 0

            for norm_p_name, prod in product_map.items():
                if len(norm_p_name) < 3:
                    continue
                # Match if product core name is in detected core name or vice versa
                if norm_p_name in core_detected or core_detected in norm_p_name:
                    if len(norm_p_name) > best_score:
                        best_match = prod
                        best_score = len(norm_p_name)

            if best_match:
                # Generate a clean filename based on the core product name
                core_p_name = re.split(r'\bessential oil\b|\boil\b|\b100%|\(|-', best_match["name"], flags=re.IGNORECASE)[0].strip()
                core_p_name = re.sub(r'\bpure\b', '', core_p_name, flags=re.IGNORECASE).strip()
                safe_name = re.sub(r'[^a-zA-Z0-9\s]', '', core_p_name).strip().upper() + " ESSENTIAL OIL"
                target_filename = f"{safe_name}.png"
                target_path = os.path.join(TARGET_DIR, target_filename)

                shutil.copy2(img_path, target_path)
                os.remove(img_path)

                best_match["image"] = f"/images/products/essential oils/{target_filename}"
                matched_count += 1
                print(f"[OK] Matched '{detected_text.strip()}' -> [{best_match['name']}] -> Saved as '{target_filename}'")
            else:
                unmatched_files.append((img_path, detected_text.strip()))
                print(f"[FAIL] Could not match: {os.path.basename(img_path)} (Text: '{detected_text.strip()}')")

        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    # Save updated products.json
    with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print("\n" + "="*50)
    print(f"Matching Complete: {matched_count} images linked successfully.")
    if unmatched_files:
        print(f"Unmatched images: {len(unmatched_files)}")

if __name__ == "__main__":
    main()
