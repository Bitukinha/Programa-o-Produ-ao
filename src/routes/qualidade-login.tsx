import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { loginQualidade } from "@/lib/auth";

export const Route = createFileRoute("/qualidade-login")({
  head: () => ({ meta: [{ title: "Acesso Qualidade" }] }),
  component: QualidadeLogin,
});

function QualidadeLogin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => loginQualidade({ password }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Bem-vindo, Qualidade");
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <CardTitle>Acesso Qualidade</CardTitle>
          <CardDescription>
            Área restrita para bloquear ou desbloquear lançamentos de produção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) mutation.mutate();
              }}
              autoFocus
            />
          </div>
          <Button
            className="w-full"
            disabled={!password || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
