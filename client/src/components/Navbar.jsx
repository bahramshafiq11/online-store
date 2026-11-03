import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="logo">MyStore</Link>
      <nav>
        <Link to="/cart">
          Cart {itemCount > 0 && <span className="badge">{itemCount}</span>}
        </Link>
        {user ? (
          <>
            <Link to="/my-orders">My Orders</Link>
            <span>Hi, {user.name.split(" ")[0]}</span>
            <button className="link-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}