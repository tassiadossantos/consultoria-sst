import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PGRList from "@/pages/pgr-list";
import Companies from "@/pages/companies";
import PGRWizard from "@/pages/pgr-wizard";
import DocumentPreview from "@/pages/document-preview";
import Trainings from "@/pages/trainings";
import Documents from "@/pages/documents";
import DocumentGeneratorPage from "@/pages/document-generator";
import NormativeUpdate from "@/pages/normative-update";
import HelpPage from "@/pages/help";
import LoginPage from "@/pages/login";
import ConfiguracoesPage from "@/pages/configuracoes";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ProtectedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pgr" component={PGRList} />
      <Route path="/empresas" component={Companies} />
      <Route path="/pgr/novo" component={PGRWizard} />
      <Route path="/pgr/:id/editar" component={PGRWizard} />
      <Route path="/pgr/:id/preview" component={DocumentPreview} />
      <Route path="/treinamentos" component={Trainings} />
      <Route path="/documentos/novo" component={DocumentGeneratorPage} />
      <Route path="/documentos" component={Documents} />
      <Route path="/atualizacao-normativa" component={NormativeUpdate} />
      <Route path="/ajuda" component={HelpPage} />
      <Route path="/configuracoes" component={ConfiguracoesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated && location !== "/login") {
      setLocation(`/login?redirect=${encodeURIComponent(location)}`);
      return;
    }

    if (isAuthenticated && location === "/login") {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <ProtectedRoutes />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route component={AuthGate} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
