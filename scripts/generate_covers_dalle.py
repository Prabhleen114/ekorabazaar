"""
Ekora Bazaar — Bespoke Product Image Generator (Gemini 2.5 Flash Image)
=======================================================================
Generates a unique, ingredient-rich product photograph for each fragrance oil
using Google's Gemini 2.5 Flash Image model based on its top fragrance notes.

Features:
  - Checkpointing: Skips products whose image already exists in output_images/
  - Error handling: Logs failures to failed_log.txt and continues
  - Progress tracking: Clean console output
  - Resume-safe: Re-run anytime to pick up where you left off
  - HANDOFF.md updated every 5 products

Usage:
  set GEMINI_API_KEY=your_key_here
  python scripts/generate_covers_dalle.py
"""

import json
import os
import re
import sys
import time
import base64

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed. Run: pip install -U google-genai")
    sys.exit(1)

# --- Configuration ---
PRODUCTS_JSON = "src/lib/data/products.json"
OUTPUT_DIR = "output_images"
FAILED_LOG = "failed_log.txt"
HANDOFF_FILE = "HANDOFF.md"

# Google AI Studio API Key — set via env var or paste here
API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not API_KEY:
    print("Error: No API key found.")
    print("Set it via:  set GEMINI_API_KEY=your_key_here")
    print("Or paste it directly into the script's API_KEY variable.")
    sys.exit(1)

client = genai.Client(api_key=API_KEY)

os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Ingredient Keyword Extraction ---
SCENT_VISUALS = {
    "lavender": "fresh lavender sprigs and purple lavender flowers",
    "vanilla": "vanilla bean pods and warm amber crystals",
    "rose": "deep red rose petals and rose buds",
    "jasmine": "white jasmine flowers and green leaves",
    "sandalwood": "sandalwood chips and warm golden wood shavings",
    "saffron": "saffron threads and golden spice",
    "kesar": "saffron threads and golden spice",
    "coffee": "roasted coffee beans and espresso crema",
    "mango": "ripe alphonso mangoes sliced open, tropical",
    "orange": "fresh orange slices and citrus zest",
    "lemon": "lemon slices and citrus leaves",
    "apple": "fresh red and green apples, sliced",
    "cinnamon": "cinnamon sticks and star anise",
    "cardamom": "green cardamom pods and whole spices",
    "ocean": "turquoise ocean water, sea salt crystals, driftwood",
    "sea": "turquoise ocean water, sea salt crystals, seashells",
    "aqua": "crystal clear water droplets and sea glass",
    "musk": "soft white fabric, delicate musk crystals",
    "oudh": "dark oud wood chips and smoky incense",
    "oud": "dark oud wood chips and smoky incense",
    "patchouli": "patchouli leaves and dark earth",
    "tea": "green tea leaves and a ceramic tea cup",
    "mint": "fresh peppermint leaves and ice crystals",
    "peach": "ripe peaches sliced open with soft fuzz",
    "coconut": "fresh coconut halves and tropical palm leaves",
    "strawberry": "fresh ripe strawberries with tiny flowers",
    "cherry": "cherry blossoms and pink petals floating",
    "lily": "white lily flowers with golden pollen",
    "mogra": "white mogra (Arabian jasmine) buds and flowers",
    "honey": "golden honey dripping from a wooden dipper",
    "chocolate": "dark chocolate shavings and cocoa powder",
    "choco": "dark chocolate shavings and cocoa powder",
    "leather": "rich brown leather with brass buckles",
    "wood": "warm teak wood and cedar shavings",
    "mahogany": "polished mahogany wood grain and cedar chips",
    "bamboo": "fresh bamboo stalks and green leaves",
    "pine": "pine needles and fresh evergreen branches",
    "pineapple": "fresh golden pineapple slices, tropical",
    "fig": "ripe figs cut open showing seeds",
    "papaya": "ripe papaya halves with black seeds",
    "cucumber": "fresh sliced cucumber with water droplets",
    "aloe": "sliced aloe vera leaves with gel visible",
    "ginger": "fresh ginger root and lime slices",
    "lime": "fresh lime halves and citrus zest",
    "wine": "red wine in a crystal glass with grape clusters",
    "amber": "warm amber resin crystals and golden light",
    "lotus": "pink lotus flowers floating on water",
    "vetiver": "vetiver grass roots and earthy green stalks",
    "berry": "mixed berries - blackberries, raspberries, blueberries",
    "floral": "mixed wildflowers - peonies, roses, and daisies",
    "fruit": "mixed tropical fruits arrangement",
    "citrus": "mixed citrus slices - orange, lemon, lime",
    "spice": "whole spices - cloves, cardamom, cinnamon, star anise",
    "tulsi": "holy basil (tulsi) leaves and stems",
    "neem": "neem leaves and small white neem flowers",
    "gulab": "deep pink Indian roses (gulab) with petals",
    "orchid": "exotic purple and white orchid blooms",
    "gardenia": "white gardenia flowers with glossy green leaves",
    "frangipani": "tropical plumeria (frangipani) flowers, yellow and white",
    "lilac": "clusters of purple lilac flowers",
    "bubble": "iridescent soap bubbles and candy colors",
    "temple": "burning incense sticks, marigold garlands, brass bells",
    "chai": "masala chai with whole spices - cardamom, cloves, cinnamon",
    "pie": "warm baked pie with cinnamon and brown sugar crust",
    "soap": "white soap bars with creamy lather and bubbles",
    "milk": "creamy milk splash and soft white texture",
    "ladoo": "golden Indian ladoo sweets with pistachios and saffron",
    "mithai": "golden Indian ladoo sweets with pistachios and saffron",
    "ice": "frost crystals and ice shards with cool blue light",
    "butterfly": "colorful butterflies and wildflower meadow",
    "sand": "pink desert sand dunes at golden hour",
    "oakmoss": "green oakmoss and damp forest floor",
    "oak": "aged oak barrel wood with autumn leaves",
}


