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
import { fetchTrainings, createTrainingApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Training, TrainingStatus } from "@shared/schema";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Trainings() {
  const queryClient = useQueryClient();
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["trainings"],
    queryFn: fetchTrainings,
  });

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company_id: "",
    training_date: "",
    instructor: "",
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createTrainingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      setDialogOpen(false);
      setForm({ title: "", company_id: "", training_date: "", instructor: "" });
    },
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.training_date) return;
    await mutateAsync({
      title: form.title,
      training_date: form.training_date,
      instructor: form.instructor || null,
      company_id: form.company_id || null,
      status: "agendado",
    });
  };

  const realizedThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return trainings
      .filter((item) => {
        if (item.status !== "realizado") {
          return false;
        }

        const trainingDate = new Date(item.training_date);
        if (Number.isNaN(trainingDate.getTime())) {
          return false;
        }

        return trainingDate.getMonth() === currentMonth && trainingDate.getFullYear() === currentYear;
      })
      .reduce((total, item) => total + (item.participants_count ?? 0), 0);
  }, [trainings]);

  const scheduledCount = useMemo(
    () => trainings.filter((t) => t.status === "agendado").length,
    [trainings],
  );

  const expiredOrExpiringCount = useMemo(
    () => trainings.filter((t) => t.status === "vencido" || t.status === "vencendo").length,
    [trainings],
  );

  const filteredTrainings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const trainingsByStatus = trainings.filter(
      (item) => statusFilter === "all" || item.status === statusFilter,
    );

    if (!term) {
      return trainingsByStatus;
    }

    const terms = term.split(/\s+/).filter(Boolean);

    return trainingsByStatus.filter((item) =>
      terms.every((token) =>
        [
          item.title,
          item.training_date,
          item.instructor ?? "",
          item.participants_label ?? "",
          item.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(token),
      ),
    );
  }, [trainings, searchTerm, statusFilter]);

  const statusClassName = (status: TrainingStatus) => {
    if (status === "realizado") {
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
    }

    if (status === "agendado") {
      return "text-blue-600 border-blue-200";
    }

    if (status === "vencendo") {
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
    }

    return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
  };

  const statusVariant = (status: TrainingStatus) =>
    status === "agendado" ? "outline" : status === "vencido" ? "destructive" : "secondary";

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  <Input
                    placeholder="Ex: NR-35 Trabalho em Altura"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={form.training_date}
                      onChange={(e) => setForm({ ...form, training_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instrutor</Label>
                    <Input
                      placeholder="Ex: João Dias"
                      value={form.instructor}
                      onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
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
              <CardTitle className="text-sm font-medium">Total Treinamentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainings.length}</div>
            </CardContent>
          </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendados</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledCount}</div>
            </CardContent>
          </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos/À Vencer</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{expiredOrExpiringCount}</div>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Carregando treinamentos...
                    </TableCell>
                  </TableRow>
                ) : filteredTrainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum treinamento encontrado para a busca atual.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.title}</TableCell>
                      <TableCell>
                        {new Date(training.training_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{training.instructor ?? "-"}</TableCell>
                      <TableCell>{training.participants_label ?? training.participants_count ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(training.status)} className={statusClassName(training.status)}>
                          {capitalize(training.status)}
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
