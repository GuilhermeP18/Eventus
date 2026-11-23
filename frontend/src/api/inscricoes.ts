import { http } from './http';
import type { Inscricao } from '../types/inscricao';

export async function criarInscricao(eventoId: number): Promise<Inscricao> {
  const { data } = await http.post<Inscricao>(`/eventos/${eventoId}/inscricoes`);
  return data;
}

export async function listarMinhasInscricoes(signal?: AbortSignal): Promise<Inscricao[]> {
  const { data } = await http.get<Inscricao[]>('/inscricoes/minhas', { signal });
  return data;
}
