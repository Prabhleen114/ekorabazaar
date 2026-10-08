import re

filepath = 'outputs/Ekora Bazaar UX Audit - Verified.md'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Update F-14 status
c = re.sub(r'\| F-14(.*?)\| Fix specified \|', r'| F-14\1| Fixed |', c)

# Update F-13 status
c = re.sub(r'\| F-13(.*?)\| Fix specified \|', r'| F-13\1| Fixed |', c)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print("Markdown updated")
