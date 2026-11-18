import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lerErro } from '../api/erros';
import { http } from '../api/http';
import { enviarImagem, mensagemErroImagem } from '../api/imagem';
import { ErrorMessage } from '../components/ErrorMessage';
import { FormularioEvento } from '../components/FormularioEvento';
import { Loading } from '../components/Loading';
import type { Evento, EventoRequest } from '../types/evento';

export function EventoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const salvar = async (dados: EventoRequest, imagem: File | null) => {
    await http.put(`/eventos/${id}`, dados);
    if (imagem) {
      try {
        await enviarImagem(Number(id), imagem);
      } catch (err) {
        // os dados já foram salvos: volta ao detalhe com um aviso
        navigate(`/eventos/${id}`, {
          state: { aviso: `Evento atualizado, mas a imagem não foi enviada: ${mensagemErroImagem(err)}` },
        });
        return;
      }
    }
    navigate(`/eventos/${id}`);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {loading && <Loading />}
        {error && <ErrorMessage message={error} onRetry={error === 'Evento não encontrado' ? undefined : retry} />}
        {evento && !loading && !error && (
          <div className="card-eventus">
            <h1 className="h3">Editar evento</h1>
            <p className="text-muted">Altere os dados do evento. A imagem só muda se você escolher outra.</p>
            <FormularioEvento
              evento={evento}
              textoBotao="Salvar"
              textoEnviando="Salvando..."
              cancelarPara={`/eventos/${id}`}
              onSalvar={salvar}
            />
          </div>
        )}
      </div>
    </div>
  );
}
