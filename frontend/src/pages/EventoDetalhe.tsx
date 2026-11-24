import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { criarInscricao, listarMinhasInscricoes } from '../api/inscricoes';
import { useAuth } from '../auth/useAuth';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type { Evento } from '../types/evento';
import type { Inscricao } from '../types/inscricao';
import { formatarDataHora } from '../utils/datas';
import { podeEditarEvento } from '../utils/eventos';

export function EventoDetalhe() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  const [inscrevendo, setInscrevendo] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erroInscricao, setErroInscricao] = useState<string | null>(null);
  const [minhasInscricoes, setMinhasInscricoes] = useState<Inscricao[]>([]);
  const jaInscrito =
    isAuthenticated && evento !== null && minhasInscricoes.some((i) => i.evento.id === evento.id);

  const inscrever = async () => {
    if (!evento) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setInscrevendo(true);
    setErroInscricao(null);
    try {
      const inscricao = await criarInscricao(evento.id);
      setCodigo(inscricao.codigo);
    } catch (err) {
      setErroInscricao(lerErro(err).mensagem ?? 'Não foi possível realizar a inscrição.');
    } finally {
      setInscrevendo(false);
    }
  };

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

  // Se o usuário está logado, busca os ingressos dele para saber se já está inscrito neste evento.
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    listarMinhasInscricoes(controller.signal)
      .then(setMinhasInscricoes)
      .catch(() => {
        // sem a lista, o botão Inscrever-se continua; a API recusa duplicidade com 409
      });
    return () => controller.abort();
  }, [isAuthenticated]);

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Link to="/" className="btn-voltar">
            &larr; Voltar
          </Link>
          {isAuthenticated && evento && podeEditarEvento(user, evento) && !loading && !error && (
            <Link to={`/eventos/${evento.id}/editar`} className="btn btn-outline-secondary btn-sm">
              Editar
            </Link>
          )}
        </div>
        {aviso && (
          <div className="alert alert-warning" role="alert">
            {aviso}
          </div>
        )}
        {loading && <Loading />}
        {error && <ErrorMessage message={error} onRetry={error === 'Evento não encontrado' ? undefined : retry} />}
        {evento && !loading && !error && (
          <div className="card-eventus">
            {evento.imagemUrl && <img className="evento-capa" src={evento.imagemUrl} alt="" />}
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
            {codigo && (
              <div className="alert alert-success mt-3 mb-0" role="status">
                Inscrição realizada! Seu código: <strong className="font-monospace">{codigo}</strong>.{' '}
                <Link to="/meus-ingressos">Ver meus ingressos</Link>
              </div>
            )}
            {erroInscricao && <ErrorMessage message={erroInscricao} />}
            {!codigo && jaInscrito && (
              <Link to="/meus-ingressos" className="btn btn-outline-primary mt-3">
                Ver ingresso
              </Link>
            )}
            {!codigo && !jaInscrito && (
              <button type="button" className="btn btn-primary mt-3" onClick={inscrever} disabled={inscrevendo}>
                {inscrevendo ? 'Inscrevendo...' : 'Inscrever-se'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
