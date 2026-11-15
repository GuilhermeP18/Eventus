/** Data local de hoje (ou de N anos atrás) no formato yyyy-MM-dd, o mesmo do input type="date". */
export function hojeISO(anosAtras = 0): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anosAtras);
  return data.toLocaleDateString('en-CA');
}
