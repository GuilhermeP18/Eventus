import { useEffect, useState } from 'react';
import axios from 'axios';
import { http } from '../api/http';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';

interface ApiStatus {
  status: string;
  message: string;
}

export function Home() {
  const [data, setData] = useState<ApiStatus | null>(null);
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
      .then((response) => setData(response.data))
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
      <h1 className="h3">Eventus</h1>
      <p className="text-muted">Sistema de gestão de eventos.</p>

      {loading && <Loading />}
      {error && <ErrorMessage message={`Não foi possível conectar à API: ${error}`} onRetry={retry} />}
      {data && !loading && !error && (
        <div className="alert alert-success" role="alert">
          <span className="badge bg-success me-2">{data.status}</span>
          {data.message}
        </div>
      )}
    </>
  );
}
