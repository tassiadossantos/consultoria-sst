import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Printer, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listPgrs } from "@/lib/pgr";

export default function PGRList() {
  const supabaseReady = isSupabaseConfigured();
  const { data: pgrs = [], isLoading, isError } = useQuery({
    queryKey: ["pgrs"],
    queryFn: listPgrs,
    enabled: supabaseReady,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPgrs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pgrs.filter((pgr) => {
      if (statusFilter !== "all" && pgr.status !== statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const companyName = pgr.company?.name?.toLowerCase() ?? "";
      const cnpj = pgr.company?.cnpj?.toLowerCase() ?? "";
      return (
        companyName.includes(term) ||
        cnpj.includes(term) ||
        pgr.id.toLowerCase().includes(term)
      );
    });
  }, [pgrs, searchTerm, statusFilter]);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de PGR</h2>
            <p className="text-muted-foreground">
              Consulte, edite e gere novos Programas de Gerenciamento de Riscos.
            </p>
          </div>
          <Link href="/pgr/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo PGR
            </Button>
          </Link>
        </div>

        {!supabaseReady && (
          <Alert>
            <AlertTitle>Supabase não configurado</AlertTitle>
            <AlertDescription>
              Preencha o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar os PGRs.
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Falha ao carregar PGRs</AlertTitle>
            <AlertDescription>Verifique a conexão com o Supabase e tente novamente.</AlertDescription>
          </Alert>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar por empresa, CNPJ ou ID..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Vigente</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="pending_review">Pend. revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && supabaseReady && (
          <div className="text-sm text-muted-foreground">Carregando PGRs...</div>
        )}

        {/* Data Table */}
        {pgrs.length === 0 && supabaseReady && !isLoading ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nenhum PGR cadastrado ainda. Clique em "Novo PGR" para iniciar.
          </div>
        ) : filteredPgrs.length === 0 && !isLoading ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nenhum resultado encontrado para os filtros atuais.
          </div>
        ) : (
          <div className="rounded-md border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revisão</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPgrs.map((pgr) => (
                  <TableRow key={pgr.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {pgr.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/50" />
                        {pgr.company?.name ?? "Empresa não informada"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          pgr.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : pgr.status === "expired"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : pgr.status === "pending_review"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {pgr.status === "active"
                          ? "Vigente"
                          : pgr.status === "expired"
                          ? "Vencido"
                          : pgr.status === "pending_review"
                          ? "Em revisão"
                          : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>Rev. {pgr.revision}</TableCell>
                    <TableCell>
                      {pgr.valid_until ? new Date(pgr.valid_until).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${pgr.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{pgr.progress ?? 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/pgr/${pgr.id}/editar`}>
                          <Button variant="ghost" size="icon" title="Editar PGR">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/pgr/${pgr.id}/preview`}>
                          <Button variant="ghost" size="icon" title="Visualizar PDF">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
