import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Calendar, AlertTriangle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { fetchCompanies, fetchTrainings, createTrainingApi, fetchExpiringTrainings } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Training, TrainingStatus } from "@shared/schema";
import { addMonthsToIsoDate, trainingNormProfiles } from "@shared/trainingNormCatalog";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type TrainingNotesMetadata = {
  nrCode: string | null;
  workloadHours: number | null;
  completedAt: string | null;
  validityMonths: number | null;
};

function parseTrainingNotesMetadata(notes: string | null | undefined): TrainingNotesMetadata {
  if (!notes) {
    return {
      nrCode: null,
      workloadHours: null,
      completedAt: null,
      validityMonths: null,
    };
  }

  const nrMatch = /(?:^|\|)\s*NR:\s*(NR-\d{2})\s*(?:\||$)/i.exec(notes);
  const workloadMatch = /(?:^|\|)\s*Carga hor[aá]ria:\s*(\d+(?:[.,]\d+)?)h\s*(?:\||$)/i.exec(notes);
  const completedAtMatch = /(?:^|\|)\s*Data da realiza[cç][aã]o:\s*(\d{4}-\d{2}-\d{2})\s*(?:\||$)/i.exec(notes);
  const validityMatch = /(?:^|\|)\s*Validade:\s*(\d+)\s*mes(?:es)?\s*(?:\||$)/i.exec(notes);

  return {
    nrCode: nrMatch ? nrMatch[1].toUpperCase() : null,
    workloadHours: workloadMatch ? Number(workloadMatch[1].replace(",", ".")) : null,
    completedAt: completedAtMatch ? completedAtMatch[1] : null,
    validityMonths: validityMatch ? Number(validityMatch[1]) : null,
  };
}

function extractTrainingNrCodeFromTitle(title: string): string | null {
  const match = /^\s*(NR-\d{2})\b/i.exec(title);
  return match ? match[1].toUpperCase() : null;
}

function extractTrainingThemeFromTitle(title: string): string {
  const withoutPrefix = title.replace(/^\s*NR-\d{2}\s*[-–]?\s*/i, "").trim();
  return withoutPrefix || title;
}

