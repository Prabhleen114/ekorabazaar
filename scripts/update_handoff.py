import re

completed_fos = [
    "Bois De Rose",
    "Bubble Gum",
    "Butterfly Fragrance",
    "Cherry Blossom",
    "Clean Ocean",
    "Fresh Oudh",
    "Jasmine Knight",
    "Midnight Blue Citrus",
    "Mulberry Vanilla",
    "Strawberry Lush",
    "Twilight Bloom" # not explicitly listed, but let's check
    "Aqua Fresh",
    "Cactus Blossom",
    "Golden Women",
    "Iris Lime",
    "Lavender Florence",
    "Musk Gold",
    "Orange & Cinnamon",
    "Roasted Coffee",
    "Temple Fragrance"
]

completed_eos = [
    "Ajwain Essential Oil",
    "Cinnamon Bark & Leaf Essential Oil",
    "Clove Bud & Leaf Essential Oil",
    "Garlic Essential Oil",
    "Geranium Essential Oil",
    "Jasmine Grandiflorum Essential Oil",
    "Lavender Essential Oil",
    "Lemon", # Check what it is in EO list
    "Palmarosa Essential Oil",
    "Pure Anise & Basil Essential Oil",
    "Rose & Rose Geranium Essential Oil",
    "Rosewood Essential Oil",
    "Saffron Essential Oil",
    "Spearmint & Star Anise Essential Oil",
    "Turmeric Leaf & Root Essential Oil",
    "Vanilla & Vetiver Essential Oil",
    "Ylang Ylang Essential Oil"
]

with open('HANDOFF.md', 'r', encoding='utf-8') as f:
    content = f.read()

# For pending FO, mark as done
for fo in completed_fos:
    content = re.sub(rf"(\d+\.\s)({fo})", r"\1~~\2~~ ✅ Done", content, flags=re.IGNORECASE)

# For pending EO, mark as done
for eo in completed_eos:
    content = re.sub(rf"(\d+\.\s)({eo})", r"\1~~\2~~ ✅ Done", content, flags=re.IGNORECASE)
    
# We also did Sweet Basil
content = re.sub(r"(\d+\.\s)(Sweet Basil)", r"\1~~\2~~ ✅ Done", content, flags=re.IGNORECASE)

with open('HANDOFF.md', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated HANDOFF.md")
