import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || "",
    address: "",
    city: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Nothing to check out
  if (cartItems.length === 0) return <Navigate to="/cart" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/orders", {
        orderItems: cartItems.map((i) => ({ product: i._id, quantity: i.qty })),
        shippingAddress: form,
      });
      navigate(`/order/${res.data._id}`, { state: { justPlaced: true } });
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order. Try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Checkout</h1>
      {error && <p className="form-error">{error}</p>}

      <form className="cart-layout" onSubmit={handleSubmit}>
        <div className="panel">
          <h2>Shipping address</h2>
          <div className="form-grid">
            <label>
              Full name
              <input name="fullName" value={form.fullName} onChange={handleChange} required />
            </label>
            <label>
              Address
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House 12, Street 5"
                required
              />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              Phone
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="03001234567"
                required
              />
            </label>
          </div>

          <h2 className="section-gap">Payment</h2>
          <p>Cash on Delivery</p>
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          {cartItems.map((i) => (
            <div className="summary-row" key={i._id}>
              <span>{i.name} × {i.qty}</span>
              <span>Rs. {(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Total</span>
            <span>Rs. {totalPrice.toLocaleString()}</span>
          </div>
          <button className="btn full" disabled={loading}>
            {loading ? "Placing order..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}