def extract_visual_keywords(product_name, top_notes_text):
    """Extract the best visual ingredient keywords from the product name and notes."""
    if isinstance(top_notes_text, list):
        top_notes_text = ", ".join(top_notes_text)
    combined = (product_name + " " + (top_notes_text or "")).lower()
    
    visuals = []
    for keyword, visual_desc in SCENT_VISUALS.items():
        if keyword in combined:
            visuals.append(visual_desc)
    
    if visuals:
        return ", ".join(visuals[:2])
    
    clean_name = product_name.replace("Fragrance Oil", "").strip()
    return f"ingredients and botanicals related to {clean_name}"


def build_prompt(display_name, visual_elements):
    """Construct the image generation prompt."""
    return (
        f"Ultra-premium luxury product photography of an elegant amber glass dropper bottle "
        f"with a minimalist cream label reading 'EKORA BAZAAR' in serif font, placed on a "
        f"dark marble surface. Artfully scattered around the bottle: {visual_elements}. "
        f"Moody, cinematic studio lighting with soft bokeh background. Dark, warm color palette. "
        f"Shot on a medium format camera, 85mm lens, f/2.8, shallow depth of field. "
        f"Professional e-commerce product photography style. 8K quality. "
        f"The scene feels artisanal, sensory, and ultra-premium."
    )


def generate_image(prompt, output_path, display_name):
    """Call Gemini 3.1 Flash Image to generate and save an image."""
    try:
        interaction = client.interactions.create(
            model="gemini-3.1-flash-image",
            input=prompt,
        )

        if interaction.output_image and interaction.output_image.data:
            image_bytes = base64.b64decode(interaction.output_image.data)
            with open(output_path, "wb") as f:
                f.write(image_bytes)
            return True
        
        print(f"  -> WARNING: No image data in response for {display_name}")
        with open(FAILED_LOG, "a", encoding="utf-8") as log:
            log.write(f"Failed: {display_name} | Error: No image data in response\n")
        return False

    except Exception as e:
        error_msg = str(e)
        print(f"  -> ERROR: {error_msg[:150]}")
        with open(FAILED_LOG, "a", encoding="utf-8") as log:
            log.write(f"Failed: {display_name} | Error: {error_msg}\n")
        
        # If rate limited, wait and signal to retry
        if "429" in error_msg or "rate" in error_msg.lower() or "quota" in error_msg.lower():
            print("  -> Rate limited. Waiting 60 seconds before continuing...")
            time.sleep(60)
        
        return False


