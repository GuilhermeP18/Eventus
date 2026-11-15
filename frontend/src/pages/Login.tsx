import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import { useAuth } from '../auth/useAuth';
import { Campo } from '../components/Campo';
import { ErrorMessage } from '../components/ErrorMessage';

interface TokenResponse {
  token: string;
  tipo: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const aviso = (location.state as { mensagem?: string } | null)?.mensagem;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) novos.email = 'Informe um e-mail válido';
    if (!senha) novos.senha = 'Informe a senha';
    setErros(novos);
    setErroApi(null);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      const { data } = await http.post<TokenResponse>('/auth/login', { email: email.trim(), senha });
      // a API só devolve o token (sem nome), então guardamos apenas o e-mail
      login({ email: email.trim().toLowerCase() }, data.token);
      navigate('/meus-ingressos');
    } catch (err) {
      const { status } = lerErro(err);
      if (status === 401) setErroApi('E-mail ou senha incorretos');
      else if (status === 429) setErroApi('Muitas tentativas. Tente de novo em 15 minutos.');
      else setErroApi('Não foi possível entrar. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-5 col-xl-4">
        <div className="card-eventus">
        <h1 className="h3">Entrar</h1>
        <p className="text-muted">Acesse sua conta para ver seus ingressos.</p>

        {aviso && (
          <div className="alert alert-success" role="status">
            {aviso}
          </div>
        )}
        {erroApi && <ErrorMessage message={erroApi} />}

        <form onSubmit={handleSubmit} noValidate>
          <Campo
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erros.email}
          />
          <Campo
            label="Senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={erros.senha}
          />
          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 mb-0 pt-4 border-top text-center">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
