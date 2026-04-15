import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './controllers/AuthController';
import LoginPage from './views/pages/LoginPage';
import RegisterPage from './views/pages/RegisterPage';
import ProductsPage from './views/pages/ProductsPage';
import CartPage from './views/pages/CartPage';
import CheckoutPage from './views/pages/CheckoutPage';
import OrdersPage from './views/pages/OrdersPage';
import AdminUsersPage from './views/pages/AdminUsersPage';
import AdminStatsPage from './views/pages/AdminStatsPage';
import AdminProductsPage from './views/pages/AdminProductsPage';
import AdminOrdersPage from './views/pages/AdminOrdersPage';
import ProtectedRoute from './views/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute adminOnly><AdminStatsPage /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProductsPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrdersPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
