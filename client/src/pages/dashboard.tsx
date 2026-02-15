import React from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  AlertTriangle, 
  FileCheck, 
  Clock, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Users
} from "lucide-react";
import { mockPGRs, mockCompanies } from "@/lib/mock-data";
import { Link } from "wouter";

export default function Dashboard() {
  const activePGRs = mockPGRs.filter(p => p.status === "active").length;
  const expiredPGRs = mockPGRs.filter(p => p.status === "expired").length;
  const draftPGRs = mockPGRs.filter(p => p.status === "draft").length;
  
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h2>
            <p className="text-muted-foreground mt-1">Bem-vindo de volta, João. Você tem 3 pendências urgentes hoje.</p>
          </div>
          <Link href="/pgr/novo">
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo PGR
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PGRs Ativos</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePGRs}</div>
              <p className="text-xs text-muted-foreground">
                +2 desde o último mês
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{expiredPGRs}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Elaboração</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftPGRs}</div>
              <p className="text-xs text-muted-foreground">
                4 rascunhos pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCompanies.length}</div>
              <p className="text-xs text-muted-foreground">
                Gestão ativa
              </p>
            </CardContent>
          </Card>
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
              <div className="space-y-4">
                {mockPGRs.map((pgr) => (
                  <div key={pgr.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${
                        pgr.status === 'active' ? 'bg-emerald-500' : 
                        pgr.status === 'expired' ? 'bg-destructive' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{pgr.companyName}</p>
                        <p className="text-sm text-muted-foreground">Rev. {pgr.revision} • Atualizado em {new Date(pgr.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">
                          {pgr.status === 'active' ? 'Vigente' : 
                           pgr.status === 'expired' ? 'Vencido' : 'Rascunho'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pgr.status === 'active' ? `Até ${new Date(pgr.validUntil).toLocaleDateString('pt-BR')}` : 'Ação Necessária'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Alerts */}
          <Card className="col-span-3 shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle>Ações Rápidas & Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white dark:bg-card border rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="h-4 w-4 text-amber-500" />
                   <h4 className="font-semibold text-sm">Treinamentos Vencendo</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  3 funcionários da <strong>Metalúrgica Aço Forte</strong> precisam renovar NR-35 esta semana.
                </p>
                <Button variant="outline" size="sm" className="w-full">Verificar</Button>
              </div>

              <div className="p-4 bg-white dark:bg-card border rounded-lg shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                   <TrendingUp className="h-4 w-4 text-emerald-500" />
                   <h4 className="font-semibold text-sm">Atualização Normativa</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Nova portaria do MTE sobre eSocial S-2240 foi publicada. O sistema já está atualizado.
                </p>
                <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary/80">Ler nota técnica</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
