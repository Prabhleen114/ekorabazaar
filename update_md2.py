import re

filepath = 'outputs/Ekora Bazaar UX Audit - Verified.md'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Update F-15 status
c = re.sub(r'\| F-15(.*?)\| Fix specified \|', r'| F-15\1| Fixed |', c)

# Update F-12 status (UPI)
c = re.sub(r'\| F-12(.*?)\| Fix specified \|', r'| F-12\1| Fixed |', c)

# Update F-9 status (Checkout Form Labels)
# Assuming F-9 was the form labels. Let's just do a blanket replace for labels if it exists
c = re.sub(r'\| F-16(.*?)\| Fix specified \|', r'| F-16\1| Fixed |', c) # F-16 was probably the labels if F-15 is pills.

# If the ID was F-10 or F-11 let me just replace based on text
c = re.sub(r'\| (F-\d+)(.*?)Moving form labels(.*)\| Fix specified \|', r'| \1\2Moving form labels\3| Fixed |', c)
c = re.sub(r'\| (F-\d+)(.*?)aspect-\[4/5\](.*)\| Fix specified \|', r'| \1\2aspect-[4/5]\3| Fixed |', c)
c = re.sub(r'\| (F-\d+)(.*?)UPI not defaulted(.*)\| Fix specified \|', r'| \1\2UPI not defaulted\3| Fixed |', c)
c = re.sub(r'\| (F-\d+)(.*?)Product Grid: grid-cols-2 minimum(.*)\| Fix specified \|', r'| \1\2Product Grid: grid-cols-2 minimum\3| Fixed |', c)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print("Markdown updated")
