import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderPage from "./pages/OrderPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Logged-in users */}
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/order/:id" element={<RequireAuth><OrderPage /></RequireAuth>} />
          <Route path="/my-orders" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />

          {/* Admins */}
          <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProductsPage /></RequireAdmin>} />
          <Route path="/admin/products/new" element={<RequireAdmin><ProductFormPage /></RequireAdmin>} />
          <Route path="/admin/products/:id/edit" element={<RequireAdmin><ProductFormPage /></RequireAdmin>} />
          <Route path="/admin/orders" element={<RequireAdmin><AdminOrdersPage /></RequireAdmin>} />

          <Route path="*" element={<p className="status">Page not found</p>} />
        </Routes>
      </main>
    </>
  );
}