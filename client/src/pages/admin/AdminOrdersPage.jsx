import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import AdminNav from "../../components/AdminNav";

const STATUSES = ["pending", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Could not load orders"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: res.data.status } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status");
    }
  };

  return (
    <div>
      <AdminNav />
      <h1>All Orders</h1>

      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="status">No orders yet.</p>}

      {orders.length > 0 && (
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>#{o._id.slice(-6).toUpperCase()}</td>
                  <td>
                    {o.user?.name || "Deleted user"}
                    <div className="muted">{o.user?.email}</div>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>Rs. {o.totalPrice.toLocaleString()}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td><Link to={`/order/${o._id}`} className="view-link">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}