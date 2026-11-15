import axios from 'axios';

/** Formato de erro devolvido pela API (ErroResponse). */
export interface ApiError {
  status?: number;
  mensagem?: string;
  campos: Record<string, string>;
}

export function lerErro(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { mensagem?: string; campos?: Record<string, string> } | undefined;
    return { status: err.response?.status, mensagem: data?.mensagem, campos: data?.campos ?? {} };
  }
  return { campos: {} };
}
