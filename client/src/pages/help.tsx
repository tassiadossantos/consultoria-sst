import { useMemo } from "react";
import { Link, useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  GUIDE_AUTONOMY_ROWS,
  GUIDE_DOCUMENT_SECTIONS,
  GUIDE_HEADER,
  GUIDE_INTRO,
  GUIDE_KEY_PRINCIPLES,
  GUIDE_METADATA,
  GUIDE_TRAINING_CONTEXT,
  GUIDE_TRAINING_SECTIONS,
} from "./help-guide-tst-content";

type HelpTopic = "onboarding" | "faq" | "guia-tst";

type HelpChecklistItem = {
  id: string;
  title: string;
  description: string;
  href: string;
};

type HelpFaqItem = {
  id: string;
  module: string;
  question: string;
  answer?: string;
  formattedAnswer?: Array<{
    label: string;
    text: string;
  }>;
};

const CHECKLIST_ITEMS: HelpChecklistItem[] = [
  {
    id: "onboarding-empresas",
    title: "Cadastrar empresa",
    description: "Registre os dados da empresa para vincular PGRs e treinamentos.",
    href: "/empresas",
  },
  {
    id: "onboarding-pgr",
    title: "Criar PGR",
    description: "Inicie um PGR e avance pelos blocos até gerar a versão final.",
    href: "/pgr/novo",
  },
  {
    id: "onboarding-treinamentos",
    title: "Cadastrar treinamento",
    description: "Inclua data, instrutor e participantes para controle operacional.",
    href: "/treinamentos",
  },
  {
    id: "onboarding-vencimentos",
    title: "Validar vencimentos",
    description: "Confira os treinamentos a vencer nos próximos 7 dias.",
    href: "/treinamentos?status=vencendo",
  },
  {
    id: "onboarding-configuracoes",
    title: "Revisar configurações",
    description: "Defina regras de alerta e informações administrativas.",
    href: "/configuracoes",
  },
];

const FAQ_ITEMS: HelpFaqItem[] = [
  {
    id: "faq-dashboard",
    module: "Dashboard",
    question: "O card mostra alerta, mas a lista não bate. O que fazer?",
    answer:
      "Use o atalho para a página de Treinamentos com o filtro de vencendo. O cálculo é feito pelo backend com janela de 7 dias para manter consistência com o Dashboard.",
  },
  {
    id: "faq-pgr",
    module: "PGR",
    question: "Quando devo editar um PGR existente ou criar um novo?",
    answer:
      "Edite quando for ajuste incremental da mesma revisão. Crie novo quando houver mudança estrutural relevante ou necessidade de nova vigência formal.",
  },
  {
    id: "faq-treinamentos",
    module: "Treinamentos",
    question: "Como identificar rapidamente quem está vencendo esta semana?",
    answer:
      "Abra Treinamentos com status vencendo. A lista considera datas no horizonte de 7 dias e prioriza a mesma regra do painel inicial.",
  },
  {
    id: "faq-configuracoes",
    module: "Configurações",
    question: "Qual configuração impacta os alertas do sistema?",
    answer:
      "A seção de alertas define janela e comportamento padrão. Revise essa configuração sempre que o processo interno da consultoria mudar.",
  },
  {
    id: "faq-login",
    module: "Login e erros",
    question: "Recebi 401, 500 ou tela sem dados. Como proceder?",
    formattedAnswer: [
      {
        label: "Quando algo falhar",
        text: "",
      },
      {
        label: "401 (não autorizado)",
        text: "sessão expirada. Faça login novamente e confirme o usuário.",
      },
      {
        label: "500 (erro interno)",
        text: "Entre em contato com o suporte através do site onde o software foi adquirido para análise e correção.",
      },
      {
        label: "Sem dados na tela",
        text: "se os cadastros já existem e os dados não carregam, entre em contato com o suporte através do site onde o software foi adquirido.",
      },
      {
        label: "Resumo de ação",
        text: "valide login e dados de origem; caso o problema persista, acione o suporte via canal de atendimento do site onde o software foi comprado.",
      },
    ],
  },
];

