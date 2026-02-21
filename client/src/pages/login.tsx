import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import logoImg from "@/assets/images/logo-shield.png";

function getLoginErrorMessage(err: unknown): string {
  const rawMessage = err instanceof Error ? err.message : "Falha ao autenticar";
  const message = rawMessage.toLowerCase();

  if (message.includes("401")) {
    return "Usuário ou senha inválidos.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("econnrefused")
  ) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está em execução.";
  }

  if (message.includes("500")) {
    return "Erro interno no servidor (500). Verifique os logs do backend.";
  }

  if (message.includes("502") || message.includes("503")) {
    return "Servidor indisponível no momento. Tente novamente em instantes.";
  }

  return "Falha ao autenticar. Tente novamente.";
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRedirectPath = () => {
    if (typeof window === "undefined") {
      return "/";
    }

    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (redirect && redirect.startsWith("/")) {
      return redirect;
    }

    return "/";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      setLocation(getRedirectPath());
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        <img
          src={logoImg}
          alt="Escudo SST"
          className="h-24 md:h-28 w-auto object-contain"
        />
        <div className="text-center space-y-1">
          <p className="text-2xl font-semibold tracking-tight text-foreground">Escudo SST</p>
          <p className="text-sm text-muted-foreground">Gestão de Segurança do Trabalho</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Acessar plataforma</CardTitle>
            <CardDescription>Faça login para acessar os módulos de SST.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
