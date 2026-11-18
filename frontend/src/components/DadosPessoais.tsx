import { useEffect, useState, type FormEvent } from 'react';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { useAuth } from '../auth/useAuth';
import type { Perfil } from '../types/usuario';
import { hojeISO } from '../utils/datas';
import { Campo } from './Campo';
import { ErrorMessage } from './ErrorMessage';
import { Loading } from './Loading';

function doPerfil(p: Perfil) {
  return {
    nome: p.nome,
    telefone: p.telefone ?? '',
    dataNascimento: p.dataNascimento,
    cep: p.endereco.cep,
    rua: p.endereco.rua,
    numero: p.endereco.numero,
    complemento: p.endereco.complemento ?? '',
    bairro: p.endereco.bairro,
    cidade: p.endereco.cidade,
    uf: p.endereco.uf,
  };
}

type Form = ReturnType<typeof doPerfil>;

function validar(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome';
  if (f.telefone && !/^\d{10,11}$/.test(f.telefone.replace(/\D/g, ''))) e.telefone = 'Telefone deve ter 10 ou 11 dígitos';
  if (!f.dataNascimento) e.dataNascimento = 'Informe a data de nascimento';
  else if (f.dataNascimento > hojeISO(18)) e.dataNascimento = 'É necessário ter pelo menos 18 anos';
  if (f.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP deve ter 8 dígitos';
  if (!f.rua.trim()) e.rua = 'Informe a rua';
  if (!f.numero.trim()) e.numero = 'Informe o número';
  if (!f.bairro.trim()) e.bairro = 'Informe o bairro';
  if (!f.cidade.trim()) e.cidade = 'Informe a cidade';
  if (!/^[A-Za-z]{2}$/.test(f.uf)) e.uf = 'UF deve ter 2 letras';
  return e;
}

/** Busca o perfil em GET /auth/me e mostra o formulário de edição. */
export function DadosPessoais() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
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
      .get<Perfil>('/auth/me', { signal: controller.signal })
      .then((response) => setPerfil(response.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(lerErro(err).mensagem ?? 'Não foi possível carregar seus dados.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="card-eventus">
      <h2 className="h5">Dados pessoais</h2>
      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={retry} />}
      {perfil && !loading && !error && <FormularioDados perfil={perfil} />}
    </div>
  );
}

function FormularioDados({ perfil }: { perfil: Perfil }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState<Form>(doPerfil(perfil));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const campo = (name: keyof Form, label: string, extra: { type?: string; autoComplete?: string; maxLength?: number } = {}) => (
    <Campo
      label={label}
      name={name}
      value={form[name]}
      onChange={(e) => {
        setSalvo(false);
        setForm({ ...form, [name]: name === 'uf' ? e.target.value.toUpperCase() : e.target.value });
      }}
      erro={erros[name]}
      {...extra}
    />
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const novos = validar(form);
    setErros(novos);
    setErroApi(null);
    setSalvo(false);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      const { data } = await http.put<Perfil>('/auth/me', {
        nome: form.nome.trim(),
        telefone: form.telefone.replace(/\D/g, '') || null,
        dataNascimento: form.dataNascimento,
        endereco: {
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento.trim() || null,
          bairro: form.bairro,
          cidade: form.cidade,
          uf: form.uf,
        },
      });
      updateUser(data); // a Navbar passa a mostrar o nome novo
      setForm(doPerfil(data));
      setSalvo(true);
    } catch (err) {
      const { status, mensagem, campos } = lerErro(err);
      if (status === 400 && Object.keys(campos).length > 0) {
        // a API nomeia os campos do endereço como "endereco.cep"; aqui o campo se chama "cep"
        const doServidor: Record<string, string> = {};
        for (const [chave, texto] of Object.entries(campos)) {
          doServidor[chave.replace('endereco.', '')] = texto;
        }
        setErros(doServidor);
      } else if (status === 400) {
        setErroApi(mensagem ?? 'Dados inválidos');
      } else {
        setErroApi('Não foi possível salvar seus dados. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {erroApi && <ErrorMessage message={erroApi} />}
      {salvo && (
        <div className="alert alert-success" role="status">
          Dados salvos com sucesso.
        </div>
      )}

      <div className="row">
        <div className="col-md-6">{campo('nome', 'Nome', { autoComplete: 'name' })}</div>
        <div className="col-md-6">
          <Campo label="E-mail" name="email" value={perfil.email} readOnly dica="Não é possível alterar aqui" />
        </div>
        <div className="col-md-6">
          <Campo label="CPF" name="cpf" value={perfil.cpf} readOnly dica="Não é possível alterar aqui" />
        </div>
        <div className="col-md-3">{campo('telefone', 'Telefone', { type: 'tel', autoComplete: 'tel', maxLength: 15 })}</div>
        <div className="col-md-3">{campo('dataNascimento', 'Data de nascimento', { type: 'date' })}</div>
      </div>

      <h3 className="h6 mt-2">Endereço</h3>
      <div className="row">
        <div className="col-md-3">{campo('cep', 'CEP', { maxLength: 9 })}</div>
        <div className="col-md-6">{campo('rua', 'Rua')}</div>
        <div className="col-md-3">{campo('numero', 'Número')}</div>
        <div className="col-md-4">{campo('complemento', 'Complemento', { maxLength: 100 })}</div>
        <div className="col-md-3">{campo('bairro', 'Bairro')}</div>
        <div className="col-md-3">{campo('cidade', 'Cidade')}</div>
        <div className="col-md-2">{campo('uf', 'UF', { maxLength: 2 })}</div>
      </div>

      <div className="d-flex justify-content-end mt-2">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
