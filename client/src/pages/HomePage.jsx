import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setError("Could not load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Loading products...</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div>
      <h1>Latest Products</h1>
      <div className="product-grid">
        {products.map((p) => (
          <Link to={`/product/${p._id}`} key={p._id} className="product-card">
            <img
              src={p.image || "https://placehold.co/400x300?text=No+Image"}
              alt={p.name}
            />
            <h3>{p.name}</h3>
            <p className="price">Rs. {p.price.toLocaleString()}</p>
            <p className={p.countInStock > 0 ? "stock" : "stock out"}>
              {p.countInStock > 0 ? "In stock" : "Out of stock"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}