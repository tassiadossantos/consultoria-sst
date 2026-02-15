import React from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Calendar, AlertTriangle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Trainings() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestão de Treinamentos</h2>
            <p className="text-muted-foreground">
              Controle de vencimentos, listas de presença e certificados.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Treinamento
          </Button>
        </div>

        {/* Training Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realizados (Mês)</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">450</div>
            </CardContent>
          </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendados</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
            </CardContent>
          </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos/À Vencer</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">8</div>
            </CardContent>
          </Card>
        </div>

        {/* Trainings List */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar treinamentos..." className="pl-9" />
            </div>
          </div>

          <div className="rounded-md border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treinamento</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">NR-35 Trabalho em Altura</TableCell>
                  <TableCell>Metalúrgica Aço Forte</TableCell>
                  <TableCell>15/02/2026</TableCell>
                  <TableCell>João Dias</TableCell>
                  <TableCell>12</TableCell>
                  <TableCell><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Realizado</Badge></TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">NR-10 Segurança em Eletricidade</TableCell>
                  <TableCell>Construções Silva & Souza</TableCell>
                  <TableCell>20/02/2026</TableCell>
                  <TableCell>Carlos Eng.</TableCell>
                  <TableCell>8</TableCell>
                  <TableCell><Badge variant="outline" className="text-blue-600 border-blue-200">Agendado</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">NR-05 CIPA</TableCell>
                  <TableCell>Padaria Pão Quente</TableCell>
                  <TableCell>10/01/2026</TableCell>
                  <TableCell>Maria Tec.</TableCell>
                  <TableCell>4</TableCell>
                  <TableCell><Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Vencido</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
