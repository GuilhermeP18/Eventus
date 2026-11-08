import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar bg-white border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/">
          Eventus
        </Link>
        <div className="d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="text-muted">{user?.nome}</span>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary btn-sm" to="/login">
                Entrar
              </Link>
              <Link className="btn btn-primary btn-sm" to="/cadastro">
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
