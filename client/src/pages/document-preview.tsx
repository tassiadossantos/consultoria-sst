import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getPgrDetail } from "@/lib/pgr";
import type { PgrDetail } from "@shared/schema";

export default function DocumentPreview() {
  const [match, params] = useRoute("/pgr/:id/preview");
  const pgrId = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pgr", pgrId],
    queryFn: () => getPgrDetail(pgrId ?? ""),
    enabled: Boolean(pgrId),
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 p-6 md:p-12 text-sm text-muted-foreground">
        Carregando PGR...
      </div>
    );
  }

  if (!data || isError) {
    return (
      <div className="min-h-screen bg-muted/50 p-6 md:p-12">
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar o PGR</AlertTitle>
          <AlertDescription>Verifique a conexão com o servidor e tente novamente.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { pgr, company, risks, actions } = data;

  return (
    <div className="min-h-screen bg-muted/50 p-6 md:p-12 print:p-0 print:bg-white">
      {/* No-Print Toolbar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/pgr">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" /> Baixar PDF
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] p-[15mm] print:shadow-none print:w-full print:max-w-none">

        {/* Header */}
        <header className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-sm">
              <span className="font-bold text-xl">SST</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">PGR - Programa de Gerenciamento de Riscos</h1>
              <p className="text-sm text-slate-600 font-medium">Conforme Norma Regulamentadora Nº 01 (NR-01)</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Ref: {pgr.id.slice(0, 8).toUpperCase()}</p>
            <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Rev: {pgr.revision.toString().padStart(2, '0')}</p>
          </div>
        </header>

        {/* 1. Identificação */}
        <section className="mb-8">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">1. Identificação da Empresa</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <span className="block text-xs text-slate-500 uppercase">Razão Social</span>
              <p className="font-medium">{company?.name ?? "Não informado"}</p>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase">CNPJ</span>
              <p className="font-medium">{company?.cnpj ?? "-"}</p>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase">Grau de Risco</span>
              <p className="font-medium">{company?.risk_level ?? "-"}</p>
            </div>
             <div>
              <span className="block text-xs text-slate-500 uppercase">Nº Funcionários</span>
              <p className="font-medium">{company?.employees ?? "-"}</p>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-slate-500 uppercase">Endereço</span>
              <p className="font-medium">{company?.address ?? "Não informado"}</p>
            </div>
          </div>
        </section>

        {/* 2. Caracterização */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">2. Caracterização da Empresa</h2>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {pgr.characterization ?? "Não informado"}
          </div>
        </section>

        {/* 2.1 Responsabilidades */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">2.1 Responsabilidades</h2>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {pgr.responsibilities ?? "Não informado"}
          </div>
        </section>

        {/* 3. Inventário de Riscos */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">3. Inventário de Riscos Ocupacionais</h2>

          <div className="border rounded-sm overflow-hidden text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-600 border-b">
                  <th className="p-2 border-r">Setor/Função</th>
                  <th className="p-2 border-r">Perigo/Risco</th>
                  <th className="p-2 border-r w-24 text-center">Nível</th>
                  <th className="p-2">Medidas de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {risks.length === 0 ? (
                  <tr>
                    <td className="p-2 text-center text-xs text-slate-500" colSpan={4}>
                      Nenhum risco registrado.
                    </td>
                  </tr>
                ) : (
                  risks.map((risk) => (
                    <tr key={risk.id}>
                      <td className="p-2 border-r align-top">
                        <p className="font-bold">{risk.sector ?? "-"}</p>
                        <p className="text-xs text-slate-500">{risk.role ?? "-"}</p>
                      </td>
                      <td className="p-2 border-r align-top">
                        <p className="font-medium">{risk.hazard ?? "-"}</p>
                        <p className="text-xs text-slate-500">{risk.risk ?? "-"}</p>
                      </td>
                      <td className="p-2 border-r align-top text-center">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded">
                          {risk.risk_level ?? "-"} ({risk.risk_score ?? "-"})
                        </span>
                      </td>
                      <td className="p-2 align-top text-xs">
                        {risk.controls ?? "-"}
                        {risk.epi ? <div className="mt-2"><strong>EPI:</strong> {risk.epi}</div> : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Avaliação e Classificação */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">4. Avaliação e Classificação dos Riscos</h2>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {pgr.risk_criteria ?? "Não informado"}
          </div>
        </section>

        {/* 5. Medidas de Prevenção e Controle */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">5. Medidas de Prevenção e Controle</h2>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {pgr.control_measures ?? "Não informado"}
          </div>
        </section>

          {/* 6. Plano de Ação */}
        <section className="mb-8 break-inside-avoid">
            <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">6. Plano de Ação</h2>
            <div className="border rounded-sm overflow-hidden text-sm">
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-600 border-b">
                  <th className="p-2 border-r">Ação</th>
                  <th className="p-2 border-r">Responsável</th>
                  <th className="p-2 border-r">Prazo</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                 {actions.length === 0 ? (
                   <tr>
                     <td className="p-2 text-center text-xs text-slate-500" colSpan={4}>
                       Nenhuma ação registrada.
                     </td>
                   </tr>
                 ) : (
                   actions.map((action) => (
                     <tr key={action.id}>
                       <td className="p-2 border-r">{action.action ?? "-"}</td>
                       <td className="p-2 border-r">{action.owner ?? "-"}</td>
                       <td className="p-2 border-r">
                         {action.due_date ? new Date(action.due_date).toLocaleDateString("pt-BR") : "-"}
                       </td>
                       <td className="p-2 text-center">
                         <span className="text-xs font-bold text-slate-600">{action.status ?? "-"}</span>
                       </td>
                     </tr>
                   ))
                 )}
              </tbody>
             </table>
            </div>
        </section>

        {/* 7. Treinamentos */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">7. Treinamentos e Capacitacoes</h2>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {pgr.training_plan ?? "Não informado"}
          </div>
        </section>

        {/* 8. Monitoramento e Revisão */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">8. Monitoramento e Revisão</h2>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {pgr.monitoring ?? "Não informado"}
          </div>
        </section>

        {/* Footer / Signatures */}
        <footer className="mt-20 break-inside-avoid">
          <div className="grid grid-cols-2 gap-12 text-center">
            <div className="border-t border-slate-900 pt-2">
              <p className="font-bold text-sm uppercase">{company?.name ?? "Empresa"}</p>
              <p className="text-xs text-slate-500">Responsável Legal</p>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <p className="font-bold text-sm uppercase">{pgr.responsible_name ?? "Responsável Técnico"}</p>
              <p className="text-xs text-slate-500">Técnico de Segurança do Trabalho</p>
              <p className="text-xs text-slate-500">Registro MTE: {pgr.responsible_registry ?? "-"}</p>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-slate-400 border-t pt-4">
             <p>Documento gerado eletronicamente pelo sistema SST Pro em {new Date().toLocaleString('pt-BR')}.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
