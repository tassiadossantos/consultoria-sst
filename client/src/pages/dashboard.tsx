import React from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  FileCheck,
  Clock,
  Plus,
  ChevronRight,
  TrendingUp,
  Users,
  ExternalLink,
} from "lucide-react";
import { fetchPgrs, fetchCompanies, fetchSstNews, fetchExpiringTrainings } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const DEFAULT_SST_SOURCE_URL =
  "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho";

export default function Dashboard() {
  const { data: pgrs = [], isLoading: isLoadingPgrs } = useQuery({
    queryKey: ["pgrs"],
    queryFn: fetchPgrs,
  });

  const { data: companiesData = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const { data: sstNewsData, isLoading: isLoadingSstNews } = useQuery({
    queryKey: ["sst-news"],
    queryFn: fetchSstNews,
  });

  const { data: expiringTrainingsData, isLoading: isLoadingExpiringTrainings } = useQuery({
    queryKey: ["trainings", "expiring", 7],
    queryFn: () => fetchExpiringTrainings(7),
  });

  const sstNewsItems = sstNewsData?.items ?? [];
  const sstSourceUrl = sstNewsData?.sourceUrl ?? DEFAULT_SST_SOURCE_URL;

  const expiringTrainings = expiringTrainingsData?.items ?? [];
  const expiringTrainingsWindowDays = expiringTrainingsData?.windowDays ?? 7;
  const expiringParticipantsCount = expiringTrainingsData?.totalParticipants ?? 0;
  const expiringTrainingsTitlesPreview = expiringTrainings
    .slice(0, 3)
    .map((training) => training.title)
    .join(", ");

  const activePGRs = pgrs.filter(p => p.status === "active").length;
  const expiredPGRs = pgrs.filter(p => p.status === "expired").length;
  const draftPGRs = pgrs.filter(p => p.status === "draft").length;
  const totalCompanies = companiesData.length;
  const companiesWithPgr = new Set(pgrs.map(p => p.company?.id).filter(Boolean)).size;
  const draftSummaryText =
    draftPGRs === 0
      ? "Nenhum rascunho pendente"
      : draftPGRs === 1
        ? "1 rascunho pendente"
        : `${draftPGRs} rascunhos pendentes`;
  const companiesSummaryText =
    totalCompanies === 0
      ? "Nenhuma empresa cadastrada"
      : companiesWithPgr === 1
        ? "1 empresa com PGR monitorado"
        : `${companiesWithPgr} empresas com PGR monitorado`;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  const activeCurrentMonth = pgrs.filter((pgr) => {
    if (pgr.status !== "active") {
      return false;
    }

    const createdAt = new Date(pgr.created_at);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;

  const activePreviousMonth = pgrs.filter((pgr) => {
    if (pgr.status !== "active") {
      return false;
    }

    const createdAt = new Date(pgr.created_at);
    return createdAt.getMonth() === previousMonth && createdAt.getFullYear() === previousYear;
  }).length;

  const activeDelta = activeCurrentMonth - activePreviousMonth;
  const activeDeltaText =
    activeDelta === 0
      ? "Sem variação desde o último mês"
      : `${activeDelta > 0 ? "+" : ""}${activeDelta} desde o último mês`;

  const msPerDay = 1000 * 60 * 60 * 24;
  const expiredOver30Days = pgrs.filter((pgr) => {
    if (pgr.status !== "expired" || !pgr.valid_until) {
      return false;
    }

    const validUntil = new Date(pgr.valid_until);
    const diffDays = Math.floor((now.getTime() - validUntil.getTime()) / msPerDay);
    return diffDays > 30;
  }).length;

  const expiredSummaryText =
    expiredPGRs === 0
      ? "Nenhum vencido"
      : expiredOver30Days === 0
        ? `${expiredPGRs} vencido${expiredPGRs > 1 ? "s" : ""}`
        : `${expiredOver30Days} vencido${expiredOver30Days > 1 ? "s" : ""} há mais de 30 dias`;

  if (isLoadingPgrs || isLoadingCompanies) {
    return (
      <Layout>
        <div className="text-sm text-muted-foreground p-6">Carregando dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h2>
            <p className="text-muted-foreground mt-1">Bem-vinda de volta, Tassia.</p>
          </div>
          <Link href="/pgr/novo">
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo PGR
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/pgr?status=active">
            <Card className="hover:shadow-md transition-all border-l-4 border-l-primary cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PGRs Ativos</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePGRs}</div>
                <p className="text-xs text-muted-foreground">
                  {activeDeltaText}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pgr?status=expired">
            <Card className="hover:shadow-md transition-all border-l-4 border-l-destructive cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{expiredPGRs}</div>
                <p className="text-xs text-muted-foreground">
                  {expiredSummaryText}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pgr?status=draft">
            <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Elaboração</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{draftPGRs}</div>
                <p className="text-xs text-muted-foreground">
                  {draftSummaryText}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/empresas">
            <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCompanies}</div>
                <p className="text-xs text-muted-foreground">
                  {companiesSummaryText}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

          {/* Recent Activity / List */}
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>PGRs Recentes</CardTitle>
              <CardDescription>
                Últimos documentos modificados ou criados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pgrs.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum PGR encontrado. Crie seu primeiro PGR para iniciar o acompanhamento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pgrs.map((pgr) => {
                    const pgrHref =
                      pgr.status === "draft"
                        ? `/pgr/${pgr.id}/editar`
                        : `/pgr/${pgr.id}/preview`;

                    return (
                      <Link key={pgr.id} href={pgrHref}>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-2 h-12 rounded-full ${
                                pgr.status === "active"
                                  ? "bg-emerald-500"
                                  : pgr.status === "expired"
                                    ? "bg-destructive"
                                    : "bg-amber-500"
                              }`}
                            />
                            <div>
                              <p className="font-medium group-hover:text-primary transition-colors">{pgr.company?.name ?? "Empresa"}</p>
                              <p className="text-sm text-muted-foreground">Rev. {pgr.revision} • Atualizado em {new Date(pgr.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium">
                                {pgr.status === "active" ? "Vigente" : pgr.status === "expired" ? "Vencido" : "Rascunho"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pgr.status === "active" && pgr.valid_until ? `Até ${new Date(pgr.valid_until).toLocaleDateString("pt-BR")}` : "Ação Necessária"}
                              </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground group-hover:text-primary">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions / Alerts */}
          <Card className="col-span-3 shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle>Ações Rápidas & Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="h-4 w-4 text-amber-500" />
                   <h4 className="font-semibold text-sm">Treinamentos Vencendo</h4>
                </div>
                {isLoadingExpiringTrainings ? (
                  <p className="text-sm text-muted-foreground mb-3">
                    Carregando alertas de treinamentos...
                  </p>
                ) : expiringTrainings.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      {expiringParticipantsCount > 0
                        ? `${expiringParticipantsCount} funcionário${expiringParticipantsCount > 1 ? "s" : ""} em ${expiringTrainings.length} treinamento${expiringTrainings.length > 1 ? "s" : ""} com vencimento nos próximos ${expiringTrainingsWindowDays} dias.`
                        : `${expiringTrainings.length} treinamento${expiringTrainings.length > 1 ? "s" : ""} com vencimento nos próximos ${expiringTrainingsWindowDays} dias.`}
                    </p>
                    {expiringTrainingsTitlesPreview ? (
                      <p className="text-xs text-muted-foreground mb-3">
                        {expiringTrainingsTitlesPreview}
                        {expiringTrainings.length > 3 ? "..." : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-3">
                        Abra a lista para ver os detalhes.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhum treinamento marcado como vencendo no momento.
                  </p>
                )}
                <Link href="/treinamentos?status=vencendo">
                  <Button variant="outline" size="sm" className="w-full">Verificar</Button>
                </Link>
              </div>

              <div className="p-4 bg-card border rounded-lg shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                   <TrendingUp className="h-4 w-4 text-emerald-500" />
                   <h4 className="font-semibold text-sm">Atualizações SST (MTE)</h4>
                </div>
                {isLoadingSstNews ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando notícias do MTE...
                  </p>
                ) : sstNewsItems.length > 0 ? (
                  <div className="space-y-2">
                    {sstNewsItems.map((item) => (
                      <a
                        key={item.link}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.publishedAt).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm font-medium">{item.title}</p>
                      </a>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary hover:text-primary/80"
                      asChild
                    >
                      <a href={sstSourceUrl} target="_blank" rel="noreferrer">
                        Abrir página oficial
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Não foi possível carregar notícias agora. Você pode consultar a página
                      oficial do MTE.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary hover:text-primary/80"
                      asChild
                    >
                      <a href={sstSourceUrl} target="_blank" rel="noreferrer">
                        Abrir página oficial
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
