import { useRef, useState, type FormEvent } from 'react';
import { buscarInscricoes, registrarEntrada } from '../api/portaria';
import { lerErro } from '../api/erros';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LinhaPortaria } from '../components/LinhaPortaria';
import { Loading } from '../components/Loading';
import type { InscricaoPortaria } from '../types/portaria';

export function Portaria() {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<InscricaoPortaria[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [registrandoId, setRegistrandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const busca = useRef<AbortController | null>(null);

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    const termo = q.trim();
    busca.current?.abort();
    setAviso(null);
    setErroBusca(null);
    if (!termo) {
      setResultados(null);
      setBuscando(false);
      setErroBusca('Informe o código, o nome ou o CPF para buscar.');
      return;
    }
    const controller = new AbortController();
    busca.current = controller;
    setBuscando(true);
    try {
      const lista = await buscarInscricoes(termo, controller.signal);
      if (controller.signal.aborted) return;
      setResultados(lista);
    } catch (err) {
      if (controller.signal.aborted) return;
      setResultados(null);
      setErroBusca(lerErro(err).mensagem ?? 'Não foi possível realizar a busca.');
    } finally {
      if (!controller.signal.aborted) setBuscando(false);
    }
  };

  const atualizarLinha = (atualizada: InscricaoPortaria) =>
    setResultados((lista) => lista?.map((i) => (i.id === atualizada.id ? atualizada : i)) ?? null);

  const registrar = async (id: number) => {
    setRegistrandoId(id);
    setAviso(null);
    try {
      const atualizada = await registrarEntrada(id);
      atualizarLinha(atualizada);
      setAviso({ tipo: 'success', texto: `Entrada de ${atualizada.nome} registrada.` });
    } catch (err) {
      const { status, mensagem } = lerErro(err);
      if (status === 409) {
        // já tinha check-in: a linha passa a mostrar Presente
        setResultados((lista) => lista?.map((i) => (i.id === id ? { ...i, presente: true } : i)) ?? null);
      }
      setAviso({ tipo: 'danger', texto: mensagem ?? 'Não foi possível registrar a entrada.' });
    } finally {
      setRegistrandoId(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="h3 page-title">Portaria</h1>
        <p className="text-muted mb-0">Busque o participante pelo código do ingresso, nome ou CPF.</p>
      </div>

      <form className="input-group mb-3" onSubmit={buscar} role="search">
        <input
          type="search"
          className="form-control"
          placeholder="Código, nome ou CPF"
          aria-label="Buscar inscrição"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {aviso && (
        <div className={`alert alert-${aviso.tipo}`} role={aviso.tipo === 'danger' ? 'alert' : 'status'}>
          {aviso.texto}
        </div>
      )}
      {buscando && <Loading />}
      {erroBusca && <ErrorMessage message={erroBusca} />}
      {!buscando && !erroBusca && resultados?.length === 0 && (
        <EmptyState message="Nenhuma inscrição encontrada para essa busca." />
      )}
      {!buscando && !erroBusca && resultados && resultados.length > 0 && (
        <div className="card-eventus p-0 table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Código</th>
                <th>Evento</th>
                <th>Data</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {resultados.map((i) => (
                <LinhaPortaria
                  key={i.id}
                  inscricao={i}
                  registrando={registrandoId === i.id}
                  ocupado={registrandoId !== null}
                  onRegistrar={registrar}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
