import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { lerErro } from '../api/erros';
import { TIPOS_IMAGEM, validarImagem } from '../api/imagem';
import type { Evento, EventoRequest } from '../types/evento';
import { Campo } from './Campo';
import { ErrorMessage } from './ErrorMessage';
import { IconeClipe } from './IconeClipe';

const vazio = {
  titulo: '',
  descricao: '',
  data: '',
  local: '',
  capacidade: '',
  inscricaoInicio: '',
  inscricaoFim: '',
};

type Form = typeof vazio;

/** A API devolve "2026-12-01T08:00:00"; o input datetime-local quer "2026-12-01T08:00". */
function paraInput(iso: string) {
  return iso.slice(0, 16);
}

function doEvento(e: Evento): Form {
  return {
    titulo: e.titulo,
    descricao: e.descricao ?? '',
    data: paraInput(e.data),
    local: e.local,
    capacidade: String(e.capacidade),
    inscricaoInicio: paraInput(e.inscricaoInicio),
    inscricaoFim: paraInput(e.inscricaoFim),
  };
}

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

interface FormularioEventoProps {
  /** Evento a editar; sem ele o formulário começa vazio. */
  evento?: Evento;
  textoBotao: string;
  textoEnviando: string;
  /** Para onde o botão Cancelar leva (só aparece se informado). */
  cancelarPara?: string;
  /** Salva os dados e a imagem escolhida. Se lançar erro, o formulário mostra a mensagem da API. */
  onSalvar: (dados: EventoRequest, imagem: File | null) => Promise<void>;
}

export function FormularioEvento({ evento, textoBotao, textoEnviando, cancelarPara, onSalvar }: FormularioEventoProps) {
  const [form, setForm] = useState<Form>(evento ? doEvento(evento) : vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroImagem, setErroImagem] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

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

  const escolherArquivo = (e: ChangeEvent<HTMLInputElement>) => {
    const escolhido = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!escolhido) return;
    const erro = validarImagem(escolhido);
    setErroImagem(erro);
    setArquivo(erro ? null : escolhido);
  };

  const removerArquivo = () => {
    setArquivo(null);
    setErroImagem(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const novos = validar(form);
    setErros(novos);
    setErroApi(null);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      await onSalvar(
        {
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          data: form.data,
          local: form.local.trim(),
          capacidade: Number(form.capacidade),
          inscricaoInicio: form.inscricaoInicio,
          inscricaoFim: form.inscricaoFim,
        },
        arquivo,
      );
    } catch (err) {
      const { status, mensagem, campos } = lerErro(err);
      if (status === 400 && Object.keys(campos).length > 0) {
        setErros(campos);
      } else if (status === 400) {
        setErroApi(mensagem ?? 'Dados inválidos');
      } else if (status === 404) {
        setErroApi(mensagem ?? 'Evento não encontrado');
      } else {
        setErroApi('Não foi possível salvar o evento. Tente novamente.');
      }
      setEnviando(false);
    }
  };

  return (
    <>
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

        <div className="mb-3">
          <input
            ref={inputArquivo}
            type="file"
            className="d-none"
            accept={TIPOS_IMAGEM.join(',')}
            onChange={escolherArquivo}
          />
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
              onClick={() => inputArquivo.current?.click()}
            >
              <IconeClipe />
              Indexar imagem
            </button>
            {arquivo && (
              <>
                <span className="text-muted small">{arquivo.name}</span>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={removerArquivo}>
                  Remover
                </button>
              </>
            )}
          </div>
          {erroImagem && <div className="text-danger small mt-1">{erroImagem}</div>}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          {cancelarPara && (
            <Link to={cancelarPara} className="btn btn-outline-secondary">
              Cancelar
            </Link>
          )}
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? textoEnviando : textoBotao}
          </button>
        </div>
      </form>
    </>
  );
}
