import type { User } from '../auth/AuthContext';
import type { Evento } from '../types/evento';

/** Só o criador edita o evento. Mesma regra do back-end (EventoService.validarCriador). */
export function podeEditarEvento(user: User | null, evento: Evento): boolean {
  return user?.id !== undefined && user.id === evento.criadorId;
}