def update_handoff(processed, skipped, total, pending_names):
    """Update HANDOFF.md with current progress."""
    done = skipped + processed
    content = f"""# Project Handoff Status

**Total Products:** {total}

## Current Status
- **Text Generation (Groq):** ✅ Complete — 108/108 descriptions and fragrance notes done.
- **Image Generation (Gemini 2.5 Flash):** 🔄 In Progress — {done}/{total} completed.

## Pending Products (Image Generation)
{chr(10).join('- ' + n for n in pending_names[:20])}
{"- ... and " + str(len(pending_names) - 20) + " more" if len(pending_names) > 20 else ""}

## Next Exact Step to Resume
1. Re-run `python scripts/generate_covers_dalle.py` — it will auto-skip completed images.
2. After all {total} are done, copy images from `output_images/` to `public/images/products/` and update `products.json`.
3. `git add . && git commit -m "feat: bespoke product images" && git push`
"""
    with open(HANDOFF_FILE, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    # Load products
    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)
    
    oils = [p for p in products if "fragrance oil" in p.get("category", "").lower()]
    total = len(oils)
    print(f"Found {total} fragrance oils.\n")

    processed = 0
    skipped = 0
    failed = 0
    skip_streak = 0
    pending_names = []

    for idx, product in enumerate(oils, 1):
        display_name = product["name"].split(" (")[0].replace("Fragrance Oil", "").strip()
        
        # Safe filename
        safe_name = re.sub(r'[^\w\s-]', '', display_name).strip()
        safe_name = re.sub(r'\s+', '_', safe_name)
        output_filename = f"{safe_name}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        # RESUME: Skip if already exists and is a real image (>10KB)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 10000:
            skip_streak += 1
            skipped += 1
            continue
        else:
            if skip_streak > 0:
                print(f"Skipped 1-{skipped} (already generated).\n")
                skip_streak = 0

        pending_names.append(display_name)

        # Get top notes
        notes = product.get("fragranceNotes", {})
        top_notes = notes.get("top", "")
        
        # Build prompt
        visual_elements = extract_visual_keywords(product["name"], top_notes)
        prompt = build_prompt(display_name, visual_elements)
        
        print(f"Processing {idx}/{total}: {display_name}")
        print(f"  Visuals: {visual_elements[:80]}...")

        success = generate_image(prompt, output_path, display_name)
        
        if success:
            processed += 1
            if display_name in pending_names:
                pending_names.remove(display_name)
            print(f"  ✓ Saved to {output_path}")
        else:
            failed += 1

        # CHECKPOINT: Update HANDOFF.md every 5 products
        if (processed + failed) % 5 == 0:
            update_handoff(processed, skipped, total, pending_names)
            print(f"  [Checkpoint saved to HANDOFF.md]\n")

        # Gentle rate limiting — 10 seconds between requests
        time.sleep(10)

    # Final
    if skip_streak > 0:
        print(f"Skipped all {skipped} (already generated).\n")

    print("\n" + "=" * 50)
    print(f"  GENERATION COMPLETE")
    print(f"  Processed: {processed}")
    print(f"  Skipped:   {skipped}")
    print(f"  Failed:    {failed}")
    print("=" * 50)

    if failed > 0:
        print(f"\nCheck {FAILED_LOG} for error details.")

    update_handoff(processed, skipped, total, pending_names)


if __name__ == "__main__":
    main()
