import re

with open('src/app/shop/ShopClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacement = """const getGridColsClass = () => {
    switch (gridCols) {
      case 2: return "grid grid-cols-2 sm:grid-cols-2 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-8 lg:gap-x-6 lg:gap-y-10";
      case 3: return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-8 lg:gap-x-6 lg:gap-y-10";
      case 5: return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-8 lg:gap-x-6 lg:gap-y-10";
      case 4:
      default: return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-8 lg:gap-x-6 lg:gap-y-10";
    }
  };"""

# Replace the mangled or original function
c = re.sub(r'const getGridColsClass = \(\) => \{[\s\S]*?^\s*\};', replacement, c, flags=re.MULTILINE)

with open('src/app/shop/ShopClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Grid fixed")
