import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { Campo } from '../components/Campo';
import { CampoSelect } from '../components/CampoSelect';
import { ErrorMessage } from '../components/ErrorMessage';
import { useErrosVisiveis } from '../hooks/useErrosVisiveis';
import { hojeISO } from '../utils/datas';
import { ESTADOS } from '../utils/estados';
import {
  mascararCep,
  mascararCpf,
  mascararTelefone,
  somenteDigitos,
  validarCep,
  validarCpf,
  validarTelefone,
} from '../utils/mascaras';

const inicial = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  dataNascimento: '',
  senha: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

type Form = typeof inicial;
type NomeCampo = keyof Form;
type Erros = Partial<Record<NomeCampo, string>>;

interface OpcoesCampo {
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: 'numeric' | 'tel' | 'text';
  placeholder?: string;
}

/** Campos com máscara: o valor digitado passa pela formatação antes de ir para o estado. */
const MASCARAS: Partial<Record<NomeCampo, (valor: string) => string>> = {
  cpf: mascararCpf,
  telefone: mascararTelefone,
  cep: mascararCep,
};

const OPCOES_UF = ESTADOS.map((e) => ({ valor: e.sigla, rotulo: e.sigla }));

function validar(f: Form): Erros {
  const e: Erros = {
    // telefone é opcional: vazio não gera erro, só o tamanho incompleto
    telefone: validarTelefone(f.telefone),
    cpf: f.cpf ? validarCpf(f.cpf) : 'CPF é obrigatório',
    cep: f.cep ? validarCep(f.cep) : 'CEP é obrigatório',
  };
  if (!f.nome.trim()) e.nome = 'Informe o nome';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Informe um e-mail válido';
  if (!f.dataNascimento) e.dataNascimento = 'Informe a data de nascimento';
  else if (f.dataNascimento > hojeISO(18)) e.dataNascimento = 'É necessário ter pelo menos 18 anos';
  if (f.senha.length < 8) e.senha = 'A senha deve ter no mínimo 8 caracteres';
  if (!f.rua.trim()) e.rua = 'Informe a rua';
  // O back-end aceita texto no número (@NotBlank, até 20 caracteres), por isso "S/N" ou "12A"
  // continuam válidos aqui. Não há máscara de dígitos para não criar uma regra que a API não tem.
  if (!f.numero.trim()) e.numero = 'Informe o número';
  if (!f.bairro.trim()) e.bairro = 'Informe o bairro';
  if (!f.cidade.trim()) e.cidade = 'Informe a cidade';
  if (!ESTADOS.some((estado) => estado.sigla === f.uf)) e.uf = 'Selecione o estado';
  return e;
}

export function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(inicial);
  const [errosServidor, setErrosServidor] = useState<Erros>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const errosLocais = validar(form);
  const { erroDe, aoEditar, aoSair, marcarEnvio } = useErrosVisiveis<NomeCampo>({
    ...errosServidor,
    ...Object.fromEntries(Object.entries(errosLocais).filter(([, texto]) => texto)),
  });

  const alterar = (name: NomeCampo, valor: string) => {
    const mascara = MASCARAS[name];
    setForm({ ...form, [name]: mascara ? mascara(valor) : valor });
    aoEditar(name);
    if (errosServidor[name]) {
      setErrosServidor((atual) => {
        const resto = { ...atual };
        delete resto[name];
        return resto;
      });
    }
  };

  const campo = (name: NomeCampo, label: string, extra: OpcoesCampo = {}) => (
    <Campo
      label={label}
      name={name}
      value={form[name]}
      onChange={(e) => alterar(name, e.target.value)}
      onBlur={() => aoSair(name)}
      erro={erroDe(name)}
      {...extra}
    />
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    marcarEnvio();
    setErroApi(null);
    if (Object.values(errosLocais).some(Boolean)) return;

    setEnviando(true);
    try {
      await http.post('/auth/cadastro', {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: somenteDigitos(form.telefone) || null,
        cpf: somenteDigitos(form.cpf),
        dataNascimento: form.dataNascimento,
        senha: form.senha,
        endereco: {
          cep: somenteDigitos(form.cep),
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento.trim() || null,
          bairro: form.bairro,
          cidade: form.cidade,
          uf: form.uf,
        },
      });
      navigate('/login', { state: { mensagem: 'Conta criada com sucesso! Entre com seu e-mail e senha.' } });
    } catch (err) {
      const { status, mensagem, campos } = lerErro(err);
      if (status === 400 && Object.keys(campos).length > 0) {
        // a API nomeia os campos do endereço como "endereco.cep"; aqui o campo se chama "cep"
        const doServidor: Erros = {};
        for (const [chave, texto] of Object.entries(campos)) {
          doServidor[chave.replace('endereco.', '') as NomeCampo] = texto;
        }
        setErrosServidor(doServidor);
      } else if (status === 400 || status === 409) {
        setErroApi(mensagem ?? 'Dados inválidos');
      } else {
        setErroApi('Não foi possível criar a conta. Tente novamente.');
      }
      setEnviando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card-eventus">
        <h1 className="h3">Cadastro</h1>
        <p className="text-muted">Crie sua conta para participar dos eventos.</p>

        {erroApi && <ErrorMessage message={erroApi} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-md-6">{campo('nome', 'Nome', { autoComplete: 'name' })}</div>
            <div className="col-md-6">{campo('email', 'E-mail', { type: 'email', autoComplete: 'email' })}</div>
            <div className="col-md-4">
              {campo('telefone', 'Telefone', {
                type: 'tel',
                autoComplete: 'tel',
                inputMode: 'tel',
                maxLength: 15,
                placeholder: '(00) 00000-0000',
              })}
            </div>
            <div className="col-md-4">
              {campo('cpf', 'CPF', { inputMode: 'numeric', maxLength: 14, placeholder: '000.000.000-00' })}
            </div>
            <div className="col-md-4">{campo('dataNascimento', 'Data de nascimento', { type: 'date' })}</div>
            <div className="col-md-6">
              {campo('senha', 'Senha', { type: 'password', autoComplete: 'new-password' })}
            </div>
          </div>

          <h2 className="h5 mt-2">Endereço</h2>
          <div className="row">
            <div className="col-md-3">
              {campo('cep', 'CEP', {
                inputMode: 'numeric',
                autoComplete: 'postal-code',
                maxLength: 9,
                placeholder: '00000-000',
              })}
            </div>
            <div className="col-md-6">{campo('rua', 'Rua')}</div>
            <div className="col-md-3">{campo('numero', 'Número', { maxLength: 20 })}</div>
            <div className="col-md-4">{campo('complemento', 'Complemento', { maxLength: 100 })}</div>
            <div className="col-md-3">{campo('bairro', 'Bairro')}</div>
            <div className="col-md-3">{campo('cidade', 'Cidade')}</div>
            <div className="col-md-2">
              <CampoSelect
                label="UF"
                name="uf"
                opcoes={OPCOES_UF}
                value={form.uf}
                onChange={(e) => alterar('uf', e.target.value)}
                onBlur={() => aoSair('uf')}
                erro={erroDe('uf')}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-4 mb-0 pt-4 border-top">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
