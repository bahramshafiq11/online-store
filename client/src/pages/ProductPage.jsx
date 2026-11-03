import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Product not found"));
  }, [id]);

  if (error) return <p className="status error">{error}</p>;
  if (!product) return <p className="status">Loading...</p>;

  const inStock = product.countInStock > 0;
  const maxQty = Math.min(product.countInStock, 10);

  const handleAddToCart = () => {
    addToCart(product, qty);
    navigate("/cart");
  };

  return (
    <div>
      <Link to="/" className="back">← Back to products</Link>

      <div className="product-detail">
        <img
          src={product.image || "https://placehold.co/400x300?text=No+Image"}
          alt={product.name}
        />

        <div>
          <h1>{product.name}</h1>
          <p className="price">Rs. {product.price.toLocaleString()}</p>
          <p>{product.description}</p>
          <p>Category: {product.category}</p>
          <p className={inStock ? "stock" : "stock out"}>
            {inStock ? `${product.countInStock} in stock` : "Out of stock"}
          </p>

          {inStock && (
            <div className="add-to-cart">
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button className="btn" onClick={handleAddToCart}>
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}