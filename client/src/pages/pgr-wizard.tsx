import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Building2,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  Target,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { riskTypes, calculateRiskLevel } from "@/lib/mock-data";
import { createPgr, getPgrDetail, updatePgr } from "@/lib/pgr";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";

type RiskItem = {
  id: string;
  setor: string;
  funcao: string;
  atividade: string;
  perigo: string;
  risco: string;
  tipo: string;
  probabilidade: string;
  gravidade: string;
  medidas: string;
  epi: string;
  level: { label: string; class: string; score: number };
};

type ActionItem = {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  status: string;
};

const steps = [
  { id: 1, title: "Empresa", icon: Building2, description: "Dados e objetivo" },
  { id: 2, title: "Perigos", icon: AlertTriangle, description: "Inventário de riscos" },
  { id: 3, title: "Avaliação", icon: Target, description: "Classificação e critério" },
  { id: 4, title: "Controle", icon: ShieldCheck, description: "Prevenção e treinamento" },
  { id: 5, title: "Plano", icon: ClipboardList, description: "Plano de ação" },
  { id: 6, title: "Monitor", icon: Activity, description: "Revisão e assinatura" },
];

export default function PGRWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [editMatch, editParams] = useRoute("/pgr/:id/editar");
  const editId = editParams?.id;
  const isEditing = Boolean(editMatch && editId);
  const { toast } = useToast();
  const supabaseReady = isSupabaseConfigured();
  const [hydrated, setHydrated] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);

  const [company, setCompany] = useState({
    name: "",
    trade_name: "",
    cnpj: "",
    cnae: "",
    address: "",
    employees: "",
    risk_level: "",
    legal_responsible: "",
  });

  const [objective, setObjective] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [characterization, setCharacterization] = useState("");
  const [riskCriteria, setRiskCriteria] = useState("");
  const [controlMeasures, setControlMeasures] = useState("");
  const [trainingPlan, setTrainingPlan] = useState("");
  const [monitoring, setMonitoring] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [responsible, setResponsible] = useState({ name: "", registry: "" });

  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [newRisk, setNewRisk] = useState({
    setor: "",
    funcao: "",
    atividade: "",
    perigo: "",
    risco: "",
    tipo: "fisico",
    probabilidade: "1",
    gravidade: "1",
    medidas: "",
    epi: "",
  });

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [newAction, setNewAction] = useState({
    action: "",
    owner: "",
    dueDate: "",
    status: "PENDENTE",
  });

  const progress = useMemo(() => {
    const completed = [
      Boolean(company.name && company.cnpj),
      risks.length > 0,
      Boolean(riskCriteria.trim()),
      Boolean(controlMeasures.trim()),
      actions.length > 0,
      Boolean(monitoring.trim()),
    ].filter(Boolean).length;

    return Math.round((completed / steps.length) * 100);
  }, [company, risks.length, riskCriteria, controlMeasures, actions.length, monitoring]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createPgr,
  });
  const { mutateAsync: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: updatePgr,
  });

  const { data: editData, isLoading: isLoadingEdit, isError: isErrorEdit } = useQuery({
    queryKey: ["pgr-edit", editId],
    queryFn: () => getPgrDetail(editId ?? ""),
    enabled: supabaseReady && isEditing,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleAddRisk = () => {
    const prob = parseInt(newRisk.probabilidade, 10);
    const grav = parseInt(newRisk.gravidade, 10);
    const level = calculateRiskLevel(prob, grav);

    setRisks((prev) => [
      ...prev,
      { ...newRisk, id: String(Date.now()), level },
    ]);
    setDialogOpen(false);
    setNewRisk({
      setor: "",
      funcao: "",
      atividade: "",
      perigo: "",
      risco: "",
      tipo: "fisico",
      probabilidade: "1",
      gravidade: "1",
      medidas: "",
      epi: "",
    });
  };

  const removeRisk = (id: string) => {
    setRisks((prev) => prev.filter((risk) => risk.id !== id));
  };

  const handleAddAction = () => {
    if (!newAction.action.trim()) {
      return;
    }

    setActions((prev) => [
      ...prev,
      { ...newAction, id: String(Date.now()) },
    ]);
    setNewAction({ action: "", owner: "", dueDate: "", status: "PENDENTE" });
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((action) => action.id !== id));
  };

  useEffect(() => {
    if (!editData || hydrated) {
      return;
    }

    const { pgr, company: editCompany, risks: editRisks, actions: editActions } = editData;

    setCompany({
      name: editCompany?.name ?? "",
      trade_name: editCompany?.trade_name ?? "",
      cnpj: editCompany?.cnpj ?? "",
      cnae: editCompany?.cnae ?? "",
      address: editCompany?.address ?? "",
      employees: editCompany?.employees?.toString() ?? "",
      risk_level: editCompany?.risk_level?.toString() ?? "",
      legal_responsible: editCompany?.legal_responsible ?? "",
    });

    const rawCharacterization = pgr.characterization ?? "";
    const objectiveMatch = rawCharacterization.startsWith("Objetivo:")
      ? rawCharacterization.split("\n\n")
      : null;
    setObjective(objectiveMatch ? objectiveMatch[0].replace("Objetivo:", "").trim() : "");
    setCharacterization(objectiveMatch ? objectiveMatch.slice(1).join("\n\n") : rawCharacterization);

    setResponsibilities(pgr.responsibilities ?? "");
    setRiskCriteria(pgr.risk_criteria ?? "");
    setControlMeasures(pgr.control_measures ?? "");
    setTrainingPlan(pgr.training_plan ?? "");
    setMonitoring(pgr.monitoring ?? "");
    setValidUntil(pgr.valid_until ?? "");
    setResponsible({
      name: pgr.responsible_name ?? "",
      registry: pgr.responsible_registry ?? "",
    });

    setRisks(
      editRisks.map((risk) => ({
        id: risk.id,
        setor: risk.sector ?? "",
        funcao: risk.role ?? "",
        atividade: risk.activity ?? "",
        perigo: risk.hazard ?? "",
        risco: risk.risk ?? "",
        tipo: risk.risk_type ?? "fisico",
        probabilidade: risk.probability?.toString() ?? "1",
        gravidade: risk.severity?.toString() ?? "1",
        medidas: risk.controls ?? "",
        epi: risk.epi ?? "",
        level: calculateRiskLevel(risk.probability ?? 1, risk.severity ?? 1),
      }))
    );

    setActions(
      editActions.map((action) => ({
        id: action.id,
        action: action.action ?? "",
        owner: action.owner ?? "",
        dueDate: action.due_date ?? "",
        status: action.status ?? "PENDENTE",
      }))
    );

    setEditCompanyId(editCompany?.id ?? null);
    setHydrated(true);
  }, [editData, hydrated]);

  const handleSave = async (status: "draft" | "active") => {
    if (!supabaseReady) {
      toast({
        title: "Supabase não configurado",
        description: "Preencha o .env para salvar o PGR.",
      });
      return;
    }

    if (status === "active") {
      const missing: string[] = [];
      if (!company.name.trim()) missing.push("Razao Social");
      if (!company.cnpj.trim()) missing.push("CNPJ");
      if (risks.length === 0) missing.push("Inventário de riscos");
      if (!riskCriteria.trim()) missing.push("Critérios de avaliação");
      if (!controlMeasures.trim()) missing.push("Medidas de controle");
      if (actions.length === 0) missing.push("Plano de ação");
      if (!monitoring.trim()) missing.push("Monitoramento e revisão");
      if (!responsible.name.trim()) missing.push("Responsável técnico");
      if (!responsible.registry.trim()) missing.push("Registro profissional");

      if (missing.length > 0) {
        toast({
          title: "Preencha os campos obrigatorios",
          description: missing.join("; "),
        });
        return;
      }
    }

    try {
      const payload = {
        company: {
          name: company.name,
          trade_name: company.trade_name || null,
          cnpj: company.cnpj || null,
          cnae: company.cnae || null,
          address: company.address || null,
          employees: company.employees ? Number(company.employees) : null,
          risk_level: company.risk_level ? Number(company.risk_level) : null,
          legal_responsible: company.legal_responsible || null,
        },
        pgr: {
          status,
          revision: 0,
          valid_until: validUntil || null,
          characterization: `${objective ? `Objetivo: ${objective}\n\n` : ""}${characterization}`.trim() || null,
          responsibilities: responsibilities || null,
          risk_criteria: riskCriteria || null,
          control_measures: controlMeasures || null,
          training_plan: trainingPlan || null,
          monitoring: monitoring || null,
          responsible_name: responsible.name || null,
          responsible_registry: responsible.registry || null,
          progress,
        },
        risks: risks.map((risk) => ({
          sector: risk.setor || null,
          role: risk.funcao || null,
          activity: risk.atividade || null,
          hazard: risk.perigo || null,
          risk: risk.risco || null,
          risk_type: risk.tipo || null,
          probability: Number(risk.probabilidade),
          severity: Number(risk.gravidade),
          risk_score: risk.level.score,
          risk_level: risk.level.label,
          controls: risk.medidas || null,
          epi: risk.epi || null,
        })),
        actions: actions.map((action) => ({
          action: action.action || null,
          owner: action.owner || null,
          due_date: action.dueDate || null,
          status: action.status || null,
        })),
      };

      if (isEditing && editId && !editCompanyId) {
        toast({
          title: "Empresa não encontrada",
          description: "Não foi possível identificar a empresa vinculada ao PGR.",
        });
        return;
      }

      const pgrId = isEditing && editId && editCompanyId
        ? await mutateUpdate({ ...payload, pgrId: editId, companyId: editCompanyId })
        : await mutateAsync(payload);

      toast({
        title: status === "draft" ? "Rascunho salvo" : isEditing ? "PGR atualizado" : "PGR criado",
        description:
          status === "draft"
            ? "O PGR foi salvo como rascunho."
            : isEditing
            ? "As alteracoes foram salvas."
            : "O PGR foi finalizado com sucesso.",
      });

      if (status === "draft") {
        setLocation("/pgr");
      } else {
        setLocation(`/pgr/${pgrId}/preview`);
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o PGR. Verifique os dados e tente novamente.",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar PGR (NR-01)" : "Novo PGR (NR-01)"}</h2>
            <p className="text-muted-foreground">
              Programa de Gerenciamento de Riscos com estrutura completa e pronta para eSocial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={isPending || isUpdating}>
              <Save className="w-4 h-4 mr-2" /> {isEditing ? "Salvar Alteracoes" : "Salvar Rascunho"}
            </Button>
          </div>
        </div>

        {!supabaseReady && (
          <Alert>
            <AlertTitle>Supabase não configurado</AlertTitle>
            <AlertDescription>
              Preencha o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar.
            </AlertDescription>
          </Alert>
        )}

        {isEditing && isLoadingEdit && (
          <div className="text-sm text-muted-foreground">Carregando PGR...</div>
        )}

        {isEditing && isErrorEdit && (
          <Alert variant="destructive">
            <AlertTitle>Falha ao carregar PGR</AlertTitle>
            <AlertDescription>Verifique a conexão com o Supabase e tente novamente.</AlertDescription>
          </Alert>
        )}

        <div className="w-full bg-card border rounded-xl p-4 shadow-sm overflow-x-auto">
          <div className="flex justify-between min-w-[700px]">
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1 relative group cursor-pointer",
                    isActive ? "opacity-100" : "opacity-60 hover:opacity-80"
                  )}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-background",
                      isActive
                        ? "border-primary text-primary shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                        : isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-sm font-semibold", isActive && "text-primary")}>{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden lg:block">{step.description}</p>
                  </div>

                  {step.id !== steps.length && (
                    <div
                      className={cn(
                        "absolute top-5 left-[50%] w-full h-[2px] -z-0",
                        step.id < currentStep ? "bg-emerald-500" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-[420px]">
          <Card className="shadow-lg border-muted">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" /> Caracterização da Empresa
                    </h3>
                    <Separator />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Razão Social</Label>
                      <Input
                        value={company.name}
                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                        placeholder="Ex: Metalúrgica Exemplo Ltda"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Fantasia</Label>
                      <Input
                        value={company.trade_name}
                        onChange={(e) => setCompany({ ...company, trade_name: e.target.value })}
                        placeholder="Ex: MetalEx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        value={company.cnpj}
                        onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNAE Principal</Label>
                      <Input
                        value={company.cnae}
                        onChange={(e) => setCompany({ ...company, cnae: e.target.value })}
                        placeholder="Ex: 25.11-0-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grau de Risco (NR-04)</Label>
                      <Select value={company.risk_level} onValueChange={(v) => setCompany({ ...company, risk_level: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Grau 1</SelectItem>
                          <SelectItem value="2">Grau 2</SelectItem>
                          <SelectItem value="3">Grau 3</SelectItem>
                          <SelectItem value="4">Grau 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número de Funcionários</Label>
                      <Input
                        type="number"
                        value={company.employees}
                        onChange={(e) => setCompany({ ...company, employees: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Responsável Legal</Label>
                      <Input
                        value={company.legal_responsible}
                        onChange={(e) => setCompany({ ...company, legal_responsible: e.target.value })}
                        placeholder="Nome do responsável legal"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Endereço Completo</Label>
                    <Textarea
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                      placeholder="Rua, numero, bairro, cidade, CEP..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Objetivo do PGR</Label>
                    <Textarea
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Identificar perigos, avaliar riscos e implementar medidas de controle conforme NR-01."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Responsabilidades</Label>
                    <Textarea
                      value={responsibilities}
                      onChange={(e) => setResponsibilities(e.target.value)}
                      placeholder="Empregador: implementar medidas, fornecer EPI, treinar. Trabalhadores: seguir procedimentos e reportar riscos. Responsável Técnico: elaborar e revisar o PGR."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Caracterização de Atividades e Processos</Label>
                    <Textarea
                      value={characterization}
                      onChange={(e) => setCharacterization(e.target.value)}
                      placeholder="Descreva setores, processos, atividades críticas e quantidade de pessoas expostas."
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-primary" /> Identificação de Perigos
                      </h3>
                      <p className="text-sm text-muted-foreground">Adicione os riscos por setor, função e atividade.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" /> Adicionar Risco
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Novo Registro de Risco</DialogTitle>
                          <DialogDescription>Preencha os dados para adicionar ao inventário.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Setor</Label>
                              <Input
                                value={newRisk.setor}
                                onChange={(e) => setNewRisk({ ...newRisk, setor: e.target.value })}
                                placeholder="Ex: Produção"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Função</Label>
                              <Input
                                value={newRisk.funcao}
                                onChange={(e) => setNewRisk({ ...newRisk, funcao: e.target.value })}
                                placeholder="Ex: Soldador"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Atividade</Label>
                            <Input
                              value={newRisk.atividade}
                              onChange={(e) => setNewRisk({ ...newRisk, atividade: e.target.value })}
                              placeholder="Descrição da atividade"
                            />
                          </div>

                          <Separator className="my-2" />

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Tipo de Risco</Label>
                              <Select
                                value={newRisk.tipo}
                                onValueChange={(v) => setNewRisk({ ...newRisk, tipo: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {riskTypes.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label>Perigo / Fonte Geradora</Label>
                              <Input
                                value={newRisk.perigo}
                                onChange={(e) => setNewRisk({ ...newRisk, perigo: e.target.value })}
                                placeholder="Ex: Ruído contínuo / Máquina"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Probabilidade (1-5)</Label>
                              <Select
                                value={newRisk.probabilidade}
                                onValueChange={(v) => setNewRisk({ ...newRisk, probabilidade: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 - Rara</SelectItem>
                                  <SelectItem value="2">2 - Remota</SelectItem>
                                  <SelectItem value="3">3 - Possível</SelectItem>
                                  <SelectItem value="4">4 - Provável</SelectItem>
                                  <SelectItem value="5">5 - Frequente</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Gravidade (1-5)</Label>
                              <Select
                                value={newRisk.gravidade}
                                onValueChange={(v) => setNewRisk({ ...newRisk, gravidade: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 - Leve</SelectItem>
                                  <SelectItem value="2">2 - Moderada</SelectItem>
                                  <SelectItem value="3">3 - Séria</SelectItem>
                                  <SelectItem value="4">4 - Crítica</SelectItem>
                                  <SelectItem value="5">5 - Catastrófica</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="bg-muted p-4 rounded-md flex justify-between items-center">
                            <span className="font-medium">Nível de Risco Calculado:</span>
                            {(() => {
                              const level = calculateRiskLevel(
                                parseInt(newRisk.probabilidade, 10),
                                parseInt(newRisk.gravidade, 10)
                              );
                              return (
                                <Badge className={cn("text-sm px-3 py-1", level.class)}>
                                  {level.score} - {level.label}
                                </Badge>
                              );
                            })()}
                          </div>

                          <div className="space-y-2">
                            <Label>Medidas de Controle</Label>
                            <Textarea
                              value={newRisk.medidas}
                              onChange={(e) => setNewRisk({ ...newRisk, medidas: e.target.value })}
                              placeholder="EPCs, administrativas, EPIs..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>EPI obrigatório</Label>
                            <Input
                              value={newRisk.epi}
                              onChange={(e) => setNewRisk({ ...newRisk, epi: e.target.value })}
                              placeholder="Ex: Protetor auricular, luvas, máscara"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddRisk}>Salvar Risco</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Separator />

                  {risks.length === 0 ? (
                    <div className="bg-muted/30 border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">Nenhum risco cadastrado</h4>
                        <p className="text-muted-foreground">Clique em "Adicionar Risco" para iniciar.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Setor / Função</TableHead>
                            <TableHead>Perigo / Risco</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-center">Nível</TableHead>
                            <TableHead>Medidas</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {risks.map((risk) => (
                            <TableRow key={risk.id}>
                              <TableCell>
                                <div className="font-medium">{risk.setor}</div>
                                <div className="text-xs text-muted-foreground">{risk.funcao}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{risk.perigo}</div>
                                <div className="text-xs text-muted-foreground">{risk.risco}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={riskTypes.find((t) => t.id === risk.tipo)?.color}>
                                  {riskTypes.find((t) => t.id === risk.tipo)?.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Badge className={cn("w-20 justify-center", risk.level.class)}>
                                    {risk.level.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">Score: {risk.level.score}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={risk.medidas}>
                                {risk.medidas}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => removeRisk(risk.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" /> Avaliação e Classificação
                    </h3>
                    <Separator />
                  </div>
                  <div className="space-y-2">
                    <Label>Critérios de Avaliação</Label>
                    <Textarea
                      value={riskCriteria}
                      onChange={(e) => setRiskCriteria(e.target.value)}
                      placeholder="Defina probabilidade, gravidade e matriz de risco utilizada."
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Utilize a legenda de risco baixo (1-6), médio (7-15) e alto (16-25) para orientar prioridades.
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" /> Medidas de Prevenção e Controle
                    </h3>
                    <Separator />
                  </div>
                  <div className="space-y-2">
                    <Label>Medidas Coletivas, Administrativas e EPI</Label>
                    <Textarea
                      value={controlMeasures}
                      onChange={(e) => setControlMeasures(e.target.value)}
                      placeholder="Descreva medidas coletivas, administrativas, EPIs e procedimentos.
Ex: EPCs instalados, treinamentos obrigatórios, checklists, bloqueios." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Treinamentos e Capacitações</Label>
                    <Textarea
                      value={trainingPlan}
                      onChange={(e) => setTrainingPlan(e.target.value)}
                      placeholder="Liste treinamentos obrigatórios (NR-10, NR-35, CIPA, integração, EPI)."
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary" /> Plano de Ação
                    </h3>
                    <Separator />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Ação</Label>
                      <Input
                        value={newAction.action}
                        onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                        placeholder="Ex: Instalar exaustores"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Input
                        value={newAction.owner}
                        onChange={(e) => setNewAction({ ...newAction, owner: e.target.value })}
                        placeholder="Ex: Eng. Manutenção"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo</Label>
                      <Input
                        type="date"
                        value={newAction.dueDate}
                        onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newAction.status} onValueChange={(v) => setNewAction({ ...newAction, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                          <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-4">
                      <Button onClick={handleAddAction}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Ação
                      </Button>
                    </div>
                  </div>

                  {actions.length === 0 ? (
                    <div className="bg-muted/30 border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">Nenhuma ação cadastrada</h4>
                        <p className="text-muted-foreground">Adicione itens ao plano de ação.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Ação</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {actions.map((action) => (
                            <TableRow key={action.id}>
                              <TableCell>{action.action}</TableCell>
                              <TableCell>{action.owner}</TableCell>
                              <TableCell>{action.dueDate || "-"}</TableCell>
                              <TableCell>{action.status}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => removeAction(action.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Monitoramento e Revisão
                    </h3>
                    <Separator />
                  </div>
                  <div className="space-y-2">
                    <Label>Monitoramento e Revisão</Label>
                    <Textarea
                      value={monitoring}
                      onChange={(e) => setMonitoring(e.target.value)}
                      placeholder="Revisão anual obrigatória, revisão imediata em caso de acidentes ou mudanças no processo."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Vigência (validade)</Label>
                      <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Responsável Técnico</Label>
                      <Input
                        value={responsible.name}
                        onChange={(e) => setResponsible({ ...responsible, name: e.target.value })}
                        placeholder="Nome do Técnico de Segurança"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Registro Profissional (MTE)</Label>
                      <Input
                        value={responsible.registry}
                        onChange={(e) => setResponsible({ ...responsible, registry: e.target.value })}
                        placeholder="Ex: 00.1234/SP"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-between items-center z-10 md:pl-72 pl-4 transition-all">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="w-32"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>

          <div className="text-sm font-medium text-muted-foreground">
            Passo {currentStep} de {steps.length} • Progresso {progress}%
          </div>

          <Button
            onClick={() => (currentStep === steps.length ? handleSave("active") : nextStep())}
            className="w-32 shadow-lg shadow-primary/20"
            disabled={isPending || isUpdating}
          >
            {currentStep === steps.length ? (isEditing ? "Atualizar" : "Finalizar") : "Próximo"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
