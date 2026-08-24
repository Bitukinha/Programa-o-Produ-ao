import { useSession } from "@tanstack/react-start/server";

// Falls back to a fixed secret so the app keeps working without extra setup;
// set SESSION_SECRET in production to invalidate sessions on deploy.
const SESSION_PASSWORD =
  process.env.SESSION_SECRET || "nutrimilho-producao-flow-tracker-session-secret-2026";
const PCP_PASSWORD = process.env.PCP_PASSWORD || "Mudar@123";

export type PcpNome = "Jean" | "Matheus";

type AuthSessionData = { role?: "pcp"; nome?: PcpNome };

function authSession() {
  // Not a React hook — this is h3/TanStack Start's server-side session helper.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<AuthSessionData>({
    password: SESSION_PASSWORD,
    name: "nutrimilho_auth",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSessionRole(): Promise<{ isPcp: boolean; nome: PcpNome | null }> {
  const session = await authSession();
  return { isPcp: session.data.role === "pcp", nome: session.data.nome ?? null };
}

export async function requirePcp(): Promise<void> {
  const { isPcp } = await getSessionRole();
  if (!isPcp) {
    throw new Error("Acesso restrito ao PCP.");
  }
}

export async function loginAsPcp(password: string, nome: PcpNome): Promise<void> {
  if (password !== PCP_PASSWORD) {
    throw new Error("Senha incorreta.");
  }
  const session = await authSession();
  await session.update({ role: "pcp", nome });
}

export async function logoutPcpSession(): Promise<void> {
  const session = await authSession();
  await session.clear();
}
