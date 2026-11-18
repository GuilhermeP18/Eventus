import { Link } from 'react-router-dom';
import type { Inscricao } from '../types/inscricao';
import { formatarDataHora } from '../utils/datas';

interface CardIngressoProps {
  inscricao: Inscricao;
}

export function CardIngresso({ inscricao }: CardIngressoProps) {
  const { evento, codigo, presente } = inscricao;
  return (
    <div className="card-eventus h-100">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <h2 className="h5 mb-1">
          <Link to={`/eventos/${evento.id}`} className="text-decoration-none">
            {evento.titulo}
          </Link>
        </h2>
        {presente && <span className="badge text-bg-success">Presença confirmada</span>}
      </div>
      <p className="text-muted mb-3">
        {formatarDataHora(evento.data)} &middot; {evento.local}
      </p>
      <div className="small text-muted">Código do ingresso</div>
      <div className="fs-4 fw-bold font-monospace">{codigo}</div>
    </div>
  );
}
