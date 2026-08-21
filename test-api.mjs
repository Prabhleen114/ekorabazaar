async function main() {
  console.log("Fetching /api/products...")
  try {
    const res = await fetch("http://localhost:3000/api/products")
    const data = await res.json()
    console.log(`API returned ${data.length} products.`)
    
    const counts = {}
    data.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    console.log("Counts per category in API:")
    console.log(counts)
    
    // Simulate filtering
    const categoriesToTest = [
      "Eco-Resin & Stone Moulds",
      "Soap & Bar Moulds",
      "General Silicone Moulds",
      "Culinary & Fondant Moulds",
      "Candle & Pillar Moulds"
    ]
    
    for (const cat of categoriesToTest) {
      // Logic from ShopClient
      const search = decodeURIComponent(cat).toLowerCase().trim()
      const matched = []
      
      const dbCategories = Object.keys(counts)
      dbCategories.forEach((dbc) => {
        const dbcLower = dbc.toLowerCase();
        if (dbcLower === search || dbcLower.includes(search) || search.includes(dbcLower)) {
          matched.push(dbc);
        }
      });
      
      let filtered = data.filter(p => matched.includes(p.category))
      console.log(`Filter for '${cat}' matched DB categories: [${matched.join(", ")}] -> ${filtered.length} products`)
    }
  } catch(e) {
    console.error("Fetch failed:", e.message)
  }
}
main()
