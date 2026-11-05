import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import Rating from "../components/Rating";
import Pagination from "../components/Pagination";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load category list once
  useEffect(() => {
    api
      .get("/products/categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Update the address 400ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const value = searchInput.trim();
          if (value === (prev.get("search") || "")) return prev;

          const next = new URLSearchParams(prev);
          if (value) next.set("search", value);
          else next.delete("search");
          next.delete("page");
          return next;
        },
        { replace: true }
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  // Fetch products whenever search, category or page changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    const params = { page };
    if (search) params.search = search;
    if (category) params.category = category;

    api
      .get("/products", { params })
      .then((res) => {
        if (ignore) return;
        setProducts(res.data.products);
        setPages(res.data.pages);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (!ignore) setError("Could not load products. Is the backend running?");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search, category, page]);

  const selectCategory = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("category", value);
      else next.delete("category");
      next.delete("page");
      return next;
    });
  };

  const changePage = (n) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (n > 1) next.set("page", n);
      else next.delete("page");
      return next;
    });
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const filtering = search || category;
  const showHero = !filtering && page === 1;

  return (
    <div>
      {showHero && (
        <section className="hero">
          <div className="hero-text">
            <span className="eyebrow">The MyStore collection</span>
            <h1 className="hero-title">
              Everyday things, <em>thoughtfully</em> chosen.
            </h1>
            <p className="hero-sub">
              From tech to home goods, find quality products at honest prices, delivered
              straight to your door.
            </p>
            <div className="hero-actions">
              <a href="#products" className="btn">Shop now</a>
              <Link to="/my-orders" className="btn secondary">Track an order</Link>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-block">
              <span className="hero-monogram">M</span>
            </div>
            <div className="hero-chip chip-1">✓ Cash on Delivery</div>
            <div className="hero-chip chip-2">✓ Secure card payments</div>
            <div className="hero-chip chip-3">✓ Order updates by email</div>
          </div>
        </section>
      )}

      <section id="products" className="products-section">
        <div className="section-head">
          <div>
            <h2>{filtering ? "Search results" : "Latest products"}</h2>
            {!loading && !error && (
              <p className="muted">
                {total} product{total !== 1 && "s"}
                {pages > 1 && ` · Page ${page} of ${pages}`}
              </p>
            )}
          </div>

          <div className="filters">
            <input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
            {filtering && (
              <button className="btn secondary" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="chips" role="group" aria-label="Categories">
            <button
              className={`chip ${!category ? "active" : ""}`}
              onClick={() => selectCategory("")}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${category === c ? "active" : ""}`}
                onClick={() => selectCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="status">Loading products...</p>
        ) : error ? (
          <p className="status error">{error}</p>
        ) : products.length === 0 ? (
          <div className="empty">
            <p>No products match your search.</p>
            <button className="btn secondary" onClick={clearFilters}>Show all products</button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((p) => (
                <Link to={`/product/${p._id}`} key={p._id} className="product-card">
                  <div className="product-media">
                    <img
                      src={p.image || "https://placehold.co/400x300?text=No+Image"}
                      alt={p.name}
                      loading="lazy"
                    />
                    <span className="tag">{p.category}</span>
                    {p.countInStock === 0 && <span className="sold-out">Sold out</span>}
                  </div>

                  <div className="product-body">
                    <h3>{p.name}</h3>
                    {p.numReviews > 0 ? (
                      <Rating value={p.rating} text={`(${p.numReviews})`} />
                    ) : (
                      <span className="muted">No reviews yet</span>
                    )}
                    <div className="product-foot">
                      <span className="price">Rs. {p.price.toLocaleString()}</span>
                      {p.countInStock > 0 && p.countInStock <= 5 && (
                        <span className="low-stock">Only {p.countInStock} left</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination page={page} pages={pages} onChange={changePage} />
          </>
        )}
      </section>
    </div>
  );
}