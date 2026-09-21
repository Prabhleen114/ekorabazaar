import sys
import json
from bs4 import BeautifulSoup

with open(r'C:\Users\prabh\.gemini\antigravity\brain\80e0808b-3057-4517-a308-a2741bddb352\.system_generated\steps\10034\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
products = []
for p in soup.find_all('div', class_='product-small'):
    name_el = p.find('p', class_='name')
    name = name_el.get_text(strip=True) if name_el else ''
    link_el = name_el.find('a') if name_el else None
    link = link_el['href'] if link_el and 'href' in link_el.attrs else ''
    
    price_el = p.find('span', class_='price')
    price = price_el.get_text(strip=True) if price_el else ''
    
    img_el = p.find('img')
    img_src = ''
    if img_el:
        img_src = img_el.get('data-src') or img_el.get('src') or ''
        
    products.append({
        'name': name,
        'link': link,
        'price': price,
        'img': img_src
    })

# Filter only items with 'wax' or 'butter'
wb_items = []
for p in products:
    name_lower = p['name'].lower()
    # exclude equipment like melter, funnel, etc.
    if ('wax' in name_lower or 'butter' in name_lower) and not any(eq in name_lower for eq in ['melter', 'funnel', 'bowl', 'stearic']):
        wb_items.append(p)

print(f"Total products found: {len(products)}")
print(f"Total Wax & Butter items (excluding equipment): {len(wb_items)}")

with open('scratch/wb_items.json', 'w', encoding='utf-8') as f:
    json.dump(wb_items, f, indent=2, ensure_ascii=False)

for i, p in enumerate(wb_items, 1):
    category = 'Candle Waxes & Additives' if 'wax' in p['name'].lower() else 'Raw Butters & Carrier Oils'
    clean_name = p['name'].replace('Vedini', '').replace('VEDINI', '').replace('Jindeal', '').replace('JINDEAL', '').strip()
    clean_name = ' '.join(clean_name.split())
    print(f"{i}. [{category}] {clean_name} | {p['price']} | {p['link']}")
