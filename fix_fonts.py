import re

with open('src/app/checkout/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace text-sm with text-base on inputs
c = re.sub(r'(<input[^>]+className="[^"]*)text-sm([^"]*")', r'\1text-base\2', c)

with open('src/app/checkout/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Font size updated")
