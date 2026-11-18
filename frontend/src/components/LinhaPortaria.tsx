import type { InscricaoPortaria } from '../types/portaria';
import { formatarCpf } from '../utils/cpf';
import { formatarDataHora } from '../utils/datas';

interface LinhaPortariaProps {
  inscricao: InscricaoPortaria;
  registrando: boolean;
  /** Algum check-in está em andamento: todos os botões ficam desabilitados. */
  ocupado: boolean;
  onRegistrar: (id: number) => void;
}

export function LinhaPortaria({ inscricao, registrando, ocupado, onRegistrar }: LinhaPortariaProps) {
  return (
    <tr>
      <td>{inscricao.nome}</td>
      <td className="text-nowrap">{formatarCpf(inscricao.cpf)}</td>
      <td className="font-monospace">{inscricao.codigo}</td>
      <td>{inscricao.eventoTitulo}</td>
      <td className="text-nowrap">{formatarDataHora(inscricao.eventoData)}</td>
      <td>
        <span className={`badge ${inscricao.presente ? 'text-bg-success' : 'text-bg-secondary'}`}>
          {inscricao.presente ? 'Presente' : 'Aguardando'}
        </span>
      </td>
      <td className="text-end">
        {!inscricao.presente && (
          <button
            type="button"
            className="btn btn-primary btn-sm text-nowrap"
            disabled={ocupado}
            onClick={() => onRegistrar(inscricao.id)}
          >
            {registrando ? 'Registrando...' : 'Registrar entrada'}
          </button>
        )}
      </td>
    </tr>
  );
}
