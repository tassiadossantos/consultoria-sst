import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PGRList from "@/pages/pgr-list";
import PGRWizard from "@/pages/pgr-wizard";
import DocumentPreview from "@/pages/document-preview";
import Trainings from "@/pages/trainings";
import Documents from "@/pages/documents";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pgr" component={PGRList} />
      <Route path="/pgr/novo" component={PGRWizard} />
      <Route path="/pgr/:id/preview" component={DocumentPreview} />
      <Route path="/treinamentos" component={Trainings} />
      <Route path="/documentos" component={Documents} />
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
