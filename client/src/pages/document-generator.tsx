import React, { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { documentsById, signatureClassName, signatureLabel } from "./document-templates";
import { generateDocumentPdf } from "@/lib/api";
import type { DocumentPdfPayload } from "@shared/schema";

type DocumentFormState = {
  companyName: string;
  cnpj: string;
  address: string;
  sector: string;
  objective: string;
  scope: string;
  technicalContent: string;
  recommendations: string;
  responsibleName: string;
  responsibleRegistry: string;
  companyRepresentative: string;
  issueDate: string;
};

const objectiveByDocumentId: Record<string, string> = {
  "inventario-riscos-ocupacionais": "Mapear perigos e riscos ocupacionais por setor, função e atividade.",
  "plano-acao-pgr": "Definir ações, responsáveis, prazos e controles para tratar riscos priorizados.",
  "ordem-servico-oss": "Instruir o trabalhador sobre riscos da função, EPI e condutas obrigatórias.",
  "registro-comunicacao-riscos": "Comprovar a comunicação de riscos e medidas de controle aos trabalhadores.",
  "relatorio-aat": "Investigar causas do evento e estabelecer ações corretivas e preventivas.",
  apr: "Avaliar riscos da atividade não rotineira antes da execução.",
  dds: "Registrar orientações de segurança e alinhamentos diários da equipe.",
  "parecer-tecnico": "Formalizar avaliação técnica sobre condições, conformidade e melhorias.",
  "matriz-treinamentos": "Definir treinamentos obrigatórios por cargo/funções expostas.",
  "certificados-treinamento": "Registrar conclusão da capacitação com conteúdo, carga e assinatura.",
  cat: "Comunicar acidente/doença ocupacional dentro do prazo legal.",
  "ficha-epi": "Controlar entrega, uso e devolução de EPI por trabalhador.",
  pop: "Padronizar a execução segura de tarefas operacionais.",
};

const contentChecklistByDocumentId: Record<string, string[]> = {
  "inventario-riscos-ocupacionais": [
    "Setor, função e atividade",
    "Perigos identificados",
    "Danos possíveis",
    "Controles existentes",
  ],
  "plano-acao-pgr": [
    "Ação corretiva/preventiva",
    "Responsável",
    "Prazo",
    "Indicador de acompanhamento",
  ],
  apr: [
    "Descrição da atividade",
    "Riscos por etapa",
    "Medidas de controle",
    "Permissões/condições de liberação",
  ],
  "ficha-epi": [
    "EPI entregue",
    "CA e quantidade",
    "Data de entrega/devolução",
    "Assinatura do trabalhador",
  ],
};

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DocumentGeneratorPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const docType = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("tipo")?.trim() ?? "";
  }, [search]);

  const selectedDocument = docType ? documentsById[docType] : undefined;
  const checklist = selectedDocument ? contentChecklistByDocumentId[selectedDocument.id] ?? [] : [];
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [form, setForm] = useState<DocumentFormState>({
    companyName: "",
    cnpj: "",
    address: "",
    sector: "",
    objective: selectedDocument ? objectiveByDocumentId[selectedDocument.id] ?? "" : "",
    scope: "",
    technicalContent: "",
    recommendations: "",
    responsibleName: "",
    responsibleRegistry: "",
    companyRepresentative: "",
    issueDate: getTodayIsoDate(),
  });

  const handleSaveDraft = () => {
    toast({
      title: "Rascunho salvo",
      description: "Os dados do documento foram mantidos nesta tela para continuidade.",
    });
  };

  const handleEmitDocument = async () => {
    const missing: string[] = [];
    if (!form.companyName.trim()) missing.push("Razão social");
    if (!form.objective.trim()) missing.push("Objetivo");
    if (!form.technicalContent.trim()) missing.push("Conteúdo técnico");
    if (!form.responsibleName.trim()) missing.push("Responsável técnico");
    if (!form.responsibleRegistry.trim()) missing.push("Registro profissional");

    if (missing.length > 0) {
      toast({
        title: "Preencha os campos obrigatorios",
        description: missing.join("; "),
      });
      return;
    }

    if (!selectedDocument) {
      return;
    }

    const payload: DocumentPdfPayload = {
      template_id: selectedDocument.id,
      template_title: selectedDocument.title,
      normative_base: selectedDocument.normativeBase,
      signature_status: selectedDocument.signatureStatus,
      company_name: form.companyName.trim(),
      cnpj: form.cnpj.trim() || null,
      address: form.address.trim() || null,
      sector: form.sector.trim() || null,
      objective: form.objective.trim(),
      scope: form.scope.trim() || null,
      technical_content: form.technicalContent.trim(),
      recommendations: form.recommendations.trim() || null,
      responsible_name: form.responsibleName.trim(),
      responsible_registry: form.responsibleRegistry.trim(),
      company_representative: form.companyRepresentative.trim() || null,
      issue_date: form.issueDate || null,
    };

    try {
      setIsGeneratingPdf(true);
      const { blob, filename } = await generateDocumentPdf(payload);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);

      toast({
        title: "PDF gerado com sucesso",
        description: `Download iniciado: ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível emitir o documento. Tente novamente.",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!selectedDocument || !selectedDocument.canGenerate) {
    return (
      <Layout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <h2 className="text-2xl font-bold tracking-tight">Geração de Documentos</h2>
          <Alert variant="destructive">
            <AlertTitle>Tipo de documento inválido</AlertTitle>
            <AlertDescription>
              Selecione um documento válido pela tela de Documentos para iniciar o preenchimento.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setLocation("/documentos")}>Voltar para Documentos</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Novo Documento</h2>
            <p className="text-muted-foreground">
              Fluxo guiado para emissão de <strong>{selectedDocument.title}</strong>, no estilo do Novo PGR.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={signatureClassName(selectedDocument.signatureStatus)}>
              Pode assinar: {signatureLabel(selectedDocument.signatureStatus)}
            </Badge>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Base normativa</CardTitle>
            <CardDescription>{selectedDocument.normativeBase}</CardDescription>
          </CardHeader>
          {checklist.length > 0 ? (
            <CardContent>
              <p className="text-sm font-medium mb-2">Checklist recomendado para este modelo</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {checklist.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>

        <Card className="shadow-lg border-muted">
          <CardContent className="p-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">1. Identificação da empresa</h3>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão social</Label>
                  <Input
                    placeholder="Ex: Metalurgica Exemplo Ltda"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    placeholder="Rua, numero, bairro, cidade, CEP"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setor / área</Label>
                  <Input
                    placeholder="Ex: Produção, manutenção, almoxarifado"
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data da emissão</Label>
                  <Input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">2. Conteúdo técnico</h3>
              <Separator />
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Textarea
                  rows={3}
                  placeholder="Descreva a finalidade principal do documento."
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Escopo</Label>
                <Textarea
                  rows={3}
                  placeholder="Defina limites de aplicação: setores, atividades, equipes e período."
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo técnico principal</Label>
                <Textarea
                  rows={8}
                  placeholder="Descreva perigos/riscos, procedimentos, controles, responsabilidades e evidencias."
                  value={form.technicalContent}
                  onChange={(e) => setForm({ ...form, technicalContent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Recomendações e plano de acompanhamento</Label>
                <Textarea
                  rows={4}
                  placeholder="Liste ações, prazos, responsáveis e critérios de verificação."
                  value={form.recommendations}
                  onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">3. Responsáveis e assinatura</h3>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável técnico (TST)</Label>
                  <Input
                    placeholder="Nome completo"
                    value={form.responsibleName}
                    onChange={(e) => setForm({ ...form, responsibleName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registro profissional</Label>
                  <Input
                    placeholder="Ex: 00.1234/SP"
                    value={form.responsibleRegistry}
                    onChange={(e) => setForm({ ...form, responsibleRegistry: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Representante da empresa</Label>
                  <Input
                    placeholder="Nome do representante para ciência/assinatura"
                    value={form.companyRepresentative}
                    onChange={(e) => setForm({ ...form, companyRepresentative: e.target.value })}
                  />
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setLocation("/documentos")}>
            Voltar para Documentos
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              Salvar rascunho
            </Button>
            <Button onClick={() => void handleEmitDocument()} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? "Gerando PDF..." : "Emitir documento"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
