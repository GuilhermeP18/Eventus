/** "11122233344" -> "111.222.333-44" (devolve como veio se não tiver 11 dígitos) */
export function formatarCpf(cpf: string): string {
  return cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
}
