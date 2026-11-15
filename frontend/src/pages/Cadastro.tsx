import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { Campo } from '../components/Campo';
import { ErrorMessage } from '../components/ErrorMessage';
import { hojeISO } from '../utils/datas';

const inicial = {
  nome: '',
  email: '',
  cpf: '',
  dataNascimento: '',
  senha: '',
  cep: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
};

type Form = typeof inicial;

interface OpcoesCampo {
  type?: string;
  autoComplete?: string;
  maxLength?: number;
}

function validar(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Informe um e-mail válido';
  if (f.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF deve ter 11 dígitos';
  if (!f.dataNascimento) e.dataNascimento = 'Informe a data de nascimento';
  else if (f.dataNascimento > hojeISO(18)) e.dataNascimento = 'É necessário ter pelo menos 18 anos';
  if (f.senha.length < 8) e.senha = 'A senha deve ter no mínimo 8 caracteres';
  if (f.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP deve ter 8 dígitos';
  if (!f.rua.trim()) e.rua = 'Informe a rua';
  if (!f.numero.trim()) e.numero = 'Informe o número';
  if (!f.bairro.trim()) e.bairro = 'Informe o bairro';
  if (!f.cidade.trim()) e.cidade = 'Informe a cidade';
  if (!/^[A-Za-z]{2}$/.test(f.uf)) e.uf = 'UF deve ter 2 letras';
  return e;
}

export function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const campo = (name: keyof Form, label: string, extra: OpcoesCampo = {}) => (
    <Campo
      label={label}
      name={name}
      value={form[name]}
      onChange={(e) => setForm({ ...form, [name]: name === 'uf' ? e.target.value.toUpperCase() : e.target.value })}
      erro={erros[name]}
      {...extra}
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
      await http.post('/auth/cadastro', {
        nome: form.nome.trim(),
        email: form.email.trim(),
        cpf: form.cpf,
        dataNascimento: form.dataNascimento,
        senha: form.senha,
        endereco: {
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
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
        const doServidor: Record<string, string> = {};
        for (const [chave, texto] of Object.entries(campos)) {
          doServidor[chave.replace('endereco.', '')] = texto;
        }
        setErros(doServidor);
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
            <div className="col-md-4">{campo('cpf', 'CPF', { maxLength: 14 })}</div>
            <div className="col-md-4">{campo('dataNascimento', 'Data de nascimento', { type: 'date' })}</div>
            <div className="col-md-4">
              {campo('senha', 'Senha', { type: 'password', autoComplete: 'new-password' })}
            </div>
          </div>

          <h2 className="h5 mt-2">Endereço</h2>
          <div className="row">
            <div className="col-md-4">{campo('cep', 'CEP', { maxLength: 9 })}</div>
            <div className="col-md-6">{campo('rua', 'Rua')}</div>
            <div className="col-md-2">{campo('numero', 'Número')}</div>
            <div className="col-md-5">{campo('bairro', 'Bairro')}</div>
            <div className="col-md-5">{campo('cidade', 'Cidade')}</div>
            <div className="col-md-2">{campo('uf', 'UF', { maxLength: 2 })}</div>
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
