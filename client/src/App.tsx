import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PGRList from "@/pages/pgr-list";
import Companies from "@/pages/companies";
import PGRWizard from "@/pages/pgr-wizard";
import DocumentPreview from "@/pages/document-preview";
import Trainings from "@/pages/trainings";
import Documents from "@/pages/documents";
import NormativeUpdate from "@/pages/normative-update";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pgr" component={PGRList} />
      <Route path="/empresas" component={Companies} />
      <Route path="/pgr/novo" component={PGRWizard} />
      <Route path="/pgr/:id/editar" component={PGRWizard} />
      <Route path="/pgr/:id/preview" component={DocumentPreview} />
      <Route path="/treinamentos" component={Trainings} />
      <Route path="/documentos" component={Documents} />
      <Route path="/atualizacao-normativa" component={NormativeUpdate} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
