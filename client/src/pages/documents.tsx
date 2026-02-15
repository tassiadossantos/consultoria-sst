import React from "react";
import { Layout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, FileCheck, ClipboardList, HardHat } from "lucide-react";

const documentTypes = [
  {
    title: "Ordem de Serviço (NR-01)",
    description: "Documento obrigatório que instrui sobre riscos e procedimentos.",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    title: "APR - Análise Preliminar",
    description: "Avaliação de riscos para atividades específicas não rotineiras.",
    icon: Shield,
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  {
    title: "Ficha de EPI (NR-06)",
    description: "Registro de entrega e devolução de equipamentos de proteção.",
    icon: HardHat,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  },
  {
    title: "POP - Procedimento Operacional",
    description: "Instruções passo a passo para execução segura de tarefas.",
    icon: ClipboardList,
    color: "text-purple-500",
    bg: "bg-purple-50"
  }
];

export default function Documents() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documentos Derivados</h2>
          <p className="text-muted-foreground">
            Emissão de documentos complementares ao PGR (NR-01).
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {documentTypes.map((doc) => (
            <Card key={doc.title} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className={`p-3 rounded-lg ${doc.bg}`}>
                  <doc.icon className={`w-6 h-6 ${doc.color}`} />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{doc.title}</CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-muted/20 rounded border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                  Preview do Modelo
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm">Configurar Modelo</Button>
                <Button size="sm">Emitir Novo</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
