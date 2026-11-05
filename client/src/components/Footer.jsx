import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-mark">M</span>
            MyStore
          </Link>
          <p>Quality products, honest prices, delivered to your door.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/my-orders">My orders</Link>
        </nav>

        <p className="footer-copy">
          © {year} MyStore · Built by{" "}
          <a href="https://github.com/bahramshafiq11" target="_blank" rel="noreferrer">
            Bahram Shafiq
          </a>
        </p>
      </div>
    </footer>
  );
}