const TOPIC_TO_SECTION: Record<HelpTopic, { title: string; description: string }> = {
  onboarding: {
    title: "Onboarding",
    description: "Primeiros passos para configurar e operar a plataforma.",
  },
  faq: {
    title: "FAQ",
    description: "Dúvidas frequentes por módulo do sistema.",
  },
  "guia-tst": {
    title: "Guia TST",
    description: "Referência completa de atuação documental, treinamentos e limites normativos.",
  },
};

const GUIDE_QUICK_POINTS = [
  "Portfólio de documentos que o TST autônomo pode elaborar e assinar, com base normativa.",
  "Regras por NR para atuação como responsável técnico em treinamentos.",
  "Tabela visual de autonomia para decisões rápidas no dia a dia da consultoria.",
  "Princípios-chave para separar documentos permitidos e documentos privativos.",
];

function isHelpTopic(value: string | null): value is HelpTopic {
  return value === "onboarding" || value === "faq" || value === "guia-tst";
}

export default function HelpPage() {
  const search = useSearch();

  const selectedTopic = useMemo<HelpTopic | null>(() => {
    const params = new URLSearchParams(search);
    const topicParam = params.get("topico")?.toLowerCase() ?? null;
    return isHelpTopic(topicParam) ? topicParam : null;
  }, [search]);

  const activeTopicMeta = selectedTopic ? TOPIC_TO_SECTION[selectedTopic] : null;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Central de Ajuda</h2>
          <p className="text-muted-foreground">
            Onboarding para operação diária de SST com referência rápida dos fluxos principais.
          </p>
          {activeTopicMeta && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Topico: {activeTopicMeta.title}</Badge>
              <span className="text-xs text-muted-foreground">{activeTopicMeta.description}</span>
            </div>
          )}
        </div>

        <Card className={selectedTopic === "onboarding" ? "ring-1 ring-primary/40 shadow-sm" : "shadow-sm"}>
          <CardHeader>
            <CardTitle>Primeiros Passos (5 minutos)</CardTitle>
            <CardDescription>
              Sequência recomendada para deixar o ambiente pronto para uso operacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {CHECKLIST_ITEMS.map((item, index) => (
                <li key={item.id} className="rounded-md border p-3">
                  <p className="font-medium">
                    {index + 1}. {item.title}
                  </p>
                  <p className="text-muted-foreground mt-1">{item.description}</p>
                  <div className="mt-3">
                    <Link href={item.href}>
                      <Button variant="outline" size="sm">
                        Abrir
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className={selectedTopic === "faq" ? "ring-1 ring-primary/40 shadow-sm" : "shadow-sm"}>
          <CardHeader>
            <CardTitle>FAQ por Módulo</CardTitle>
            <CardDescription>Respostas diretas para dúvidas recorrentes de operação.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue={selectedTopic === "faq" ? FAQ_ITEMS[0].id : undefined}>
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>
                    <span className="text-sm">
                      <span className="font-semibold">{item.module}: </span>
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.formattedAnswer ? (
                      <div className="space-y-2">
                        {item.formattedAnswer.map((line) => (
                          <p key={`${item.id}-${line.label}`}>
                            <strong>{line.label}:</strong>
                            {line.text ? ` ${line.text}` : ""}
                          </p>
                        ))}
                      </div>
                    ) : (
                      item.answer
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className={selectedTopic === "guia-tst" ? "ring-1 ring-primary/40 shadow-sm" : "shadow-sm"}>
          <CardHeader>
            <CardTitle>Guia Normativo TST</CardTitle>
            <CardDescription>
              Resumo estratégico de atuação documental e treinamentos com base em NR e legislação aplicável.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{GUIDE_INTRO.summary}</p>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>{GUIDE_INTRO.principleTitle}:</strong> {GUIDE_INTRO.principleText}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {GUIDE_QUICK_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/ajuda?topico=guia-tst">
                <Button>Abrir guia completo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {selectedTopic === "guia-tst" && (
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{GUIDE_HEADER.title}</CardTitle>
                <Badge variant="secondary">{GUIDE_HEADER.subtitle}</Badge>
              </div>
              <CardDescription>
                Referência consolidada para atuação do Técnico de Segurança do Trabalho autônomo, com foco em documentos, treinamentos e limites de responsabilidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 text-sm">
              <section id="sumario-guia" className="space-y-2">
                <h3 className="text-base font-semibold">Sumário Rápido</h3>
                <div className="flex flex-wrap gap-2">
                  <a href="#documentos-tst" className="rounded-md border px-3 py-1 text-xs hover:bg-muted/50">
                    Documentos e assinaturas
                  </a>
                  <a href="#treinamentos-rt" className="rounded-md border px-3 py-1 text-xs hover:bg-muted/50">
                    Treinamentos por NR
                  </a>
                  <a href="#autonomia-tst" className="rounded-md border px-3 py-1 text-xs hover:bg-muted/50">
                    Tabela de autonomia
                  </a>
                  <a href="#principios-chave" className="rounded-md border px-3 py-1 text-xs hover:bg-muted/50">
                    Princípios-chave
                  </a>
                </div>
              </section>

              <section id="documentos-tst" className="space-y-3">
                <h3 className="text-base font-semibold">{GUIDE_INTRO.sectionTitle}</h3>
                <p className="text-muted-foreground">
                  O conteúdo abaixo organiza os principais documentos de SST com base legal e limites de atuação.
                </p>
                <Accordion type="multiple" defaultValue={["pgr"]}>
                  {GUIDE_DOCUMENT_SECTIONS.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger>{section.title}</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>
                          <strong>Base normativa:</strong> {section.normativeBase}
                        </p>
                        {section.paragraphs.map((paragraph) => (
                          <p key={`${section.id}-${paragraph}`}>{paragraph}</p>
                        ))}
                        {section.bullets && (
                          <ul className="list-disc space-y-1 pl-5">
                            {section.bullets.map((bullet) => (
                              <li key={`${section.id}-${bullet}`}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                        {section.notes && (
                          <div className="rounded-md border bg-muted/30 p-3">
                            {section.notes.map((note) => (
                              <p key={`${section.id}-${note}`}>{note}</p>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section id="treinamentos-rt" className="space-y-3">
                <h3 className="text-base font-semibold">{GUIDE_TRAINING_CONTEXT.title}</h3>
                <p className="text-muted-foreground">{GUIDE_TRAINING_CONTEXT.paragraph}</p>
                <Accordion type="multiple">
                  {GUIDE_TRAINING_SECTIONS.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger>{section.title}</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>
                          <strong>Referência:</strong> {section.normativeBase}
                        </p>
                        {section.paragraphs.map((paragraph) => (
                          <p key={`${section.id}-${paragraph}`}>{paragraph}</p>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section id="autonomia-tst" className="space-y-3">
                <h3 className="text-base font-semibold">Resumo Visual por Grau de Autonomia do TST</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento / Treinamento</TableHead>
                        <TableHead>NR / Base de Referência</TableHead>
                        <TableHead>O TST pode assinar?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {GUIDE_AUTONOMY_ROWS.map((row) => (
                        <TableRow key={`${row.item}-${row.reference}`}>
                          <TableCell className="font-medium">{row.item}</TableCell>
                          <TableCell>{row.reference}</TableCell>
                          <TableCell>{row.autonomy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section id="principios-chave" className="space-y-3">
                <h3 className="text-base font-semibold">Princípios-Chave para Memorizar</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {GUIDE_KEY_PRINCIPLES.map((principle) => (
                    <div key={principle.title} className="rounded-md border p-3">
                      <p className="font-medium">{principle.title}</p>
                      <p className="text-muted-foreground mt-1">{principle.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p>
                  <strong>Elaborado em:</strong> {GUIDE_METADATA.elaboratedAt}
                </p>
                <p>
                  <strong>Base legal:</strong> {GUIDE_METADATA.legalBase}
                </p>
              </section>

              <div className="flex justify-end">
                <Link href="/ajuda">
                  <Button variant="outline">Voltar para visão rápida</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
}
