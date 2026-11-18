import { useEffect, useState } from 'react';
import { listarMinhasInscricoes } from '../api/inscricoes';
import { lerErro } from '../api/erros';
import { CardIngresso } from '../components/CardIngresso';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type { Inscricao } from '../types/inscricao';

export function MeusIngressos() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
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
    listarMinhasInscricoes(controller.signal)
      .then(setInscricoes)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(lerErro(err).mensagem ?? 'Não foi possível carregar seus ingressos.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <>
      <div className="page-header">
        <h1 className="h3 page-title">Meus ingressos</h1>
      </div>
      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={retry} />}
      {!loading && !error && inscricoes.length === 0 && (
        <EmptyState message="Você ainda não se inscreveu em nenhum evento." />
      )}
      {!loading && !error && inscricoes.length > 0 && (
        <div className="row g-3">
          {inscricoes.map((i) => (
            <div key={i.id} className="col-md-6">
              <CardIngresso inscricao={i} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
