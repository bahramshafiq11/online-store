import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  // Save the cart whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty) => {
    setCartItems((items) => {
      const existing = items.find((i) => i._id === product._id);
      if (existing) {
        return items.map((i) =>
          i._id === product._id
            ? { ...i, qty: Math.min(i.qty + qty, product.countInStock) }
            : i
        );
      }
      return [
        ...items,
        {
          _id: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          countInStock: product.countInStock,
          qty,
        },
      ];
    });
  };

  const updateQty = (id, qty) =>
    setCartItems((items) => items.map((i) => (i._id === id ? { ...i, qty } : i)));

  const removeFromCart = (id) =>
    setCartItems((items) => items.filter((i) => i._id !== id));

  const clearCart = () => setCartItems([]);

  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQty, removeFromCart, clearCart, itemCount, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}