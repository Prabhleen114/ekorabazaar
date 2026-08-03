import csv
import os
import sys
# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw, ImageFont

# --- Configuration ---
CSV_FILE = 'products.csv'
BASE_IMAGE_PATH = 'public/images/base-bottle.png'
OUTPUT_DIR = 'output_images'
FAILED_LOG = 'failed_log.txt'

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load base image once to get dimensions
try:
    base_image = Image.open(BASE_IMAGE_PATH)
    width, height = base_image.size
except Exception as e:
    print(f"Error: Could not load base image at {BASE_IMAGE_PATH}. {e}")
    sys.exit(1)

# Try to load a premium serif font, fallback to default if not found
try:
    # Windows standard premium fonts
    font_large = ImageFont.truetype("georgia.ttf", 64)
    font_medium = ImageFont.truetype("georgia.ttf", 36)
    font_small = ImageFont.truetype("arial.ttf", 24)
except IOError:
    print("Warning: Custom fonts not found. Falling back to default.")
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

def process_products():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        sys.exit(1)

    # Read CSV
    with open(CSV_FILE, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        products = list(reader)
    
    total_products = len(products)
    print(f"Loaded {total_products} products from {CSV_FILE}.")

    skipped_count = 0
    processed_count = 0
    failed_count = 0

    for idx, row in enumerate(products, 1):
        product_id = row.get('id', str(idx))
        display_name = row.get('display_name', '').strip()
        
        # Use ID as filename to match Next.js logic, but user requested by exact name.
        # We will use ID to ensure safe filenames, or display_name if preferred.
        # The user requested: "check if an image with that exact product name already exists"
        # We'll save it as "{display_name}.png"
        safe_name = "".join([c for c in display_name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        output_filename = f"{safe_name}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        # 2. Skip Existing (Resume Function)
        if os.path.exists(output_path):
            skipped_count += 1
            continue
        else:
            if skipped_count > 0:
                print(f"Skipping 1-{skipped_count}...")
                skipped_count = 0 # Reset so it doesn't print again

        # 4. Terminal Progress
        print(f"Processing {idx}/{total_products}: {display_name}...")

        # 3. Error Handling
        try:
            # Clone base image
            img = base_image.copy()
            draw = ImageDraw.Draw(img)

            # Define coordinates (assuming 1024x1024 image, adjust as needed)
            center_x = width / 2
            
            # Draw Brand Name
            draw.text((center_x, height / 2 - 80), "EKORA BAZAAR", font=font_medium, fill=(28, 25, 23), anchor="mm")
            
            # Draw Divider Line
            draw.line([(center_x - 40, height / 2 - 40), (center_x + 40, height / 2 - 40)], fill=(196, 143, 86), width=3)
            
            # Draw Product Name
            draw.text((center_x, height / 2 + 20), display_name, font=font_large, fill=(28, 25, 23), anchor="mm")
            
            # Draw Subtext
            draw.text((center_x, height / 2 + 90), "PREMIUM FRAGRANCE OIL", font=font_small, fill=(107, 114, 128), anchor="mm")

            # Save the final image
            img.save(output_path, "PNG")
            processed_count += 1

        except Exception as e:
            failed_count += 1
            print(f" -> ERROR generating {display_name}: {e}")
            with open(FAILED_LOG, 'a', encoding='utf-8') as log_file:
                log_file.write(f"Failed: {display_name} | Error: {str(e)}\n")

    print("\n--- Generation Complete ---")
    print(f"Processed: {processed_count}")
    if skipped_count > 0:
        print(f"Skipped: {skipped_count}")
    print(f"Failed: {failed_count}")
    
    if failed_count > 0:
        print(f"Check {FAILED_LOG} for error details.")

if __name__ == '__main__':
    process_products()
