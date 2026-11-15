import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import type { Evento } from '../types/evento';
import { formatarDataHora } from '../utils/datas';
import { EmptyState } from './EmptyState';
import { ErrorMessage } from './ErrorMessage';
import { Loading } from './Loading';

export function ListaEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
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
      .get<Evento[]>('/eventos', { signal: controller.signal })
      .then((response) => setEventos(response.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(lerErro(err).mensagem ?? 'Não foi possível carregar os eventos.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <section className="mt-4">
      <h2 className="h4 mb-3">Eventos</h2>
      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={retry} />}
      {!loading && !error && eventos.length === 0 && <EmptyState message="Nenhum evento disponível" />}
      {!loading && !error && eventos.length > 0 && (
        <div className="row g-4">
          {eventos.map((evento) => (
            <div key={evento.id} className="col-md-6 col-lg-4">
              <div className="card-eventus h-100 d-flex flex-column">
                <h3 className="h5">{evento.titulo}</h3>
                <p className="text-muted mb-1">{formatarDataHora(evento.data)}</p>
                <p className="text-muted">{evento.local}</p>
                <Link className="btn btn-outline-primary mt-auto align-self-start" to={`/eventos/${evento.id}`}>
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
