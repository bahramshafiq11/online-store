import { useEffect, useState } from "react";
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
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Ask the backend if online payment is set up
  useEffect(() => {
    api
      .get("/payments/config")
      .then((res) => setOnlineAvailable(res.data.online))
      .catch(() => {});
  }, []);

  // Nothing to check out (unless we're on our way to the payment page)
  if (cartItems.length === 0 && !leaving) return <Navigate to="/cart" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let orderId;
    try {
      const res = await api.post("/orders", {
        orderItems: cartItems.map((i) => ({ product: i._id, quantity: i.qty })),
        shippingAddress: form,
        paymentMethod,
      });
      orderId = res.data._id;
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order. Try again.");
      setLoading(false);
      return;
    }

    setLeaving(true);

    if (paymentMethod === "Online Payment") {
      try {
        const pay = await api.post(`/payments/${orderId}/start`);
        clearCart();
        window.location.href = pay.data.url; // go to Safepay
      } catch {
        clearCart();
        navigate(`/order/${orderId}?payment=notstarted`);
      }
      return;
    }

    navigate(`/order/${orderId}`, { state: { justPlaced: true } });
    clearCart();
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
          <div className="pay-options">
            <label
              className={`pay-option ${paymentMethod === "Cash on Delivery" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="Cash on Delivery"
                checked={paymentMethod === "Cash on Delivery"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>
                <strong>Cash on Delivery</strong>
                <span className="muted">Pay when your order arrives</span>
              </span>
            </label>

            {onlineAvailable && (
              <label
                className={`pay-option ${paymentMethod === "Online Payment" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Online Payment"
                  checked={paymentMethod === "Online Payment"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>
                  <strong>Pay online</strong>
                  <span className="muted">Card or wallet, through Safepay (test mode)</span>
                </span>
              </label>
            )}
          </div>
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
            {loading
              ? "Please wait..."
              : paymentMethod === "Online Payment"
              ? "Continue to payment"
              : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}