import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type { Evento } from '../types/evento';
import { formatarDataHora } from '../utils/datas';

export function EventoDetalhe() {
  const { id } = useParams();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    http
      .get<Evento>(`/eventos/${id}`, { signal: controller.signal })
      .then((response) => setEvento(response.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const { status } = lerErro(err);
        setError(status === 404 ? 'Evento não encontrado' : 'Não foi possível carregar o evento.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, attempt]);

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <p>
          <Link to="/">&larr; Voltar</Link>
        </p>
        {loading && <Loading />}
        {error && <ErrorMessage message={error} onRetry={error === 'Evento não encontrado' ? undefined : retry} />}
        {evento && !loading && !error && (
          <div className="card-eventus">
            <h1 className="h3">{evento.titulo}</h1>
            {evento.descricao && <p className="text-muted">{evento.descricao}</p>}
            <dl className="row mb-0">
              <dt className="col-sm-4">Data</dt>
              <dd className="col-sm-8">{formatarDataHora(evento.data)}</dd>
              <dt className="col-sm-4">Local</dt>
              <dd className="col-sm-8">{evento.local}</dd>
              <dt className="col-sm-4">Capacidade</dt>
              <dd className="col-sm-8">{evento.capacidade}</dd>
              <dt className="col-sm-4">Inscrições</dt>
              <dd className="col-sm-8 mb-0">
                {formatarDataHora(evento.inscricaoInicio)} até {formatarDataHora(evento.inscricaoFim)}
              </dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
