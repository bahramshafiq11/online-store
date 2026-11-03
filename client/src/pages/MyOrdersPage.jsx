import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders/mine")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Could not load your orders"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Loading orders...</p>;
  if (error) return <p className="status error">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="status">
        <p>You haven't placed any orders yet.</p>
        <Link to="/" className="back">Start shopping →</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>My Orders</h1>
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>#{o._id.slice(-6).toUpperCase()}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.orderItems.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td>Rs. {o.totalPrice.toLocaleString()}</td>
                <td><span className={`pill ${o.status}`}>{o.status}</span></td>
                <td><Link to={`/order/${o._id}`} className="view-link">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}