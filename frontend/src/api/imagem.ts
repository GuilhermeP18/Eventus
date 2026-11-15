import { http } from './http';
import { lerErro } from './erros';
import type { Evento } from '../types/evento';

export const TIPOS_IMAGEM = ['image/png', 'image/jpeg', 'image/webp'];
const TAMANHO_MAX = 2 * 1024 * 1024;

/** Mesmas regras da API (JPG, PNG ou WEBP, até 2 MB). Devolve a mensagem de erro, ou null se estiver ok. */
export function validarImagem(arquivo: File): string | null {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return 'Formato de imagem não permitido. Use JPG, PNG ou WEBP.';
  if (arquivo.size > TAMANHO_MAX) return 'A imagem deve ter no máximo 2 MB.';
  return null;
}

export async function enviarImagem(eventoId: number, arquivo: File): Promise<Evento> {
  const dados = new FormData();
  dados.append('arquivo', arquivo);
  const { data } = await http.put<Evento>(`/eventos/${eventoId}/imagem`, dados);
  return data;
}

export function mensagemErroImagem(err: unknown): string {
  const { status, mensagem } = lerErro(err);
  // um proxy pode recusar o arquivo grande com 413 antes de chegar na API (sem mensagem JSON)
  if (status === 413) return 'A imagem deve ter no máximo 2 MB.';
  return mensagem ?? 'Não foi possível enviar a imagem.';
}
