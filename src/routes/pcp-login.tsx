import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loginPcp, type PcpNome } from "@/lib/auth";

export const Route = createFileRoute("/pcp-login")({
  head: () => ({ meta: [{ title: "Acesso PCP" }] }),
  component: PcpLogin,
});

function PcpLogin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [nome, setNome] = useState<PcpNome>("Jean");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => loginPcp({ nome, password }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth"] });
      toast.success(`Bem-vindo, ${nome}`);
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle>Acesso PCP</CardTitle>
          <CardDescription>
            Área restrita para lançamento e edição de ordens de produção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Select value={nome} onValueChange={(v) => setNome(v as PcpNome)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jean">Jean</SelectItem>
                <SelectItem value="Matheus">Matheus</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
