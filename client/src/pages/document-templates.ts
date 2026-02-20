import type { ComponentType } from "react";
import {
  FileText,
  Shield,
  ClipboardList,
  HardHat,
  ListChecks,
  AlertTriangle,
  MessageSquare,
  GraduationCap,
  Award,
  BriefcaseMedical,
  Ban,
} from "lucide-react";

export type SignatureStatus = "sim" | "ressalva" | "nao";

export type DocumentTemplate = {
  id: string;
  title: string;
  description: string;
  normativeBase: string;
  signatureStatus: SignatureStatus;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  canGenerate: boolean;
};

export type DocumentSection = {
  title: string;
  description: string;
  items: DocumentTemplate[];
};

export const documentSections: DocumentSection[] = [
  {
    title: "Obrigatórios GRO / NR-1",
    description: "Documentos-base de gestão de riscos que devem sustentar o ciclo do PGR.",
    items: [
      {
        id: "inventario-riscos-ocupacionais",
        title: "Inventário de Riscos Ocupacionais",
        description: "Levantamento de perigos, fontes e possíveis danos à saúde por atividade.",
        normativeBase: "NR-1 (GRO/PGR)",
        signatureStatus: "sim",
        icon: ListChecks,
        color: "text-blue-500",
        bg: "bg-blue-50",
        canGenerate: true,
      },
      {
        id: "plano-acao-pgr",
        title: "Plano de Ação do PGR",
        description: "Define responsáveis, prazos e controles para riscos priorizados.",
        normativeBase: "NR-1 (GRO/PGR)",
        signatureStatus: "sim",
        icon: ClipboardList,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        canGenerate: true,
      },
      {
        id: "ordem-servico-oss",
        title: "Ordem de Serviço de Segurança (OSS)",
        description: "Orientações formais de segurança por função e atividade.",
        normativeBase: "NR-1, item 1.4.1; CLT art. 157, inciso II",
        signatureStatus: "sim",
        icon: FileText,
        color: "text-indigo-500",
        bg: "bg-indigo-50",
        canGenerate: true,
      },
      {
        id: "registro-comunicacao-riscos",
        title: "Registro de Comunicação de Riscos",
        description: "Comprovação de que a organização comunicou riscos e medidas de controle.",
        normativeBase: "NR-1 (GRO)",
        signatureStatus: "sim",
        icon: MessageSquare,
        color: "text-sky-600",
        bg: "bg-sky-50",
        canGenerate: true,
      },
      {
        id: "relatorio-aat",
        title: "Relatório de Análise de Acidente e Doença (AAT)",
        description: "Investigação técnica de causas e ações corretivas após incidente/CAT.",
        normativeBase: "NR-1 (GRO), correlato à emissão de CAT",
        signatureStatus: "sim",
        icon: AlertTriangle,
        color: "text-rose-500",
        bg: "bg-rose-50",
        canGenerate: true,
      },
    ],
  },
  {
    title: "Operacionais e Gestão",
    description: "Documentos do dia a dia da consultoria para execução, evidência e capacitação.",
    items: [
      {
        id: "apr",
        title: "APR - Análise Preliminar de Risco",
        description: "Avaliação de riscos para atividades específicas e não rotineiras.",
        normativeBase: "NR 12, NR 18, NR 20, NR 33 e NR 35",
        signatureStatus: "sim",
        icon: Shield,
        color: "text-amber-500",
        bg: "bg-amber-50",
        canGenerate: true,
      },
      {
        id: "dds",
        title: "DDS - Diálogo Diário de Segurança",
        description: "Registro de orientação diária sobre riscos e comportamento seguro.",
        normativeBase: "NR-1, item 1.4.1 (comunicação de riscos)",
        signatureStatus: "sim",
        icon: MessageSquare,
        color: "text-lime-600",
        bg: "bg-lime-50",
        canGenerate: true,
      },
      {
        id: "parecer-tecnico",
        title: "Parecer Técnico de SST",
        description: "Manifestação técnica formal sobre conformidade, riscos e recomendações.",
        normativeBase: "Lei 7.410/1985 e NR-1",
        signatureStatus: "sim",
        icon: FileText,
        color: "text-violet-500",
        bg: "bg-violet-50",
        canGenerate: true,
      },
      {
        id: "matriz-treinamentos",
        title: "Matriz de Treinamentos",
        description: "Mapa de treinamentos obrigatórios por cargo/função.",
        normativeBase: "NR-1, item 1.7.1.1",
        signatureStatus: "sim",
        icon: GraduationCap,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        canGenerate: true,
      },
      {
        id: "certificados-treinamento",
        title: "Certificados de Treinamento",
        description: "Comprovação formal da capacitação com conteúdo, carga e assinaturas.",
        normativeBase: "NR-1, item 1.7.1.1 e NRs específicas",
        signatureStatus: "sim",
        icon: Award,
        color: "text-green-600",
        bg: "bg-green-50",
        canGenerate: true,
      },
      {
        id: "cat",
        title: "CAT - Comunicação de Acidente de Trabalho",
        description: "Comunicação legal de acidente/doença ocupacional dentro do prazo legal.",
        normativeBase: "Lei 8.213/1991, art. 22; Decreto 3.048/1999",
        signatureStatus: "ressalva",
        icon: BriefcaseMedical,
        color: "text-red-500",
        bg: "bg-red-50",
        canGenerate: true,
      },
      {
        id: "ficha-epi",
        title: "Ficha de EPI (NR-06)",
        description: "Registro de entrega e devolução de equipamentos de proteção individual.",
        normativeBase: "NR-06",
        signatureStatus: "sim",
        icon: HardHat,
        color: "text-teal-600",
        bg: "bg-teal-50",
        canGenerate: true,
      },
      {
        id: "pop",
        title: "POP - Procedimento Operacional",
        description: "Instruções passo a passo para execução segura de tarefas.",
        normativeBase: "Procedimento interno (apoio ao PGR)",
        signatureStatus: "sim",
        icon: ClipboardList,
        color: "text-purple-500",
        bg: "bg-purple-50",
        canGenerate: true,
      },
    ],
  },
  {
    title: "Não Emitidos Pelo TST (somente informativo)",
    description: "Documentos privativos de outros profissionais legalmente habilitados.",
    items: [
      {
        id: "laudo-insalubridade",
        title: "Laudo de Insalubridade",
        description: "Caracterização legal de insalubridade por profissional habilitado.",
        normativeBase: "NR-15 / Lei 8.213/1991, art. 58",
        signatureStatus: "nao",
        icon: Ban,
        color: "text-slate-600",
        bg: "bg-slate-100",
        canGenerate: false,
      },
      {
        id: "ltcat",
        title: "LTCAT",
        description: "Laudo técnico para fins previdenciários.",
        normativeBase: "Decreto 3.048/1999",
        signatureStatus: "nao",
        icon: Ban,
        color: "text-slate-600",
        bg: "bg-slate-100",
        canGenerate: false,
      },
      {
        id: "pcmso",
        title: "PCMSO",
        description: "Programa de controle médico e saúde ocupacional.",
        normativeBase: "NR-07",
        signatureStatus: "nao",
        icon: Ban,
        color: "text-slate-600",
        bg: "bg-slate-100",
        canGenerate: false,
      },
      {
        id: "pcmat-obras-grandes",
        title: "PCMAT (obras grandes)",
        description: "Programa para obras com exigência de responsável técnico específico.",
        normativeBase: "NR-18 e Nota Técnica 96/2009",
        signatureStatus: "nao",
        icon: Ban,
        color: "text-slate-600",
        bg: "bg-slate-100",
        canGenerate: false,
      },
    ],
  },
];

export const documentsById: Record<string, DocumentTemplate> = Object.fromEntries(
  documentSections.flatMap((section) => section.items.map((item) => [item.id, item])),
);

export function signatureLabel(status: SignatureStatus): string {
  if (status === "sim") {
    return "Sim";
  }
  if (status === "ressalva") {
    return "Sim, com ressalva";
  }
  return "Não";
}

export function signatureClassName(status: SignatureStatus): string {
  if (status === "sim") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
  }
  if (status === "ressalva") {
    return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100";
  }
  return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
}
