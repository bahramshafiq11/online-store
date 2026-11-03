import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { cartItems, updateQty, removeFromCart, totalPrice, itemCount } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="status">
        <p>Your cart is empty.</p>
        <Link to="/" className="back">Go shopping →</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <img
                src={item.image || "https://placehold.co/400x300?text=No+Image"}
                alt={item.name}
              />
              <Link to={`/product/${item._id}`} className="cart-name">
                {item.name}
              </Link>
              <p>Rs. {item.price.toLocaleString()}</p>
              <select
                value={item.qty}
                onChange={(e) => updateQty(item._id, Number(e.target.value))}
              >
                {Array.from({ length: Math.min(item.countInStock, 10) }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>{n}</option>
                  )
                )}
              </select>
              <button className="remove" onClick={() => removeFromCart(item._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <p>Items: {itemCount}</p>
          <p className="price">Total: Rs. {totalPrice.toLocaleString()}</p>
          <button className="btn full" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}