import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login?redirect=/admin/products" replace />;
  if (!user.isAdmin) return <p className="status error">Admins only.</p>;

  return children;
}