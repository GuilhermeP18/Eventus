import { useEffect, useState } from 'react';
import axios from 'axios';
import { http } from '../api/http';
import { ListaEventos } from '../components/ListaEventos';
import { IndicadorApi } from '../components/IndicadorApi';

interface ApiStatus {
  status: string;
  message: string;
}

export function Home() {
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
      .get<ApiStatus>('/test', { signal: controller.signal })
      .then(() => undefined)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(axios.isAxiosError(err) ? err.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Eventus</h1>
          <p>Sistema de gestão de eventos.</p>
        </div>
      </section>

      <div className="container py-4">
        {error && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3" role="alert">
            <span>Não foi possível conectar à API</span>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={retry}>
              Tentar novamente
            </button>
          </div>
        )}

        <ListaEventos />

        {!error && (
          <div className="mt-4">
            <IndicadorApi verificando={loading} />
          </div>
        )}
      </div>
    </>
  );
}
