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
          next.delete("page"); // new search starts at page 1
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

  const handleCategory = (e) => {
    const value = e.target.value;
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const filtering = search || category;

  return (
    <div>
      <h1>{filtering ? "Search results" : "Latest Products"}</h1>

      <div className="filters">
        <input
          type="search"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={category} onChange={handleCategory}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {filtering && (
          <button className="btn secondary" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p className="status">Loading products...</p>
      ) : error ? (
        <p className="status error">{error}</p>
      ) : products.length === 0 ? (
        <p className="status">No products match your search.</p>
      ) : (
        <>
          <p className="muted result-count">
            {total} product{total !== 1 && "s"}
            {pages > 1 && ` · Page ${page} of ${pages}`}
          </p>

          <div className="product-grid">
            {products.map((p) => (
              <Link to={`/product/${p._id}`} key={p._id} className="product-card">
                <img
                  src={p.image || "https://placehold.co/400x300?text=No+Image"}
                  alt={p.name}
                />
                <h3>{p.name}</h3>
                {p.numReviews > 0 ? (
                  <Rating value={p.rating} text={`(${p.numReviews})`} />
                ) : (
                  <span className="muted">No reviews yet</span>
                )}
                <p className="price">Rs. {p.price.toLocaleString()}</p>
                <p className={p.countInStock > 0 ? "stock" : "stock out"}>
                  {p.countInStock > 0 ? "In stock" : "Out of stock"}
                </p>
              </Link>
            ))}
          </div>

          <Pagination page={page} pages={pages} onChange={changePage} />
        </>
      )}
    </div>
  );
}