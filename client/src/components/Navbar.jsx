import { Link, NavLink, useNavigate } from "react-router-dom";
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
      <div className="nav-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">M</span>
          MyStore
        </Link>

        <nav>
          {user?.isAdmin && <NavLink to="/admin/products">Admin</NavLink>}
          {user && <NavLink to="/my-orders">My Orders</NavLink>}

          {user ? (
            <>
              <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
              <button className="link-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}

          <Link to="/cart" className="nav-cart">
            Cart
            {itemCount > 0 && <span className="badge">{itemCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}