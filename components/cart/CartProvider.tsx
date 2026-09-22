"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  nameKo: string;
  brandName: string;
  size: number;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartContext = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (slug: string, size: number) => void;
  setQuantity: (slug: string, size: number, quantity: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartContext | null>(null);
const KEY = "sole-atelier-cart-v1";

function keyOf(slug: string, size: number) {
  return slug + "__" + size;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // localStorage 는 시크릿 모드나 차단 설정에서 던질 수 있어 항상 감싼다.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* 저장소를 못 읽어도 빈 장바구니로 계속 동작한다 */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* 용량 초과·차단 시 무시 */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => keyOf(x.slug, x.size) === keyOf(item.slug, item.size));
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + quantity };
        return next;
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const remove = useCallback((slug: string, size: number) => {
    setItems((prev) => prev.filter((x) => keyOf(x.slug, x.size) !== keyOf(slug, size)));
  }, []);

  const setQuantity = useCallback((slug: string, size: number, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((x) => keyOf(x.slug, x.size) !== keyOf(slug, size))
        : prev.map((x) =>
            keyOf(x.slug, x.size) === keyOf(slug, size) ? { ...x, quantity } : x,
          ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContext>(
    () => ({
      items,
      ready,
      count: items.reduce((n, x) => n + x.quantity, 0),
      subtotal: items.reduce((n, x) => n + x.quantity * x.price, 0),
      add,
      remove,
      setQuantity,
      clear,
    }),
    [items, ready, add, remove, setQuantity, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart 는 CartProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}
