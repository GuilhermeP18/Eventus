import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/** Primeira letra do primeiro nome + primeira letra do último nome, em maiúsculas. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Botão circular com as iniciais do usuário e o menu suspenso (sem Bootstrap JS). */
export function MenuUsuario() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  // fecha ao clicar fora e ao apertar Escape (só enquanto o menu está aberto)
  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  const sair = () => {
    setAberto(false);
    logout();
    navigate('/');
  };

  const nome = user?.nome?.trim();

  return (
    <div className="menu-usuario-wrapper" ref={raiz}>
      <button
        ref={botao}
        type="button"
        className="avatar-usuario"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Menu do usuário"
        aria-busy={!nome}
        onClick={() => setAberto(!aberto)}
      >
        {nome ? (
          iniciais(nome)
        ) : (
          // nome ainda não chegou de /auth/me: ícone neutro
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>

      {aberto && (
        <div className="dropdown-menu show menu-usuario">
          {(nome || user?.email) && (
            <>
              <div className="px-3 py-2">
                {nome && <div className="small text-muted menu-usuario-nome">{nome}</div>}
                {user?.email && (
                  <div className="menu-usuario-email text-muted text-truncate" title={user.email}>
                    {user.email}
                  </div>
                )}
              </div>
              <hr className="dropdown-divider" />
            </>
          )}
          <Link className="dropdown-item" to="/painel" onClick={() => setAberto(false)}>
            Painel
          </Link>
          <Link className="dropdown-item" to="/meus-ingressos" onClick={() => setAberto(false)}>
            Meus ingressos
          </Link>
          <hr className="dropdown-divider" />
          <button type="button" className="dropdown-item" onClick={sair}>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