function formatDatePtBr(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoDateMatch) {
    return `${isoDateMatch[3]}/${isoDateMatch[2]}/${isoDateMatch[1]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR");
}

function toSortableTimestamp(dateValue: string): number {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const timestamp = new Date(year, month - 1, day).getTime();
    return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
  }

  const timestamp = new Date(dateValue).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function parseParticipants(raw: string): string[] {
  return raw
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Trainings() {
  const queryClient = useQueryClient();
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["trainings"],
    queryFn: fetchTrainings,
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });
  const { data: expiringTrainingsData, isLoading: isLoadingExpiringTrainings } = useQuery({
    queryKey: ["trainings", "expiring", 7],
    queryFn: () => fetchExpiringTrainings(7),
  });

  const expiringTrainings = expiringTrainingsData?.items ?? [];

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
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    nr_code: "",
    title: "",
    company_id: "",
    completed_at: "",
    training_date: "",
    instructor: "",
    workload_hours: "",
    participants_raw: "",
  });

  const selectedNorm = useMemo(
    () => trainingNormProfiles.find((profile) => profile.code === form.nr_code) ?? null,
    [form.nr_code],
  );
  const participants = useMemo(() => parseParticipants(form.participants_raw), [form.participants_raw]);
  const computedDueDate = useMemo(() => {
    if (!selectedNorm || !form.completed_at) {
      return "";
    }
    return addMonthsToIsoDate(form.completed_at, selectedNorm.validityMonths);
  }, [form.completed_at, selectedNorm]);

  useEffect(() => {
    setForm((prev) =>
      prev.training_date === computedDueDate
        ? prev
        : { ...prev, training_date: computedDueDate },
    );
  }, [computedDueDate]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createTrainingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      setDialogOpen(false);
      setFormError("");
      setForm({
        nr_code: "",
        title: "",
        company_id: "",
        completed_at: "",
        training_date: "",
        instructor: "",
        workload_hours: "",
        participants_raw: "",
      });
    },
  });

  const handleSave = async () => {
    setFormError("");
    if (!selectedNorm) {
      setFormError("Selecione a norma regulamentadora do treinamento.");
      return;
    }
    if (!form.completed_at) {
      setFormError("Informe a data da realização.");
      return;
    }

    const workloadHours = Number(form.workload_hours);
    if (!Number.isFinite(workloadHours) || workloadHours < selectedNorm.minHours) {
      setFormError(`A carga horária deve ser de no mínimo ${selectedNorm.minHours}h para ${selectedNorm.code}.`);
      return;
    }
    if (!computedDueDate) {
      setFormError("Não foi possível calcular a data de vencimento.");
      return;
    }
    if (participants.length === 0) {
      setFormError("Informe os participantes (um por linha ou separados por vírgula).");
      return;
    }

    const trainingLabel = form.title.trim()
      ? `${selectedNorm.code} - ${form.title.trim()}`
      : `${selectedNorm.code} ${selectedNorm.label}`;

    const notes = [
      `NR: ${selectedNorm.code}`,
      `Carga horária: ${workloadHours}h`,
      `Data da realização: ${form.completed_at}`,
      `Validade: ${selectedNorm.validityMonths} meses`,
    ].join(" | ");

    await mutateAsync({
      title: trainingLabel,
      training_date: computedDueDate,
      instructor: form.instructor || null,
      company_id: form.company_id || null,
      participants_count: participants.length,
      participants_label: participants.join(", "),
      notes,
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

  const expiredByStatusCount = useMemo(
    () => trainings.filter((t) => t.status === "vencido").length,
    [trainings],
  );
  const expiredOrExpiringCount = expiredByStatusCount + expiringTrainings.length;

  const filteredTrainings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const trainingsByStatus =
      statusFilter === "vencendo"
        ? expiringTrainings
        : trainings.filter((item) => statusFilter === "all" || item.status === statusFilter);

    const base =
      !term
        ? trainingsByStatus
        : trainingsByStatus.filter((item) =>
            term
              .split(/\s+/)
              .filter(Boolean)
              .every((token) =>
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

    return [...base].sort((a, b) => {
      const byDate = toSortableTimestamp(a.training_date) - toSortableTimestamp(b.training_date);
      if (byDate !== 0) {
        return byDate;
      }

      return a.title.localeCompare(b.title, "pt-BR");
    });
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

  const isLoadingTable = isLoading || (statusFilter === "vencendo" && isLoadingExpiringTrainings);
  const hasActiveFilters = Boolean(searchTerm.trim()) || statusFilter !== "all";

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
                  Cadastre por NR com carga horária mínima, participantes e vencimento automático.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="training_nr">Norma (NR)</Label>
                    <select
                      id="training_nr"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.nr_code}
                      onChange={(event) => setForm({ ...form, nr_code: event.target.value })}
                    >
                      <option value="">Selecione uma NR</option>
                      {trainingNormProfiles.map((profile) => (
                        <option key={profile.code} value={profile.code}>
                          {profile.code} - {profile.label}
                        </option>
                      ))}
                    </select>
                    {selectedNorm ? (
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {selectedNorm.minHours}h | Validade: {selectedNorm.validityMonths} meses
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="training_workload">Carga horária (h)</Label>
                    <Input
                      id="training_workload"
                      type="number"
                      min={selectedNorm?.minHours ?? 1}
                      placeholder="Ex: 8"
                      value={form.workload_hours}
                      onChange={(e) => setForm({ ...form, workload_hours: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_topic">Tema do treinamento</Label>
                  <Input
                    id="training_topic"
                    placeholder="Ex: Reciclagem para equipe de manutenção"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="training_company">Empresa (opcional)</Label>
                    <select
                      id="training_company"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.company_id}
                      onChange={(event) => setForm({ ...form, company_id: event.target.value })}
                    >
                      <option value="">Sem vínculo</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="training_instructor">Instrutor</Label>
                    <Input
                      id="training_instructor"
                      placeholder="Ex: Tassia dos Santos Silva"
                      value={form.instructor}
                      onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="training_completed_at">Data da realização</Label>
                    <Input
                      id="training_completed_at"
                      type="date"
                      value={form.completed_at}
                      onChange={(e) => setForm({ ...form, completed_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="training_due_date">Vencimento (automático)</Label>
                    <Input
                      id="training_due_date"
                      type="date"
                      value={computedDueDate}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_participants">Participantes (estruturado)</Label>
                  <Textarea
                    id="training_participants"
                    rows={4}
                    placeholder="Um participante por linha (ou separados por vírgula)"
                    value={form.participants_raw}
                    onChange={(e) => setForm({ ...form, participants_raw: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {participants.length} participante(s) identificado(s).
                  </p>
                </div>
                {formError ? (
                  <p className="text-sm text-destructive">{formError}</p>
                ) : null}
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
                  <TableHead>NR</TableHead>
                  <TableHead>Treinamento</TableHead>
                  <TableHead>Data da realização</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Carga/Validade</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTable ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Carregando treinamentos...
                    </TableCell>
                  </TableRow>
                ) : filteredTrainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {trainings.length === 0
                        ? "Nenhum treinamento cadastrado ainda. Clique em \"Novo Treinamento\"."
                        : hasActiveFilters
                        ? "Nenhum treinamento encontrado para os filtros atuais."
                        : "Nenhum treinamento disponível no momento."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainings.map((training) => {
                    const displayStatus: TrainingStatus =
                      statusFilter === "vencendo" ? "vencendo" : training.status;
                    const metadata = parseTrainingNotesMetadata(training.notes);
                    const nrCode = metadata.nrCode ?? extractTrainingNrCodeFromTitle(training.title);
                    const trainingTheme = extractTrainingThemeFromTitle(training.title);
                    const nrProfile = nrCode
                      ? trainingNormProfiles.find((profile) => profile.code === nrCode)
                      : null;
                    const showNormLabel = Boolean(
                      nrProfile && nrProfile.label.toLowerCase() !== trainingTheme.toLowerCase(),
                    );

                    return (
                    <TableRow key={training.id}>
                      <TableCell>
                        {nrCode ? (
                          <Badge variant="outline">{nrCode}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {trainingTheme}
                        {showNormLabel && nrProfile ? (
                          <p className="text-xs text-muted-foreground">{nrProfile.label}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDatePtBr(metadata.completedAt)}</TableCell>
                      <TableCell>
                        {formatDatePtBr(training.training_date)}
                      </TableCell>
                      <TableCell>
                        {metadata.workloadHours && metadata.validityMonths
                          ? `${metadata.workloadHours}h / ${metadata.validityMonths}m`
                          : "-"}
                      </TableCell>
                      <TableCell>{training.instructor ?? "-"}</TableCell>
                      <TableCell>{training.participants_label ?? training.participants_count ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(displayStatus)} className={statusClassName(displayStatus)}>
                          {capitalize(displayStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
