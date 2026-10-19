import { useState, useEffect } from 'react';
import axios from 'axios';

interface ApiStatus {
  status: string;
  message: string;
}

export function App() {
  const [apiData, setApiData] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const checkApiStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get<ApiStatus>('http://localhost:8080/api/v1/test');
      setApiData(response.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  return (
    <div className="container py-5 text-center">
      <h1 className="fw-bold text-primary display-4 mb-3">Eventus</h1>
      <p className="lead text-muted mb-5">Sistema de Gestão de Eventos</p>

      <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <div className="card-body p-4">
          <h5 className="card-title mb-3 fw-bold">Status da Integração</h5>
          {loading ? (
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">A carregar...</span>
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-0" role="alert">
              Não foi possível conectar à API Spring Boot.
            </div>
          ) : (
            <div className="alert alert-success mb-0" role="alert">
              <span className="badge bg-success me-2">{apiData?.status}</span>
              {apiData?.message}
            </div>
          )}
        </div>
      </div>

      <button className="btn btn-primary mt-4 px-4 py-2 fw-semibold" onClick={checkApiStatus}>
        Atualizar Status
      </button>
    </div>
  );
}

export default App;