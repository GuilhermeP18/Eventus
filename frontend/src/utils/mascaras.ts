/**
 * Máscaras e validações de campos brasileiros (CPF, telefone, CEP).
 * As funções "mascarar*" recebem o texto digitado, descartam o que não é dígito
 * e devolvem o valor formatado progressivamente. As "validar*" devolvem a mensagem
 * de erro ou undefined quando o valor está correto.
 */

/** Mantém só os dígitos, limitando a quantidade. */
export function somenteDigitos(valor: string, maximo?: number): string {
  const digitos = valor.replace(/\D/g, '');
  return maximo === undefined ? digitos : digitos.slice(0, maximo);
}

/** "12345678901" -> "123.456.789-01" (formata parcialmente enquanto digita). */
export function mascararCpf(valor: string): string {
  const d = somenteDigitos(valor, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** "11987654321" -> "(11) 98765-4321"; com 10 dígitos -> "(11) 8765-4321". */
export function mascararTelefone(valor: string): string {
  const d = somenteDigitos(valor, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  // com 11 dígitos o número tem 5 dígitos antes do hífen; com até 10, tem 4
  const corte = d.length === 11 ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** "12345678" -> "12345-678". */
export function mascararCep(valor: string): string {
  const d = somenteDigitos(valor, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function validarCpf(valor: string): string | undefined {
  return somenteDigitos(valor).length === 11 ? undefined : 'CPF deve ter 11 dígitos';
}

/** Telefone é opcional: vazio é válido. */
export function validarTelefone(valor: string): string | undefined {
  const tamanho = somenteDigitos(valor).length;
  return tamanho === 0 || tamanho === 10 || tamanho === 11 ? undefined : 'Telefone deve ter 10 ou 11 dígitos';
}

export function validarCep(valor: string): string | undefined {
  return somenteDigitos(valor).length === 8 ? undefined : 'CEP deve ter 8 dígitos';
}
