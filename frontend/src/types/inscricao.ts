/** Mesmos campos de InscricaoResponse no backend. */
export interface Inscricao {
  id: number;
  codigo: string;
  dataInscricao: string;
  presente: boolean;
  evento: {
    id: number;
    titulo: string;
    data: string;
    local: string;
  };
}
