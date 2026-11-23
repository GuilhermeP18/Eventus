/** Mesmos campos de PortariaInscricaoResponse no backend. */
export interface InscricaoPortaria {
  id: number;
  codigo: string;
  presente: boolean;
  nome: string;
  cpf: string;
  eventoTitulo: string;
  eventoData: string;
}
