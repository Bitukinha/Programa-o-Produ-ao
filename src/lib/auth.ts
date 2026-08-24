import {
  getAuthStatus,
  loginPcp as loginPcpFn,
  logoutPcp as logoutPcpFn,
} from "@/lib/api/auth.functions";

export type PcpNome = "Jean" | "Matheus";

export type AuthStatus = {
  isPcp: boolean;
  nome: PcpNome | null;
};

export async function fetchAuthStatus(): Promise<AuthStatus> {
  return getAuthStatus();
}

export async function loginPcp(input: { password: string; nome: PcpNome }) {
  await loginPcpFn({ data: input });
}

export async function logoutPcp() {
  await logoutPcpFn();
}
