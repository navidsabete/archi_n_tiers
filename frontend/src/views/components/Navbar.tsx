/**
 * Navbar Component
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthController';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <button className="navbar-brand" onClick={() => navigate('/products')}>
        🏅 Ligue Sportive
      </button>

      <div className="navbar-nav">
        <button
          className={`navbar-link${isActive('/products') ? ' active' : ''}`}
          onClick={() => navigate('/products')}
        >
          Catalogue
        </button>
        <button
          className={`navbar-link${isActive('/cart') || isActive('/checkout') ? ' active' : ''}`}
          onClick={() => navigate('/cart')}
        >
          🛒 Panier
        </button>
        <button
          className={`navbar-link${isActive('/orders') ? ' active' : ''}`}
          onClick={() => navigate('/orders')}
        >
          📦 Commandes
        </button>
        {isAdmin() && (
          <>
            <button
              className={`navbar-link${isActive('/admin/orders') ? ' active' : ''}`}
              onClick={() => navigate('/admin/orders')}
            >
              📋 Commandes
            </button>
            <button
              className={`navbar-link${isActive('/admin/products') ? ' active' : ''}`}
              onClick={() => navigate('/admin/products')}
            >
              ⚙️ Produits
            </button>
            <button
              className={`navbar-link${isActive('/admin/users') ? ' active' : ''}`}
              onClick={() => navigate('/admin/users')}
            >
              👥 Utilisateurs
            </button>
          </>
        )}
      </div>

      <div className="navbar-user">
        {user && (
          <span className="navbar-username">
            {user.firstName} {user.lastName}
          </span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
