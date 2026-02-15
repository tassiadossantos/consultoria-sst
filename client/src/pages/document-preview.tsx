import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { Link, useRoute } from "wouter";
import { mockPGRs, mockCompanies } from "@/lib/mock-data";

export default function DocumentPreview() {
  const [match, params] = useRoute("/pgr/:id/preview");
  const pgrId = params?.id;
  
  // Mock data retrieval
  const pgr = mockPGRs.find(p => p.id === pgrId) || mockPGRs[0];
  const company = mockCompanies.find(c => c.id === pgr.companyId) || mockCompanies[0];

  const handlePrint = () => {
    window.print();
  };

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
            <p>Ref: {pgr.id.toUpperCase()}</p>
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
              <p className="font-medium">{company.name}</p>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase">CNPJ</span>
              <p className="font-medium">{company.cnpj}</p>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase">Grau de Risco</span>
              <p className="font-medium">{company.riskLevel}</p>
            </div>
             <div>
              <span className="block text-xs text-slate-500 uppercase">Nº Funcionários</span>
              <p className="font-medium">{company.employees}</p>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-slate-500 uppercase">Endereço</span>
              <p className="font-medium">Av. das Indústrias, 1000 - Distrito Industrial, São Paulo - SP</p>
            </div>
          </div>
        </section>

        {/* 2. Inventário de Riscos (Mock) */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">2. Inventário de Riscos Ocupacionais</h2>
          
          <div className="border rounded-sm overflow-hidden text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-600 border-b">
                  <th className="p-2 border-r">Setor/Função</th>
                  <th className="p-2 border-r">Perigo/Fator de Risco</th>
                  <th className="p-2 border-r w-24 text-center">Nível</th>
                  <th className="p-2">Medidas de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Mock Row 1 */}
                <tr>
                  <td className="p-2 border-r align-top">
                    <p className="font-bold">Produção</p>
                    <p className="text-xs text-slate-500">Soldador</p>
                  </td>
                  <td className="p-2 border-r align-top">
                    <p className="font-medium">Fumos Metálicos</p>
                    <p className="text-xs text-slate-500">Químico</p>
                  </td>
                  <td className="p-2 border-r align-top text-center">
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
                      Médio (12)
                    </span>
                  </td>
                  <td className="p-2 align-top text-xs">
                    Exaustão localizatada (EPC);<br/>
                    Máscara de solda com filtro (EPI);<br/>
                    Treinamento em proteção respiratória.
                  </td>
                </tr>

                 {/* Mock Row 2 */}
                 <tr>
                  <td className="p-2 border-r align-top">
                    <p className="font-bold">Produção</p>
                    <p className="text-xs text-slate-500">Operador de Máquina</p>
                  </td>
                  <td className="p-2 border-r align-top">
                    <p className="font-medium">Ruído Contínuo</p>
                    <p className="text-xs text-slate-500">Físico</p>
                  </td>
                  <td className="p-2 border-r align-top text-center">
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                      Alto (20)
                    </span>
                  </td>
                  <td className="p-2 align-top text-xs">
                    Enclausuramento da fonte (EPC);<br/>
                    Protetor auricular tipo concha (EPI);<br/>
                    Audiometria semestral (PCA).
                  </td>
                </tr>

                {/* Mock Row 3 */}
                <tr>
                  <td className="p-2 border-r align-top">
                    <p className="font-bold">Administrativo</p>
                    <p className="text-xs text-slate-500">Auxiliar</p>
                  </td>
                  <td className="p-2 border-r align-top">
                    <p className="font-medium">Postura inadequada</p>
                    <p className="text-xs text-slate-500">Ergonômico</p>
                  </td>
                  <td className="p-2 border-r align-top text-center">
                    <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      Baixo (4)
                    </span>
                  </td>
                  <td className="p-2 align-top text-xs">
                    Mobiliário regulável (NR-17);<br/>
                    Pausas regulares;<br/>
                    Ginástica laboral.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Plano de Ação */}
        <section className="mb-8 break-inside-avoid">
           <h2 className="text-sm font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">3. Plano de Ação</h2>
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
                 <tr>
                  <td className="p-2 border-r">Instalar exaustores na área de solda</td>
                  <td className="p-2 border-r">Eng. Manutenção</td>
                  <td className="p-2 border-r">30/06/2026</td>
                  <td className="p-2 text-center"><span className="text-xs font-bold text-amber-600">PENDENTE</span></td>
                 </tr>
                 <tr>
                  <td className="p-2 border-r">Realizar treinamento de NR-06</td>
                  <td className="p-2 border-r">Téc. Segurança</td>
                  <td className="p-2 border-r">15/04/2026</td>
                  <td className="p-2 text-center"><span className="text-xs font-bold text-emerald-600">CONCLUÍDO</span></td>
                 </tr>
              </tbody>
             </table>
            </div>
        </section>

        {/* Footer / Signatures */}
        <footer className="mt-20 break-inside-avoid">
          <div className="grid grid-cols-2 gap-12 text-center">
            <div className="border-t border-slate-900 pt-2">
              <p className="font-bold text-sm uppercase">{company.name}</p>
              <p className="text-xs text-slate-500">Responsável Legal</p>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <p className="font-bold text-sm uppercase">João Dias</p>
              <p className="text-xs text-slate-500">Técnico em Segurança do Trabalho</p>
              <p className="text-xs text-slate-500">Registro MTE: 00.1234/SP</p>
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
