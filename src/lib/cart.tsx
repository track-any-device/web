'use client';

import React from 'react';

/* Client-side shopping cart — React context persisted to localStorage. The cart holds the real DB
   `productId` (resolved from the Shop API, never fabricated) plus presentation fields, so checkout
   can POST one DeviceOrder per line. Mounted in the root layout so every surface (marketing site,
   /shop, /products/[slug], /cart, /checkout, and both headers) shares one cart. */

export interface CartItem {
  /** Real DB product id (from the Shop API) — what checkout posts. */
  productId: number;
  sku: string;
  name: string;
  /** Unit price in PKR. */
  price: number;
  image?: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Sum of quantities across all lines. */
  count: number;
  /** Sum of price * qty across all lines (PKR). */
  subtotal: number;
  /** True until the persisted cart has hydrated from localStorage (avoids SSR/CSR flicker). */
  ready: boolean;
  /** Add an item; if the productId is already in the cart, its quantity is increased. */
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (productId: number) => void;
  /** Set an exact quantity; qty <= 0 removes the line. */
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
}

const STORAGE_KEY = 'tad_cart';

/** Format a PKR amount the TAD-PAK way: `Rs 6,500`. */
export function formatPkr(n: number): string {
  return `Rs ${Math.round(n).toLocaleString('en-PK')}`;
}

const CartContext = React.createContext<CartContextValue | null>(null);

function isValidItem(x: unknown): x is CartItem {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.productId === 'number' &&
    typeof i.sku === 'string' &&
    typeof i.name === 'string' &&
    typeof i.price === 'number' &&
    typeof i.qty === 'number'
  );
}

function load(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidItem);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [ready, setReady] = React.useState(false);

  // Hydrate from localStorage after mount (server render starts with an empty cart).
  React.useEffect(() => {
    setItems(load());
    setReady(true);
  }, []);

  // Persist on change (only once hydrated, so we never clobber storage with the initial empty state).
  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / unavailable — keep working in-memory */
    }
  }, [items, ready]);

  // Keep multiple tabs in sync.
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(load());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = React.useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    if (qty < 1) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove = React.useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = React.useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    );
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const count = React.useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = React.useMemo(() => items.reduce((n, i) => n + i.price * i.qty, 0), [items]);

  const value = React.useMemo<CartContextValue>(
    () => ({ items, count, subtotal, ready, add, remove, setQty, clear }),
    [items, count, subtotal, ready, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>');
  return ctx;
}
