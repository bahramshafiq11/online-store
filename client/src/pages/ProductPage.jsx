import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Rating from "../components/Rating";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
  const myReview = user && product.reviews.find((r) => r.user === user._id);
  const reviews = [...product.reviews].reverse(); // newest first

  const handleAddToCart = () => {
    addToCart(product, qty);
    navigate("/cart");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");

    if (rating === 0) {
      setReviewError("Pick a star rating first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/products/${id}/reviews`, { rating, comment });
      setProduct(res.data);
      setRating(0);
      setComment("");
    } catch (err) {
      setReviewError(err.response?.data?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const res = await api.delete(`/products/${id}/reviews/${reviewId}`);
      setProduct(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete review");
    }
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
          {product.numReviews > 0 ? (
            <Rating
              value={product.rating}
              text={`${product.rating.toFixed(1)} (${product.numReviews} review${
                product.numReviews !== 1 ? "s" : ""
              })`}
            />
          ) : (
            <span className="muted">No reviews yet</span>
          )}
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

      <section className="reviews">
        <h2>Customer reviews</h2>

        <div className="reviews-layout">
          <div>
            {reviews.length === 0 ? (
              <p className="muted">No reviews yet. Be the first to review this product.</p>
            ) : (
              reviews.map((r) => (
                <div className="review" key={r._id}>
                  <div className="review-header">
                    <strong>{r.name}</strong>
                    <span className="muted">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Rating value={r.rating} />
                  <p>{r.comment}</p>
                  {user && (r.user === user._id || user.isAdmin) && (
                    <button
                      className="danger-link small"
                      onClick={() => handleDeleteReview(r._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="panel">
            {!user ? (
              <p>
                <Link to={`/login?redirect=/product/${id}`} className="view-link">
                  Log in
                </Link>{" "}
                to write a review.
              </p>
            ) : myReview ? (
              <p className="muted">You've reviewed this product. Thanks for your feedback!</p>
            ) : (
              <form className="form-grid" onSubmit={handleReviewSubmit}>
                <h3>Write a review</h3>
                {reviewError && <p className="form-error">{reviewError}</p>}

                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={n <= rating ? "on" : ""}
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label>
                  Comment
                  <textarea
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    required
                  />
                </label>

                <button className="btn full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}