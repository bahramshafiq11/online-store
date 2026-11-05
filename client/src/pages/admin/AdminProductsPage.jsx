import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import AdminNav from "../../components/AdminNav";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setError("Could not load products"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;

    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete product");
    }
  };

  return (
    <div>
      <AdminNav />

      <div className="page-header">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn">+ Add product</Link>
      </div>

      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <img
                      className="thumb"
                      src={p.image || "https://placehold.co/400x300?text=No+Image"}
                      alt={p.name}
                    />
                  </td>
                  <td>{p.name}</td>
                  <td>Rs. {p.price.toLocaleString()}</td>
                  <td>{p.category}</td>
                  <td className={p.countInStock === 0 ? "error" : ""}>{p.countInStock}</td>
                  <td>
                    <div className="actions">
                      <Link to={`/admin/products/${p._id}/edit`} className="view-link">Edit</Link>
                      <button className="danger-link" onClick={() => handleDelete(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}