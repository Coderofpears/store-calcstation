export interface CartItem {
  gameId: string;
  title: string;
  price: number;
  cover: string;
}

const CART_KEY = "neon-game-store-cart";

export const loadCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartItem[]): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (item: CartItem): boolean => {
  const cart = loadCart();
  if (cart.some(c => c.gameId === item.gameId)) {
    return false; // Already in cart
  }
  cart.push(item);
  saveCart(cart);
  return true;
};

export const removeFromCart = (gameId: string): void => {
  const cart = loadCart().filter(c => c.gameId !== gameId);
  saveCart(cart);
};

export const clearCart = (): void => {
  saveCart([]);
};