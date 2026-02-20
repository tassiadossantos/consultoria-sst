import React from "react";
import { Layout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { documentSections, signatureClassName, signatureLabel } from "./document-templates";

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

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Prioridade de implementação recomendada</CardTitle>
            <CardDescription>
              Comece por Inventário de Riscos, Plano de Ação, APR, OSS e CAT para cobrir o núcleo operacional.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-10">
          {documentSections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {section.items.map((doc) => (
                  <Card key={doc.title} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                      <div className={`p-3 rounded-lg ${doc.bg}`}>
                        <doc.icon className={`w-6 h-6 ${doc.color}`} />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>{doc.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-md border bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Base normativa</p>
                        <p className="text-sm font-medium">{doc.normativeBase}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-md border bg-background p-3">
                        <p className="text-xs text-muted-foreground">Pode assinar?</p>
                        <Badge variant="outline" className={signatureClassName(doc.signatureStatus)}>
                          {signatureLabel(doc.signatureStatus)}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                      {doc.canGenerate ? (
                        <Button asChild size="sm">
                          <Link href={`/documentos/novo?tipo=${doc.id}`}>Gerar documento</Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Somente referência
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}
