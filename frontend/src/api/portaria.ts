import { http } from './http';
import type { InscricaoPortaria } from '../types/portaria';

export async function buscarInscricoes(q: string, signal?: AbortSignal): Promise<InscricaoPortaria[]> {
  const { data } = await http.get<InscricaoPortaria[]>('/portaria/busca', { params: { q }, signal });
  return data;
}

export async function registrarEntrada(id: number): Promise<InscricaoPortaria> {
  const { data } = await http.post<InscricaoPortaria>(`/portaria/inscricoes/${id}/checkin`);
  return data;
}
