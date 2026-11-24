import { useState } from 'react';

/**
 * Decide quando a mensagem de erro de cada campo aparece:
 * só depois que o campo perdeu o foco ou depois de uma tentativa de envio,
 * e nunca enquanto a pessoa está digitando nele.
 */
export function useErrosVisiveis<K extends string>(erros: Partial<Record<K, string>>) {
  const [tocados, setTocados] = useState<ReadonlySet<K>>(() => new Set());
  const [editando, setEditando] = useState<K | null>(null);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  /** Chamar no onChange do campo. */
  const aoEditar = (campo: K) => setEditando(campo);

  /** Chamar no onBlur do campo. */
  const aoSair = (campo: K) => {
    setEditando(null);
    setTocados((atual) => (atual.has(campo) ? atual : new Set(atual).add(campo)));
  };

  /** Chamar no submit, antes de validar. */
  const marcarEnvio = () => {
    setEditando(null);
    setTentouEnviar(true);
  };

  const erroDe = (campo: K): string | undefined =>
    (tentouEnviar || tocados.has(campo)) && editando !== campo ? erros[campo] : undefined;

  return { erroDe, aoEditar, aoSair, marcarEnvio };
}
