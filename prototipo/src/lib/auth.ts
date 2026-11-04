// Perfis aceitos no cadastro; definem a tela inicial após o login (RN001).
export type Role = "cliente" | "organizador" | "funcionario";

export const ROLE_LABELS: Record<Role, string> = {
  cliente: "Cliente",
  organizador: "Organizador",
  funcionario: "Funcionário",
};

export type SessionUser = { name: string; email: string; role: Role };

// Conta gravada no localStorage; a senha fica só como hash com salt.
type Account = {
  name: string;
  email: string;
  cpf: string;
  cep: string;
  birthDate: string;
  role: Role;
  salt: string;
  passwordHash: string;
  verified: boolean;
  verifyCode: string;
};

// Erros de login seguidos por e-mail, base do bloqueio da RN003.
type Attempts = { count: number; lockedUntil: number };

export type RegisterInput = {
  name: string;
  email: string;
  cpf: string;
  cep: string;
  birthDate: string;
  role: Role;
  password: string;
};

export type RegisterField = "name" | "email" | "cpf" | "cep" | "birthDate" | "role" | "password";

export type RegisterResult =
  | { ok: true; email: string }
  | { ok: false; errors: Partial<Record<RegisterField, string>> };

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "locked" | "unverified" | "storage"; message: string; retryAfterMs?: number };

export type VerifyResult = { ok: true; user: SessionUser } | { ok: false; message: string };

// Limites das regras: RN003 (5 erros, bloqueio de 15 min) e RN007 (idade mínima de 13 anos).
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const MIN_AGE = 13;
export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha incorretos";

// Chaves do localStorage usadas pela autenticação simulada.
const USERS_KEY = "eventus.auth.users";
const SESSION_KEY = "eventus.auth.session";
const ATTEMPTS_KEY = "eventus.auth.attempts";
const LOCK_MS = LOCK_MINUTES * 60 * 1000;

// Leitura segura do localStorage; devolve o valor padrão se falhar.
const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

// Escrita segura; retorna false quando o navegador bloqueia o storage.
const writeJson = (key: string, value: unknown): boolean => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const removeKey = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
};

const readUsers = () => readJson<Account[]>(USERS_KEY, []);
const readAttempts = () => readJson<Record<string, Attempts>>(ATTEMPTS_KEY, {});

// Normalizam e-mail e CPF para comparar duplicidade (RN005).
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const formatCpf = (value: string) =>
  onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Calcula a idade a partir de AAAA-MM-DD; null se a data for inválida (RN007).
export const ageFromBirthDate = (birthDate: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
};

// Informam se e-mail ou CPF já têm conta (RN005).
export const emailTaken = (email: string) => {
  const target = normalizeEmail(email);
  return target !== "" && readUsers().some((u) => u.email === target);
};

export const cpfTaken = (cpf: string) => {
  const target = onlyDigits(cpf);
  return target !== "" && readUsers().some((u) => u.cpf === target);
};

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const randomHex = (size: number) => toHex(window.crypto.getRandomValues(new Uint8Array(size)));

// SHA-256 de salt + senha; a senha nunca é guardada em texto puro.
const hashPassword = async (salt: string, password: string) => {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
};

// Código de 6 dígitos da verificação de e-mail simulada (RN004).
const randomCode = () => {
  const value = window.crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
  return String(value % 1000000).padStart(6, "0");
};

const toSessionUser = (account: Account): SessionUser => ({
  name: account.name,
  email: account.email,
  role: account.role,
});

// Validações do cadastro: RN005 (duplicidade) e RN007 (data obrigatória e idade).
export const validateRegister = (input: RegisterInput): Partial<Record<RegisterField, string>> => {
  const errors: Partial<Record<RegisterField, string>> = {};
  if (!input.name.trim()) errors.name = "Informe seu nome completo";
  if (!isEmailValid(input.email)) errors.email = "Informe um e-mail válido";
  else if (emailTaken(input.email)) errors.email = "Já existe uma conta com este e-mail";
  if (onlyDigits(input.cpf).length !== 11) errors.cpf = "Informe um CPF com 11 dígitos";
  else if (cpfTaken(input.cpf)) errors.cpf = "Já existe uma conta com este CPF";
  if (onlyDigits(input.cep).length !== 8) errors.cep = "Informe um CEP com 8 dígitos";
  if (!input.birthDate) errors.birthDate = "A data de nascimento é obrigatória";
  else {
    const age = ageFromBirthDate(input.birthDate);
    if (age === null || age < 0) errors.birthDate = "Informe uma data de nascimento válida";
    else if (age < MIN_AGE) errors.birthDate = `Menores de ${MIN_AGE} anos não podem se cadastrar sem autorização legal`;
  }
  if (!input.role) errors.role = "Escolha o seu perfil";
  if (!input.password) errors.password = "Informe uma senha";
  return errors;
};

