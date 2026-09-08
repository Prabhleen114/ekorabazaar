async function get() {
  const res = await fetch("http://localhost:3000/api/products?limit=1");
  const data = await res.json();
  console.log(data.products[0].id);
}
get();
