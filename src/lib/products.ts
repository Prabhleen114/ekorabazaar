import productsData from './data/products.json';

export const mockProducts = productsData;

export function getProductById(id: string) {
  return mockProducts.find((p: { id: string }) => p.id === id) || null;
}
