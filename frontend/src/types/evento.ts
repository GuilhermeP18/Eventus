/** Mesmos campos de EventoResponse no backend. */
export interface Evento {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string;
  local: string;
  capacidade: number;
  inscricaoInicio: string;
  inscricaoFim: string;
}
