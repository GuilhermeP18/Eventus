export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  responsibleEmail: string | null;
  canCreateEvents: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  responsibleEmail: string;
  password: string;
};

export type RegisterField =
  | "name"
  | "email"
  | "cpf"
  | "phone"
  | "birthDate"
  | "responsibleEmail"
  | "password";

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; errors: Partial<Record<RegisterField, string>>; message?: string };

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "locked"; message: string; retryAfterMs?: number };

type ApiErrorResponse = {
  message?: unknown;
  field?: unknown;
  retryAfterMs?: unknown;
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
const REGISTER_FIELDS: RegisterField[] = [
  "name",
  "email",
  "cpf",
  "phone",
  "birthDate",
  "responsibleEmail",
  "password",
];

class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly field?: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "same-origin",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new AuthApiError("Não foi possível conectar ao servidor. Tente novamente.", 0);
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new AuthApiError("O servidor retornou uma resposta inválida.", response.status);
  }

  if (!response.ok) {
    const body = data as ApiErrorResponse;
    throw new AuthApiError(
      typeof body.message === "string" ? body.message : "Não foi possível concluir a solicitação.",
      response.status,
      typeof body.field === "string" ? body.field : undefined,
      typeof body.retryAfterMs === "number" ? body.retryAfterMs : undefined,
    );
  }

  return data as T;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const formatCpf = (value: string) =>
  onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
};

const isRegisterField = (field: string | undefined): field is RegisterField =>
  field !== undefined && REGISTER_FIELDS.includes(field as RegisterField);

export const register = async (input: RegisterInput): Promise<RegisterResult> => {
  try {
    const user = await request<SessionUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        email: normalizeEmail(input.email),
        responsibleEmail: normalizeEmail(input.responsibleEmail),
      }),
    });
    return { ok: true, user };
  } catch (error) {
    if (!(error instanceof AuthApiError)) throw error;
    const errors: Partial<Record<RegisterField, string>> = {};
    if (isRegisterField(error.field)) errors[error.field] = error.message;
    return { ok: false, errors, message: error.field ? undefined : error.message };
  }
};

export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const user = await request<SessionUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: normalizeEmail(email), password }),
    });
    return { ok: true, user };
  } catch (error) {
    if (!(error instanceof AuthApiError)) throw error;
    if (error.status === 401) {
      return { ok: false, reason: "invalid", message: "E-mail ou senha incorretos" };
    }
    if (error.status === 423) {
      return {
        ok: false,
        reason: "locked",
        message: error.message,
        retryAfterMs: error.retryAfterMs,
      };
    }
    throw error;
  }
};

export const getCurrentUser = async (): Promise<SessionUser | null> => {
  try {
    return await request<SessionUser>("/auth/me");
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) return null;
    throw error;
  }
};

export const logout = () => request<void>("/auth/logout", { method: "POST" });

export const destinationFor = (_user: SessionUser): "/meus-ingressos" => "/meus-ingressos";

export const sanitizeRedirect = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;
  return value;
};

export const parseRedirectSearch = (search: Record<string, unknown>): { redirect?: string } => {
  const redirect = sanitizeRedirect(search["redirect"]);
  return redirect ? { redirect } : {};
};
