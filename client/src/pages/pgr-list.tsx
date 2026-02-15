import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, MoreHorizontal, FileText, Printer } from "lucide-react";
import { mockPGRs } from "@/lib/mock-data";
import { Link } from "wouter";

export default function PGRList() {
  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de PGR</h2>
            <p className="text-muted-foreground">
              Consulte, edite e gere novos Programas de Gerenciamento de Riscos.
            </p>
          </div>
          <Link href="/pgr/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo PGR
            </Button>
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar por empresa, CNPJ ou ID..." 
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              Exportar
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revisão</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPGRs.map((pgr) => (
                <TableRow key={pgr.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {pgr.id.toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary/50" />
                      {pgr.companyName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        pgr.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        pgr.status === 'expired' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }
                    >
                      {pgr.status === 'active' ? 'Vigente' : 
                       pgr.status === 'expired' ? 'Vencido' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell>Rev. {pgr.revision}</TableCell>
                  <TableCell>
                    {pgr.validUntil === '-' ? '-' : new Date(pgr.validUntil).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${pgr.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{pgr.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/pgr/${pgr.id}/preview`}>
                        <Button variant="ghost" size="icon" title="Visualizar PDF">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
