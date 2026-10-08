import re

with open('src/app/shop/ShopClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# We need to insert a horizontal scrollable list of pills right after the Applied Filters or the Control Bar
injection_point = r"\{/\* ========================================================================= \*/\}\s*\{/\* MAIN FULL-WIDTH PRODUCT GRID"

pills_ui = """
        {/* Horizontal Quick Filters for Mobile (F-15) */}
        <div className="lg:hidden w-full overflow-x-auto snap-x scrollbar-hide py-3 mb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-2 w-max">
            {!selectedDepartment && DEPARTMENTS.map(dept => (
              <button
                key={dept.name}
                onClick={() => setDepartment(dept.name)}
                className="snap-start shrink-0 px-4 py-2 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {dept.name}
              </button>
            ))}
            {selectedDepartment && DEPARTMENTS.find(d => d.name === selectedDepartment)?.subcategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full border text-xs font-semibold ${selectedCategory === cat ? 'bg-amber-100 border-amber-300 text-amber-900' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN FULL-WIDTH PRODUCT GRID"""

if 'Horizontal Quick Filters for Mobile' not in c:
    c = re.sub(injection_point, pills_ui, c)
    with open('src/app/shop/ShopClient.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Horizontal pills injected")
else:
    print("Already injected")
