import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import AdminNav from "../../components/AdminNav";
import Pagination from "../../components/Pagination";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api
      .get("/products", { params: { page, limit: 10 } })
      .then((res) => {
        if (ignore) return;
        // If the last product on a page was deleted, go back one page
        if (res.data.products.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setProducts(res.data.products);
        setPages(res.data.pages);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (!ignore) setError("Could not load products");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, reloadKey]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;

    try {
      await api.delete(`/products/${product._id}`);
      setReloadKey((k) => k + 1); // reload the current page
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete product");
    }
  };

  return (
    <div>
      <AdminNav />

      <div className="page-header">
        <h1>Products ({total})</h1>
        <Link to="/admin/products/new" className="btn">+ Add product</Link>
      </div>

      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
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

          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}