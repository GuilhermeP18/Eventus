import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { enviarImagem, mensagemErroImagem } from '../api/imagem';
import { FormularioEvento } from '../components/FormularioEvento';
import type { Evento, EventoRequest } from '../types/evento';

export function NovoEvento() {
  const navigate = useNavigate();

  const salvar = async (dados: EventoRequest, imagem: File | null) => {
    const { data } = await http.post<Evento>('/eventos', dados);
    if (imagem) {
      try {
        await enviarImagem(data.id, imagem);
      } catch (err) {
        // o evento já existe: leva o usuário ao detalhe com um aviso
        navigate(`/eventos/${data.id}`, {
          state: { aviso: `Evento criado, mas a imagem não foi enviada: ${mensagemErroImagem(err)}` },
        });
        return;
      }
    }
    navigate(`/eventos/${data.id}`);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card-eventus">
          <h1 className="h3">Criar evento</h1>
          <p className="text-muted">Preencha os dados para publicar um novo evento.</p>
          <FormularioEvento textoBotao="Criar evento" textoEnviando="Criando evento..." onSalvar={salvar} />
        </div>
      </div>
    </div>
  );
}
