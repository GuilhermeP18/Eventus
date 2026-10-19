import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ApiStatus {
  status: string;
  message: string;
}

interface ApiError {
  status: number | null;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL;

function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    return { status: err.response?.status ?? null, message: err.message };
  }
  return { status: null, message: err instanceof Error ? err.message : 'Erro desconhecido' };
}

function App() {
  const [apiData, setApiData] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchStatus = useCallback((signal: AbortSignal) => {
    axios
      .get<ApiStatus>(`${API_URL}/test`, { signal })
      .then((response) => setApiData(response.data))
      .catch((err: unknown) => {
        if (!signal.aborted) setError(toApiError(err));
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
  }, []);

  const refresh = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    fetchStatus(controller.signal);
  };

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    fetchStatus(controller.signal);
    return () => controller.abort();
  }, [fetchStatus]);

  return (
    <div className="container py-5 text-center">
      <h1 className="fw-bold text-primary display-4 mb-3">Eventus</h1>
      <p className="lead text-muted mb-5">Sistema de Gestão de Eventos</p>

      <div className="card shadow-sm mx-auto status-card">
        <div className="card-body p-4">
          <h5 className="card-title mb-3 fw-bold">Status da Integração</h5>
          {loading ? (
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-0" role="alert">
              Não foi possível conectar à API Spring Boot.
              <div className="small mt-2">
                {error.status !== null && `HTTP ${error.status} - `}
                {error.message}
              </div>
            </div>
          ) : (
            <div className="alert alert-success mb-0" role="alert">
              <span className="badge bg-success me-2">{apiData?.status}</span>
              {apiData?.message}
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary mt-4 px-4 py-2 fw-semibold"
        onClick={refresh}
        disabled={loading}
      >
        Atualizar Status
      </button>
    </div>
  );
}

export default App;
