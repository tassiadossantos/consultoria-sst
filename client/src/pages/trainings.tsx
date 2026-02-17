import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Calendar, AlertTriangle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

type TrainingItem = {
  id: string;
  training: string;
  company: string;
  date: string;
  instructor: string;
  participantsLabel: string;
  status: "Vencendo" | "Agendado" | "Vencido" | "Realizado";
};

const trainingsData: TrainingItem[] = [
  {
    id: "nr35-realizado-metalurgica",
    training: "NR-35 Trabalho em Altura",
    company: "Metalúrgica Aço Forte",
    date: "15/02/2026",
    instructor: "João Dias",
    participantsLabel: "12",
    status: "Realizado",
  },
  {
    id: "nr35-renovacao-metalurgica",
    training: "NR-35 Trabalho em Altura (Renovação)",
    company: "Metalúrgica Aço Forte",
    date: "17/02/2026",
    instructor: "João Dias",
    participantsLabel: "Ana Souza, Bruno Lima, Carla Santos (3)",
    status: "Vencendo",
  },
  {
    id: "nr10-silva-souza",
    training: "NR-10 Segurança em Eletricidade",
    company: "Construções Silva & Souza",
    date: "20/02/2026",
    instructor: "Carlos Eng.",
    participantsLabel: "8",
    status: "Agendado",
  },
  {
    id: "nr05-padaria",
    training: "NR-05 CIPA",
    company: "Padaria Pão Quente",
    date: "10/01/2026",
    instructor: "Maria Tec.",
    participantsLabel: "4",
    status: "Vencido",
  },
];

export default function Trainings() {
  const initialStatus = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("status")?.toLowerCase();

    if (!value) {
      return "all";
    }

    return ["all", "realizado", "agendado", "vencido", "vencendo"].includes(value)
      ? value
      : "all";
  }, []);

  const initialSearch = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("busca") ?? "";
  }, []);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter] = useState(initialStatus);

  const realizedThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const parseParticipants = (participantsLabel: string) => {
      const match = participantsLabel.match(/\d+/);
      return match ? Number(match[0]) : 0;
    };

    return trainingsData
      .filter((item) => {
        if (item.status !== "Realizado") {
          return false;
        }

        const [day, month, year] = item.date.split("/").map(Number);
        const trainingDate = new Date(year, month - 1, day);

        if (Number.isNaN(trainingDate.getTime())) {
          return false;
        }

        return trainingDate.getMonth() === currentMonth && trainingDate.getFullYear() === currentYear;
      })
      .reduce((total, item) => total + parseParticipants(item.participantsLabel), 0);
  }, []);

  const filteredTrainings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const trainingsByStatus = trainingsData.filter(
      (item) => statusFilter === "all" || item.status.toLowerCase() === statusFilter,
    );

    if (!term) {
      return trainingsByStatus;
    }

    const terms = term.split(/\s+/).filter(Boolean);

    return trainingsByStatus.filter((item) =>
      terms.every((token) =>
        [
          item.training,
          item.company,
          item.date,
          item.instructor,
          item.participantsLabel,
          item.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(token),
      ),
    );
  }, [searchTerm, statusFilter]);

  const statusClassName = (status: TrainingItem["status"]) => {
    if (status === "Realizado") {
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
    }

    if (status === "Agendado") {
      return "text-blue-600 border-blue-200";
    }

    if (status === "Vencendo") {
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
    }

    return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
  };

  const statusVariant = (status: TrainingItem["status"]) =>
    status === "Agendado" ? "outline" : status === "Vencido" ? "destructive" : "secondary";

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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Treinamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Treinamento</DialogTitle>
                <DialogDescription>
                  Cadastre as informações iniciais do treinamento.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Treinamento</Label>
                  <Input placeholder="Ex: NR-35 Trabalho em Altura" />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input placeholder="Ex: Metalúrgica Aço Forte" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Instrutor</Label>
                    <Input placeholder="Ex: João Dias" />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Training Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Link href="/treinamentos?status=realizado">
            <Card className="cursor-pointer hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Realizados (Mês)</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realizedThisMonth}</div>
              </CardContent>
            </Card>
          </Link>
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
              <Input
                type="search"
                placeholder="Buscar treinamentos..."
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
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
                {filteredTrainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum treinamento encontrado para a busca atual.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.training}</TableCell>
                      <TableCell>{training.company}</TableCell>
                      <TableCell>{training.date}</TableCell>
                      <TableCell>{training.instructor}</TableCell>
                      <TableCell>{training.participantsLabel}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(training.status)} className={statusClassName(training.status)}>
                          {training.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