// Cria a conta como não verificada, com o hash da senha e o código de verificação.
export const register = async (input: RegisterInput): Promise<RegisterResult> => {
  const errors = validateRegister(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  try {
    const salt = randomHex(16);
    const account: Account = {
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      cpf: onlyDigits(input.cpf),
      cep: onlyDigits(input.cep),
      birthDate: input.birthDate,
      role: input.role,
      salt,
      passwordHash: await hashPassword(salt, input.password),
      verified: false,
      verifyCode: randomCode(),
    };
    if (!writeJson(USERS_KEY, [...readUsers(), account])) {
      return { ok: false, errors: { email: "Não foi possível salvar o cadastro neste navegador" } };
    }
    return { ok: true, email: account.email };
  } catch {
    return { ok: false, errors: { password: "Não foi possível processar a senha neste navegador" } };
  }
};

// Devolve o código para exibir em tela, já que nenhum e-mail é enviado.
export const getVerificationCode = (email: string): string | null => {
  const target = normalizeEmail(email);
  const account = readUsers().find((u) => u.email === target && !u.verified);
  return account ? account.verifyCode : null;
};

export const isEmailVerified = (email: string) => {
  const target = normalizeEmail(email);
  return readUsers().some((u) => u.email === target && u.verified);
};

// Confirma o e-mail (RN004) e abre a sessão.
export const verifyEmail = (email: string, code: string): VerifyResult => {
  const target = normalizeEmail(email);
  const users = readUsers();
  const account = users.find((u) => u.email === target);
  if (!account) return { ok: false, message: "Conta não encontrada" };
  if (!account.verified) {
    if (code.trim() !== account.verifyCode) return { ok: false, message: "Código de verificação incorreto" };
    const updated = users.map((u) => (u.email === target ? { ...u, verified: true } : u));
    if (!writeJson(USERS_KEY, updated)) return { ok: false, message: "Não foi possível salvar neste navegador" };
  }
  const user = toSessionUser(account);
  if (!writeJson(SESSION_KEY, user)) return { ok: false, message: "Não foi possível iniciar a sessão neste navegador" };
  return { ok: true, user };
};

// Tempo restante do bloqueio de login deste e-mail (RN003).
export const getLockRemainingMs = (email: string): number => {
  const entry = readAttempts()[normalizeEmail(email)];
  if (!entry) return 0;
  return Math.max(0, entry.lockedUntil - Date.now());
};

// Login: RN002 (mensagem genérica), RN003 (bloqueio) e RN004 (conta não verificada).
export const login = async (email: string, password: string): Promise<LoginResult> => {
  const target = normalizeEmail(email);
  const attempts = readAttempts();
  const entry = attempts[target] ?? { count: 0, lockedUntil: 0 };
  const now = Date.now();
  if (entry.lockedUntil > now) {
    return lockedResult(entry.lockedUntil - now);
  }
  if (entry.lockedUntil !== 0) {
    entry.count = 0;
    entry.lockedUntil = 0;
  }
  try {
    const account = readUsers().find((u) => u.email === target);
    const hash = account ? await hashPassword(account.salt, password) : null;
    if (!account || hash !== account.passwordHash) {
      entry.count += 1;
      if (entry.count >= MAX_ATTEMPTS) {
        entry.count = 0;
        entry.lockedUntil = Date.now() + LOCK_MS;
        writeJson(ATTEMPTS_KEY, { ...attempts, [target]: entry });
        return lockedResult(LOCK_MS);
      }
      writeJson(ATTEMPTS_KEY, { ...attempts, [target]: entry });
      return { ok: false, reason: "invalid", message: INVALID_CREDENTIALS_MESSAGE };
    }
    const { [target]: _removed, ...rest } = attempts;
    writeJson(ATTEMPTS_KEY, rest);
    if (!account.verified) {
      return {
        ok: false,
        reason: "unverified",
        message: "Confirme seu e-mail antes de entrar. Use o código de verificação do cadastro.",
      };
    }
    const user = toSessionUser(account);
    if (!writeJson(SESSION_KEY, user)) {
      return { ok: false, reason: "storage", message: "Não foi possível iniciar a sessão neste navegador" };
    }
    return { ok: true, user };
  } catch {
    return { ok: false, reason: "storage", message: "Não foi possível validar a senha neste navegador" };
  }
};

// Monta a resposta de login bloqueado com os minutos restantes.
const lockedResult = (remainingMs: number): LoginResult => {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return {
    ok: false,
    reason: "locked",
    retryAfterMs: remainingMs,
    message: `Muitas tentativas incorretas. Login bloqueado por ${minutes} min para este e-mail.`,
  };
};

// Usuário da sessão atual; null no servidor ou sem login.
export const getCurrentUser = (): SessionUser | null => {
  if (typeof window === "undefined") return null;
  const user = readJson<SessionUser | null>(SESSION_KEY, null);
  if (!user || typeof user.email !== "string") return null;
  return user;
};

// Encerra a sessão removendo o usuário do storage.
export const logout = () => {
  if (typeof window === "undefined") return;
  removeKey(SESSION_KEY);
};

// Tela inicial por perfil depois do login (RN001).
export const destinationFor = (role: Role): "/painel" | "/meus-ingressos" =>
  role === "cliente" ? "/meus-ingressos" : "/painel";

// Aceita só caminhos internos em redirect, para não enviar o usuário para fora do site.
export const sanitizeRedirect = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;
  return value;
};

export const parseRedirectSearch = (search: Record<string, unknown>): { redirect?: string } => {
  const redirect = sanitizeRedirect(search["redirect"]);
  return redirect ? { redirect } : {};
};
