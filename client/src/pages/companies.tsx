import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCompanies, createCompanyApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function isValidCnpjDigits(cnpjDigits: string): boolean {
  const cnpj = onlyDigits(cnpjDigits);
  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calculateCheckDigit = (base: string, weights: number[]): number => {
    const sum = base.split("").reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstDigit = calculateCheckDigit(cnpj.slice(0, 12), firstWeights);
  const secondDigit = calculateCheckDigit(`${cnpj.slice(0, 12)}${firstDigit}`, secondWeights);

  return cnpj === `${cnpj.slice(0, 12)}${firstDigit}${secondDigit}`;
}

function parseCompanyContactInfo(legalResponsible: string | null | undefined): {
  responsible: string | null;
  email: string | null;
  phone: string | null;
} {
  if (!legalResponsible) {
    return { responsible: null, email: null, phone: null };
  }

  const parts = legalResponsible
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  let responsible: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;

  for (const part of parts) {
    if (/^e-?mail:/i.test(part)) {
      email = part.replace(/^e-?mail:/i, "").trim() || null;
      continue;
    }

    if (/^whats(app)?:/i.test(part)) {
      phone = part.replace(/^whats(app)?:/i, "").trim() || null;
      continue;
    }

    if (!responsible) {
      responsible = part;
    }
  }

  return { responsible, email, phone };
}

export default function Companies() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    risk_level: "",
    employees: "",
    legal_responsible: "",
    contact_email: "",
    contact_phone: "",
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createCompanyApi,
  });

  const cnpjDigits = useMemo(() => onlyDigits(form.cnpj), [form.cnpj]);
  const isCnpjComplete = cnpjDigits.length === 14;
  const isCnpjValid = !isCnpjComplete || isValidCnpjDigits(cnpjDigits);
  const duplicateCompany = useMemo(() => {
    if (!isCnpjComplete) {
      return null;
    }

    return (
      companies.find((company) => {
        const existingDigits = onlyDigits(company.cnpj ?? "");
        return existingDigits.length === 14 && existingDigits === cnpjDigits;
      }) ?? null
    );
  }, [cnpjDigits, companies, isCnpjComplete]);

  const cnpjHint = useMemo(() => {
    if (!cnpjDigits) {
      return null;
    }
    if (!isCnpjComplete) {
      return { text: "CNPJ incompleto.", variant: "neutral" as const };
    }
    if (!isCnpjValid) {
      return { text: "CNPJ inválido. Verifique os dígitos.", variant: "error" as const };
    }
    if (duplicateCompany) {
      return {
        text: `CNPJ já cadastrado para "${duplicateCompany.name}".`,
        variant: "error" as const,
      };
    }
    return { text: "CNPJ válido.", variant: "success" as const };
  }, [cnpjDigits, duplicateCompany, isCnpjComplete, isCnpjValid]);

  const resetForm = () => {
    setForm({
      name: "",
      cnpj: "",
      risk_level: "",
      employees: "",
      legal_responsible: "",
      contact_email: "",
      contact_phone: "",
    });
  };

  const handleSave = async (redirectToPgr = false) => {
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Informe a razão social da empresa.");
      return;
    }

    if (cnpjDigits && !isCnpjComplete) {
      setFormError("Informe os 14 dígitos do CNPJ.");
      return;
    }

    if (cnpjDigits && !isCnpjValid) {
      setFormError("CNPJ inválido. Verifique os dígitos informados.");
      return;
    }

    if (duplicateCompany) {
      setFormError(`CNPJ já cadastrado para "${duplicateCompany.name}".`);
      return;
    }

    const legalResponsibleParts = [
      form.legal_responsible.trim(),
      form.contact_email.trim() ? `E-mail: ${form.contact_email.trim()}` : "",
      form.contact_phone.trim() ? `WhatsApp: ${form.contact_phone.trim()}` : "",
    ].filter(Boolean);

    try {
      await mutateAsync({
        name: form.name.trim(),
        cnpj: cnpjDigits ? formatCnpj(cnpjDigits) : null,
        risk_level: form.risk_level ? Number(form.risk_level) : null,
        employees: form.employees ? Number(form.employees) : null,
        legal_responsible: legalResponsibleParts.length > 0 ? legalResponsibleParts.join(" | ") : null,
      });

      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setDialogOpen(false);
      setFormError("");
      resetForm();

      if (redirectToPgr) {
        setLocation("/pgr/novo");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar empresa.";
      if (message.includes("409")) {
        setFormError("Este CNPJ já está cadastrado para outra empresa.");
        return;
      }
      setFormError("Não foi possível salvar a empresa. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Empresas</h2>
            <p className="text-muted-foreground">
              Cadastro de empresas atendidas e seus dados principais.
            </p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setFormError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Empresa</DialogTitle>
                <DialogDescription>
                  Preencha os dados básicos para iniciar o cadastro da empresa.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input
                    placeholder="Ex: Metalúrgica Exemplo Ltda"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })}
                  />
                  {cnpjHint ? (
                    <p
                      className={
                        cnpjHint.variant === "error"
                          ? "text-xs text-destructive"
                          : cnpjHint.variant === "success"
                          ? "text-xs text-emerald-600"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {cnpjHint.text}
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grau de Risco</Label>
                    <Input
                      placeholder="1-4"
                      value={form.risk_level}
                      onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Funcionários</Label>
                    <Input
                      placeholder="0"
                      type="number"
                      value={form.employees}
                      onChange={(e) => setForm({ ...form, employees: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsável (contato)</Label>
                    <Input
                      placeholder="Ex: Tassia dos Santos Silva"
                      value={form.legal_responsible}
                      onChange={(e) => setForm({ ...form, legal_responsible: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      placeholder="contato@empresa.com.br"
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  />
                </div>
                {formError ? (
                  <p className="text-sm text-destructive">{formError}</p>
                ) : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button
                  variant="outline"
                  onClick={() => void handleSave(true)}
                  disabled={isPending}
                >
                  {isPending ? "Salvando..." : "Salvar e criar PGR"}
                </Button>
                <Button onClick={() => void handleSave(false)} disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Lista de Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando empresas...</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Grau de Risco</TableHead>
                      <TableHead>Funcionários</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => {
                        const contactInfo = parseCompanyContactInfo(company.legal_responsible);

                        return (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.cnpj ?? "-"}</TableCell>
                            <TableCell>{company.risk_level ?? "-"}</TableCell>
                            <TableCell>{company.employees ?? "-"}</TableCell>
                            <TableCell>{contactInfo.responsible ?? "-"}</TableCell>
                            <TableCell>{contactInfo.email ?? "-"}</TableCell>
                            <TableCell>{contactInfo.phone ?? "-"}</TableCell>
                            <TableCell className="text-right">
                              <Link href={`/pgr/novo?company_id=${company.id}`}>
                                <Button size="sm" variant="outline">Criar PGR</Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
