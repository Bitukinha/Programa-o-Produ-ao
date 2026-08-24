import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionRole } = await import("../auth.server");
  return getSessionRole();
});

export const loginPcp = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1), nome: z.enum(["Jean", "Matheus"]) }))
  .handler(async ({ data }) => {
    const { loginAsPcp } = await import("../auth.server");
    await loginAsPcp(data.password, data.nome);
  });

export const loginQualidade = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { loginAsQualidade } = await import("../auth.server");
    await loginAsQualidade(data.password);
  });

export const logoutSession = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutSession: clear } = await import("../auth.server");
  await clear();
});
