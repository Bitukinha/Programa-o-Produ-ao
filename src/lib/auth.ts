import {
  getAuthStatus,
  loginPcp as loginPcpFn,
  loginQualidade as loginQualidadeFn,
  logoutSession as logoutSessionFn,
} from "@/lib/api/auth.functions";

export type PcpNome = "Jean" | "Matheus";

export type AuthStatus = {
  isPcp: boolean;
  isQualidade: boolean;
  nome: PcpNome | null;
};

export async function fetchAuthStatus(): Promise<AuthStatus> {
  return getAuthStatus();
}

export async function loginPcp(input: { password: string; nome: PcpNome }) {
  await loginPcpFn({ data: input });
}

export async function loginQualidade(input: { password: string }) {
  await loginQualidadeFn({ data: input });
}

export async function logoutSession() {
  await logoutSessionFn();
}
