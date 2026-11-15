import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { Campo } from '../components/Campo';
import { ErrorMessage } from '../components/ErrorMessage';
import type { Evento } from '../types/evento';

const inicial = {
  titulo: '',
  descricao: '',
  data: '',
  local: '',
  capacidade: '',
  inscricaoInicio: '',
  inscricaoFim: '',
};

type Form = typeof inicial;

function validar(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.titulo.trim()) e.titulo = 'Informe o título';
  if (!f.data) e.data = 'Informe a data do evento';
  if (!f.local.trim()) e.local = 'Informe o local';
  if (!f.capacidade || Number(f.capacidade) < 1) e.capacidade = 'A capacidade deve ser de pelo menos 1';
  if (!f.inscricaoInicio) e.inscricaoInicio = 'Informe o início da inscrição';
  if (!f.inscricaoFim) e.inscricaoFim = 'Informe o fim da inscrição';
  else if (f.inscricaoInicio && f.inscricaoFim <= f.inscricaoInicio) {
    e.inscricaoFim = 'O fim da inscrição deve ser depois do início da inscrição';
  }
  return e;
}

export function NovoEvento() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const campo = (name: keyof Form, label: string, type = 'text') => (
    <Campo
      label={label}
      name={name}
      type={type}
      value={form[name]}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      erro={erros[name]}
    />
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const novos = validar(form);
    setErros(novos);
    setErroApi(null);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      const { data } = await http.post<Evento>('/eventos', {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        data: form.data,
        local: form.local.trim(),
        capacidade: Number(form.capacidade),
        inscricaoInicio: form.inscricaoInicio,
        inscricaoFim: form.inscricaoFim,
      });
      navigate(`/eventos/${data.id}`);
    } catch (err) {
      const { status, mensagem, campos } = lerErro(err);
      if (status === 400 && Object.keys(campos).length > 0) {
        setErros(campos);
      } else if (status === 400) {
        setErroApi(mensagem ?? 'Dados inválidos');
      } else {
        setErroApi('Não foi possível criar o evento. Tente novamente.');
      }
      setEnviando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card-eventus">
          <h1 className="h3">Criar evento</h1>
          <p className="text-muted">Preencha os dados para publicar um novo evento.</p>

          {erroApi && <ErrorMessage message={erroApi} />}

          <form onSubmit={handleSubmit} noValidate>
            {campo('titulo', 'Título')}

            <div className="mb-3">
              <label htmlFor="descricao" className="form-label">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                rows={3}
                className={`form-control${erros.descricao ? ' is-invalid' : ''}`}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
              <div className="invalid-feedback">{erros.descricao}</div>
            </div>

            <div className="row">
              <div className="col-md-6">{campo('data', 'Data do evento', 'datetime-local')}</div>
              <div className="col-md-6">{campo('local', 'Local')}</div>
              <div className="col-md-4">{campo('capacidade', 'Capacidade', 'number')}</div>
              <div className="col-md-4">{campo('inscricaoInicio', 'Início da inscrição', 'datetime-local')}</div>
              <div className="col-md-4">{campo('inscricaoFim', 'Fim da inscrição', 'datetime-local')}</div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Criando evento...' : 'Criar evento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
