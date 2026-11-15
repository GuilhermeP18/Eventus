import { useEffect, useState, type FormEvent } from 'react';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { Campo } from '../components/Campo';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { hojeISO } from '../utils/datas';

interface Dependente {
  id: number;
  nome: string;
  dataNascimento: string;
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function Painel() {
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const retry = () => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    http
      .get<Dependente[]>('/dependentes', { signal: controller.signal })
      .then((response) => setDependentes(response.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(lerErro(err).mensagem ?? 'Não foi possível carregar os dependentes.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!nome.trim()) novos.nome = 'Informe o nome';
    if (!dataNascimento) novos.dataNascimento = 'Informe a data de nascimento';
    else if (dataNascimento >= hojeISO()) novos.dataNascimento = 'A data deve ser no passado';
    setErros(novos);
    setErroForm(null);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      const { data } = await http.post<Dependente>('/dependentes', { nome: nome.trim(), dataNascimento });
      setDependentes((lista) => [...lista, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNome('');
      setDataNascimento('');
    } catch (err) {
      const { status, campos, mensagem } = lerErro(err);
      if (status === 400 && Object.keys(campos).length > 0) setErros(campos);
      else setErroForm(mensagem ?? 'Não foi possível adicionar o dependente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="h3 page-title">Dependentes</h1>
        <p className="text-muted mb-0">Cadastre quem vai com você aos eventos.</p>
      </div>

      <div className="row g-4">
        <div className="col-md-7">
          <div className="card-eventus">
          <h2 className="h5">Seus dependentes</h2>
          {loading && <Loading />}
          {error && <ErrorMessage message={error} onRetry={retry} />}
          {!loading && !error && dependentes.length === 0 && (
            <p className="text-muted">Você ainda não cadastrou dependentes.</p>
          )}
          {!loading && !error && dependentes.length > 0 && (
            <ul className="list-group">
              {dependentes.map((d) => (
                <li key={d.id} className="list-group-item d-flex justify-content-between">
                  <span>{d.nome}</span>
                  <span className="text-muted">{formatarData(d.dataNascimento)}</span>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>

        <div className="col-md-5">
          <div className="card-eventus">
          <h2 className="h5">Adicionar dependente</h2>
          {erroForm && <ErrorMessage message={erroForm} />}
          <form onSubmit={handleSubmit} noValidate>
            <Campo
              label="Nome"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              erro={erros.nome}
            />
            <Campo
              label="Data de nascimento"
              name="dataNascimento"
              type="date"
              max={hojeISO()}
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              erro={erros.dataNascimento}
            />
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
          </div>
        </div>
      </div>
    </>
  );
}
