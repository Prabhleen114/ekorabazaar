import csv
import os
import sys
import time
import base64
import requests
import urllib.request

# --- Configuration ---
CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 'products.csv')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'products')
FAILED_LOG = os.path.join(os.path.dirname(__file__), '..', 'failed_log.txt')

# OpenAI API Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

if not OPENAI_API_KEY:
    print("Error: OPENAI_API_KEY environment variable not set.")
    sys.exit(1)

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Clear old failed log
if os.path.exists(FAILED_LOG):
    os.remove(FAILED_LOG)


def generate_image_openai(display_name: str) -> bytes | None:
    """Generate a product image using OpenAI DALL-E 3."""
    prompt = (
        f"A photorealistic product shot of a luxury amber glass essential oil dropper bottle "
        f"labeled 'HOUSE OF EKORA' with the scent name '{display_name}' on a white label. "
        f"The bottle sits on a dark natural stone pedestal. "
        f"Surrounding the bottle are fresh, beautiful {display_name} ingredients - "
        f"real leaves, petals, fruits, spices, or botanicals matching the '{display_name}' scent. "
        f"Moody, cinematic studio lighting with a soft bokeh marble bathroom background. "
        f"Ultra-premium luxury fragrance brand aesthetic. No text except on the label."
    )

    url = "https://api.openai.com/v1/images/generations"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
        "quality": "standard",
    }

    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            if response.status_code == 200:
                data = response.json()
                image_url = data["data"][0]["url"]
                # Download the image from the URL
                img_response = requests.get(image_url, timeout=60)
                if img_response.status_code == 200:
                    return img_response.content
                else:
                    print(f"   Failed to download image from URL: {img_response.status_code}")
                    return None
            elif response.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"   Rate limited. Waiting {wait}s before retry {attempt+1}/3...")
                time.sleep(wait)
            else:
                print(f"   API Error {response.status_code}: {response.text[:300]}")
                return None
        except requests.exceptions.Timeout:
            print(f"   Timeout on attempt {attempt+1}/3. Retrying...")
            time.sleep(10)
        except Exception as e:
            print(f"   Unexpected error: {e}")
            return None

    return None


def process_products():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        sys.exit(1)

    # Read CSV
    with open(CSV_FILE, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        products = list(reader)

    total_products = len(products)
    print(f"Loaded {total_products} products from CSV.")

    skipped_count = 0
    processed_count = 0
    failed_count = 0

    for idx, row in enumerate(products, 1):
        display_name = row.get('display_name', '').strip()
        if not display_name:
            continue

        # Safe filename
        safe_name = "".join([c for c in display_name if c.isalpha() or c.isdigit() or c == ' ']).rstrip()
        output_filename = f"{safe_name}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        # Resume: skip if image already exists AND is bigger than 100KB (real AI image)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 100_000:
            skipped_count += 1
            continue

        # Print skip summary before first new generation
        if skipped_count > 0:
            print(f"Skipped {skipped_count} existing images.")
            skipped_count = 0

        print(f"[{idx}/{total_products}] Generating: {display_name}...")

        image_data = generate_image_openai(display_name)

        if image_data:
            with open(output_path, 'wb') as f:
                f.write(image_data)
            processed_count += 1
            print(f"   -> Saved {output_filename} ({len(image_data) // 1024}KB)")
            # Small delay between requests to be nice to the API
            time.sleep(2)
        else:
            failed_count += 1
            print(f"   -> FAILED {display_name}")
            with open(FAILED_LOG, 'a', encoding='utf-8') as log_file:
                log_file.write(f"Failed: {display_name}\n")

    # Final skip summary
    if skipped_count > 0:
        print(f"Skipped {skipped_count} existing images.")

    print("")
    print("--- Generation Complete ---")
    print(f"Generated: {processed_count}")
    print(f"Skipped:   {total_products - processed_count - failed_count}")
    print(f"Failed:    {failed_count}")

    if failed_count > 0:
        print(f"Check {FAILED_LOG} for error details.")


if __name__ == '__main__':
    process_products()
