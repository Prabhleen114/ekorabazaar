import os
import re

dl_dir = r'C:\Users\prabh\Downloads\product image'
dl_files = set(os.listdir(dl_dir)) if os.path.exists(dl_dir) else set()

with open('scripts/apply_photo_processing.py', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'"(Gemini_Generated_Image_[^"]+)"', content)
script_files = set(matches)

print('Downloads files count:', len(dl_files))
print('Script files count:', len(script_files))
print('In downloads but not in script:', dl_files - script_files)
print('In script but not in downloads:', script_files - dl_files)
