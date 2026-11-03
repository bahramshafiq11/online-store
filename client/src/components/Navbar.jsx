import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { itemCount } = useCart();

  return (
    <header className="navbar">
      <Link to="/" className="logo">MyStore</Link>
      <nav>
        <Link to="/cart">
          Cart {itemCount > 0 && <span className="badge">{itemCount}</span>}
        </Link>
        <Link to="/login">Login</Link>
      </nav>
    </header>
  );
}