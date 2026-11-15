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
    <nav className="navbar eventus-navbar">
      <div className="container h-100">
        <Link className="navbar-brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2M13 17v2M13 11v2" />
            </svg>
          </span>
          Eventus
        </Link>
        <div className="d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link className="btn btn-primary" to="/eventos/novo">
                Criar evento
              </Link>
              {user?.nome &&<span className="text-muted">{user.nome}</span>}
              <button type="button" className="btn btn-outline-secondary" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary" to="/login">
                Entrar
              </Link>
              <Link className="btn btn-primary" to="/cadastro">
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
