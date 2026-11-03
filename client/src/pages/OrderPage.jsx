import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import api from "../api";

export default function OrderPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load order"));
  }, [id]);

  if (error) return <p className="status error">{error}</p>;
  if (!order) return <p className="status">Loading order...</p>;

  const a = order.shippingAddress;

  return (
    <div>
      {justPlaced && (
        <p className="success-box">
          Order placed. Thank you! We'll call you on {a.phone} before delivery.
        </p>
      )}

      <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>

      <div className="cart-layout">
        <div className="panel">
          <h2>Items</h2>
          {order.orderItems.map((item) => (
            <div className="order-line" key={item._id}>
              <span>{item.name} × {item.quantity}</span>
              <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}

          <h2 className="section-gap">Shipping to</h2>
          <p className="address">
            {a.fullName}<br />
            {a.address}<br />
            {a.city}<br />
            {a.phone}
          </p>
        </div>

        <div className="cart-summary">
          <h3>Summary</h3>
          <div className="summary-row">
            <span>Status</span>
            <span className={`pill ${order.status}`}>{order.status}</span>
          </div>
          <div className="summary-row">
            <span>Payment</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="summary-row">
            <span>Placed on</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>Rs. {order.totalPrice.toLocaleString()}</span>
          </div>
          <Link to="/my-orders" className="btn full">View all my orders</Link>
        </div>
      </div>
    </div>
  );
}