import { NavLink } from "react-router-dom";

export default function AdminNav() {
  return (
    <div className="admin-nav">
      <NavLink to="/admin/products">Products</NavLink>
      <NavLink to="/admin/orders">Orders</NavLink>
    </div>
  );
}