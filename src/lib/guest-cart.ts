export interface GuestCartItem {
  productId: string;
  quantity: number;
  // Snapshot for UX while logged out
  title?: string;
  imageUrl?: string;
  basePrice?: number;
}

const STORAGE_KEY = 'ekora_guest_cart';

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse guest cart', e);
    return [];
  }
}

export function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }
}

export function saveGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notifyCartUpdated();
}

export function addGuestCartItem(item: GuestCartItem) {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(i => i.productId === item.productId);
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
    // update snapshot info
    cart[existingIndex].title = item.title || cart[existingIndex].title;
    cart[existingIndex].imageUrl = item.imageUrl || cart[existingIndex].imageUrl;
    cart[existingIndex].basePrice = item.basePrice || cart[existingIndex].basePrice;
  } else {
    cart.push(item);
  }
  saveGuestCart(cart);
}

export function updateGuestCartItemQty(productId: string, quantity: number) {
  const cart = getGuestCart();
  const existing = cart.find(i => i.productId === productId);
  if (existing && quantity > 0) {
    existing.quantity = quantity;
    saveGuestCart(cart);
  }
}

export function removeGuestCartItem(productId: string) {
  const cart = getGuestCart().filter(i => i.productId !== productId);
  saveGuestCart(cart);
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  notifyCartUpdated();
}
