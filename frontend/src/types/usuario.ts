/** Mesmos campos de EnderecoDto no backend. */
export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Mesmos campos de UsuarioResponse no backend (sem senha). */
export interface Perfil {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string;
  dataNascimento: string;
  endereco: Endereco;
  operador: boolean;
}
