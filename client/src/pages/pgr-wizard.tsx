import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Target, 
  AlertTriangle, 
  ClipboardList, 
  HardHat, 
  ChevronRight, 
  ChevronLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { riskTypes, calculateRiskLevel } from "@/lib/mock-data";

// Wizard Steps Configuration
const steps = [
  { id: 1, title: "Empresa", icon: Building2, description: "Identificação e dados básicos" },
  { id: 2, title: "Caracterização", icon: Target, description: "Setores e processos" },
  { id: 3, title: "Inventário", icon: AlertTriangle, description: "Levantamento de riscos" },
  { id: 4, title: "Plano de Ação", icon: ClipboardList, description: "Medidas de controle" },
  { id: 5, title: "Treinamentos", icon: HardHat, description: "Matriz de capacitação" },
];

export default function PGRWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Risk Inventory State
  const [risks, setRisks] = useState<any[]>([]);
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
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleAddRisk = () => {
    const prob = parseInt(newRisk.probabilidade);
    const grav = parseInt(newRisk.gravidade);
    const level = calculateRiskLevel(prob, grav);
    
    setRisks([...risks, { ...newRisk, id: Date.now(), level }]);
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
    });
  };

  const removeRisk = (id: number) => {
    setRisks(risks.filter(r => r.id !== id));
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Wizard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Novo PGR (NR-01)</h2>
            <p className="text-muted-foreground">
              Assistente de elaboração do Programa de Gerenciamento de Riscos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
            </Button>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="w-full bg-card border rounded-xl p-4 shadow-sm overflow-x-auto">
          <div className="flex justify-between min-w-[600px]">
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
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-background",
                    isActive ? "border-primary text-primary shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" : 
                    isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-sm font-semibold", isActive && "text-primary")}>{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden lg:block">{step.description}</p>
                  </div>
                  
                  {/* Connector Line */}
                  {step.id !== steps.length && (
                    <div className={cn(
                      "absolute top-5 left-[50%] w-full h-[2px] -z-0",
                      step.id < currentStep ? "bg-emerald-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content Area */}
        <div className="min-h-[400px]">
          <Card className="shadow-lg border-muted">
            <CardContent className="p-8">
              
              {/* STEP 1: Identification */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" /> Identificação da Empresa
                    </h3>
                    <Separator />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Razão Social</Label>
                      <Input placeholder="Ex: Metalúrgica Exemplo Ltda" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Fantasia</Label>
                      <Input placeholder="Ex: MetalEx" />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input placeholder="00.000.000/0001-00" />
                    </div>
                    <div className="space-y-2">
                      <Label>CNAE Principal</Label>
                      <Input placeholder="Ex: 25.11-0-00" />
                    </div>
                     <div className="space-y-2">
                      <Label>Grau de Risco (NR-04)</Label>
                      <Select>
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
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Endereço Completo</Label>
                    <Textarea placeholder="Rua, número, bairro, cidade, CEP..." />
                  </div>
                </div>
              )}

              {/* STEP 2: Characterization */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" /> Caracterização de Processos
                    </h3>
                    <Separator />
                  </div>
                  <div className="bg-muted/30 p-8 rounded-lg text-center">
                    <p className="text-muted-foreground">Funcionalidade de caracterização de setores e processos em desenvolvimento.</p>
                  </div>
                </div>
              )}

              {/* STEP 3: INVENTORY */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-primary" /> Inventário de Riscos
                      </h3>
                      <p className="text-sm text-muted-foreground">Adicione os riscos identificados por setor e função.</p>
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
                                onChange={(e) => setNewRisk({...newRisk, setor: e.target.value})}
                                placeholder="Ex: Produção" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Função</Label>
                              <Input 
                                value={newRisk.funcao} 
                                onChange={(e) => setNewRisk({...newRisk, funcao: e.target.value})}
                                placeholder="Ex: Soldador" 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Atividade</Label>
                            <Input 
                              value={newRisk.atividade} 
                              onChange={(e) => setNewRisk({...newRisk, atividade: e.target.value})}
                              placeholder="Descrição da atividade" 
                            />
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Tipo de Risco</Label>
                              <Select 
                                value={newRisk.tipo} 
                                onValueChange={(v) => setNewRisk({...newRisk, tipo: v})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {riskTypes.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label>Perigo / Fonte Geradora</Label>
                              <Input 
                                value={newRisk.perigo} 
                                onChange={(e) => setNewRisk({...newRisk, perigo: e.target.value})}
                                placeholder="Ex: Ruído contínuo / Máquina de solda" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Probabilidade (1-5)</Label>
                              <Select 
                                value={newRisk.probabilidade} 
                                onValueChange={(v) => setNewRisk({...newRisk, probabilidade: v})}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                onValueChange={(v) => setNewRisk({...newRisk, gravidade: v})}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                              const level = calculateRiskLevel(parseInt(newRisk.probabilidade), parseInt(newRisk.gravidade));
                              return (
                                <Badge className={cn("text-sm px-3 py-1", level.class)}>
                                  {level.score} - {level.label}
                                </Badge>
                              )
                            })()}
                          </div>

                          <div className="space-y-2">
                            <Label>Medidas de Controle</Label>
                            <Textarea 
                              value={newRisk.medidas} 
                              onChange={(e) => setNewRisk({...newRisk, medidas: e.target.value})}
                              placeholder="EPCs, Administrativas, EPIs..." 
                            />
                          </div>

                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
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
                        <p className="text-muted-foreground">Clique em "Adicionar Risco" para começar o inventário.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Setor / Função</TableHead>
                            <TableHead>Perigo / Fonte</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-center">Nível</TableHead>
                            <TableHead>Medidas de Controle</TableHead>
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
                              <TableCell>{risk.perigo}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={riskTypes.find((t: any) => t.id === risk.tipo)?.color}>
                                  {riskTypes.find((t: any) => t.id === risk.tipo)?.label}
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

              {/* Placeholder for other steps */}
              {currentStep > 3 && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" /> Etapa {currentStep}
                    </h3>
                    <Separator />
                  </div>
                  <div className="bg-muted/30 p-12 rounded-lg text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground">Esta etapa será implementada na próxima iteração.</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Footer Navigation */}
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
            Passo {currentStep} de {steps.length}
          </div>

          <Button 
            onClick={nextStep}
            className="w-32 shadow-lg shadow-primary/20"
          >
            {currentStep === steps.length ? "Finalizar" : "Próximo"} <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

      </div>
    </Layout>
  );
}
