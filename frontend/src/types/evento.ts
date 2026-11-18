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
  imagemUrl: string | null;
}

/** Mesmos campos de EventoRequest no backend (a imagem é enviada à parte). */
export interface EventoRequest {
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  capacidade: number;
  inscricaoInicio: string;
  inscricaoFim: string;
}
