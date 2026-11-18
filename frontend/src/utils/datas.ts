/** Data local de hoje (ou de N anos atrás) no formato yyyy-MM-dd, o mesmo do input type="date". */
export function hojeISO(anosAtras = 0): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anosAtras);
  return data.toLocaleDateString('en-CA');
}

/** "2026-12-01" -> "01/12/2026" */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "2026-12-01T08:00:00" -> "01/12/2026 08:00" (horário local, como a API devolve) */
export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
