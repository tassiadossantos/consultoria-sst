import type { DocumentPdfPayload, PgrDetail } from "@shared/schema";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const FONT_SIZE = 11;
const LINE_HEIGHT = 14;
const TOP_MARGIN = 40;
const BOTTOM_MARGIN = 40;
const MAX_CHARS_PER_LINE = 95;

type GeneratePgrPdfOptions = {
  documentId: string;
  tenantId: string;
  userId?: string;
  generatedAt?: Date;
};

type GenerateDocumentPdfOptions = {
  templateId: string;
  tenantId: string;
  userId?: string;
  generatedAt?: Date;
};

function sanitizeInputText(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function wrapText(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\t/g, "  ");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
        continue;
      }

      const candidate = `${currentLine} ${word}`;
      if (candidate.length <= maxChars) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function escapePdfText(text: string): string {
  let escaped = "";

  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 63;
    const byte = codePoint > 255 ? 63 : codePoint;

    if (byte === 40 || byte === 41 || byte === 92) {
      escaped += `\\${String.fromCharCode(byte)}`;
      continue;
    }

    if (byte < 32 || byte > 126) {
      escaped += `\\${byte.toString(8).padStart(3, "0")}`;
      continue;
    }

    escaped += String.fromCharCode(byte);
  }

  return escaped;
}

function toPtBrDate(value: unknown): string {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR");
}

function pushSectionTitle(lines: string[], title: string): void {
  lines.push("");
  lines.push(title.toUpperCase());
  lines.push("-".repeat(title.length));
}

function pushWrappedValue(lines: string[], label: string, value: unknown): void {
  const wrapped = wrapText(sanitizeInputText(value), MAX_CHARS_PER_LINE - label.length - 2);
  if (wrapped.length === 0) {
    lines.push(`${label}: -`);
    return;
  }

  lines.push(`${label}: ${wrapped[0]}`);
  for (let i = 1; i < wrapped.length; i += 1) {
    lines.push(`${" ".repeat(label.length + 2)}${wrapped[i]}`);
  }
}

function buildDocumentLines(detail: PgrDetail, options: Required<GeneratePgrPdfOptions>): string[] {
  const { pgr, company, risks, actions } = detail;
  const safeRisks = Array.isArray(risks) ? risks : [];
  const safeActions = Array.isArray(actions) ? actions : [];
  const lines: string[] = [];

  lines.push("PGR - PROGRAMA DE GERENCIAMENTO DE RISCOS");
  lines.push("Conforme NR-01");
  lines.push("");
  lines.push(`Documento: ${options.documentId}`);
  lines.push(`Tenant: ${options.tenantId}`);
  lines.push(`Usuário: ${options.userId ?? "não informado"}`);
  lines.push(`Gerado em: ${options.generatedAt.toLocaleString("pt-BR")}`);
  lines.push("");
  lines.push(`Revisão: ${pgr.revision}`);
  lines.push(`Status: ${pgr.status}`);
  lines.push(`Criado em: ${toPtBrDate(pgr.created_at)}`);
  lines.push(`Válido até: ${toPtBrDate(pgr.valid_until)}`);

  pushSectionTitle(lines, "1. Identificação da Empresa");
  pushWrappedValue(lines, "Razão social", company?.name ?? "Não informado");
  pushWrappedValue(lines, "CNPJ", company?.cnpj ?? "-");
  pushWrappedValue(lines, "CNAE", company?.cnae ?? "-");
  pushWrappedValue(lines, "Endereço", company?.address ?? "Não informado");
  pushWrappedValue(lines, "Grau de risco", company?.risk_level ?? "-");
  pushWrappedValue(lines, "Número de funcionários", company?.employees ?? "-");
  pushWrappedValue(lines, "Responsável legal", company?.legal_responsible ?? "-");

  pushSectionTitle(lines, "2. Caracterização da Empresa");
  wrapText(sanitizeInputText(pgr.characterization), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  pushSectionTitle(lines, "2.1 Responsabilidades");
  wrapText(sanitizeInputText(pgr.responsibilities), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  pushSectionTitle(lines, "3. Inventário de Riscos Ocupacionais");
  if (safeRisks.length === 0) {
    lines.push("Nenhum risco registrado.");
  } else {
    safeRisks.forEach((risk, index) => {
      lines.push(`Risco ${index + 1}`);
      pushWrappedValue(lines, "Setor", risk.sector ?? "-");
      pushWrappedValue(lines, "Função", risk.role ?? "-");
      pushWrappedValue(lines, "Perigo", risk.hazard ?? "-");
      pushWrappedValue(lines, "Risco", risk.risk ?? "-");
      pushWrappedValue(
        lines,
        "Classificação",
        `${risk.risk_level ?? "-"} (score: ${risk.risk_score ?? "-"})`,
      );
      pushWrappedValue(lines, "Tipo", risk.risk_type ?? "-");
      pushWrappedValue(lines, "Probabilidade", risk.probability ?? "-");
      pushWrappedValue(lines, "Severidade", risk.severity ?? "-");
      pushWrappedValue(lines, "Controles", risk.controls ?? "-");
      pushWrappedValue(lines, "EPI", risk.epi ?? "-");
      lines.push("");
    });
  }

  pushSectionTitle(lines, "4. Avaliação e Classificação");
  wrapText(sanitizeInputText(pgr.risk_criteria), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  pushSectionTitle(lines, "5. Medidas de Prevenção e Controle");
  wrapText(sanitizeInputText(pgr.control_measures), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  pushSectionTitle(lines, "6. Plano de Ação");
  if (safeActions.length === 0) {
    lines.push("Nenhuma ação registrada.");
  } else {
    safeActions.forEach((action, index) => {
      lines.push(`Ação ${index + 1}`);
      pushWrappedValue(lines, "Descrição", action.action ?? "-");
      pushWrappedValue(lines, "Responsável", action.owner ?? "-");
      pushWrappedValue(lines, "Prazo", toPtBrDate(action.due_date));
      pushWrappedValue(lines, "Status", action.status ?? "-");
      lines.push("");
    });
  }

  pushSectionTitle(lines, "7. Treinamentos e Capacitações");
  wrapText(sanitizeInputText(pgr.training_plan), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  pushSectionTitle(lines, "8. Monitoramento e Revisão");
  wrapText(sanitizeInputText(pgr.monitoring), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  lines.push("");
  lines.push("Assinaturas");
  lines.push("Empresa: __________________________________________");
  lines.push("Responsável técnico: _______________________________");
  lines.push(`Registro MTE: ${sanitizeInputText(pgr.responsible_registry)}`);

  return lines;
}

function buildGeneratedDocumentLines(
  payload: DocumentPdfPayload,
  options: Required<GenerateDocumentPdfOptions>,
): string[] {
  const lines: string[] = [];

  lines.push("DOCUMENTO TÉCNICO DE SST");
  lines.push("Geração assistida pelo sistema");
  lines.push("");
  lines.push(`Modelo: ${payload.template_title}`);
  lines.push(`Template ID: ${options.templateId}`);
  lines.push(`Base normativa: ${sanitizeInputText(payload.normative_base)}`);
  lines.push(`Pode assinar: ${sanitizeInputText(payload.signature_status)}`);
  lines.push("");
  lines.push(`Tenant: ${options.tenantId}`);
  lines.push(`Usuário: ${options.userId ?? "não informado"}`);
  lines.push(`Gerado em: ${options.generatedAt.toLocaleString("pt-BR")}`);
  lines.push(`Data de emissão: ${toPtBrDate(payload.issue_date)}`);

  pushSectionTitle(lines, "1. Identificação da Empresa");
  pushWrappedValue(lines, "Razão social", payload.company_name);
  pushWrappedValue(lines, "CNPJ", payload.cnpj);
  pushWrappedValue(lines, "Endereço", payload.address);
  pushWrappedValue(lines, "Setor / área", payload.sector);

  pushSectionTitle(lines, "2. Conteúdo Técnico");
  pushWrappedValue(lines, "Objetivo", payload.objective);
  lines.push("");
  lines.push("Escopo");
  lines.push("-".repeat("Escopo".length));
  wrapText(sanitizeInputText(payload.scope), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  lines.push("");
  lines.push("Conteúdo técnico principal");
  lines.push("-".repeat("Conteúdo técnico principal".length));
  wrapText(sanitizeInputText(payload.technical_content), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  lines.push("");
  lines.push("Recomendações e plano de acompanhamento");
  lines.push("-".repeat("Recomendações e plano de acompanhamento".length));
  wrapText(sanitizeInputText(payload.recommendations), MAX_CHARS_PER_LINE).forEach((line) => lines.push(line));

  pushSectionTitle(lines, "3. Responsáveis e Assinatura");
  pushWrappedValue(lines, "Responsável técnico", payload.responsible_name);
  pushWrappedValue(lines, "Registro profissional", payload.responsible_registry);
  pushWrappedValue(lines, "Representante da empresa", payload.company_representative);

  lines.push("");
  lines.push("Assinaturas");
  lines.push("Responsável técnico: _______________________________");
  lines.push("Representante da empresa: __________________________");

  return lines;
}

function chunkLinesIntoPages(lines: string[]): string[][] {
  const usableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  const linesPerPage = Math.max(1, Math.floor(usableHeight / LINE_HEIGHT));
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  return pages.length > 0 ? pages : [[]];
}

function buildPageContentStream(lines: string[]): string {
  const startY = PAGE_HEIGHT - TOP_MARGIN;
  const commands: string[] = [];
  commands.push("BT");
  commands.push(`/F1 ${FONT_SIZE} Tf`);
  commands.push(`${TOP_MARGIN} ${startY} Td`);
  commands.push(`${LINE_HEIGHT} TL`);

  for (const line of lines) {
    commands.push(`(${escapePdfText(line)}) Tj`);
    commands.push("T*");
  }

  commands.push("ET");
  return commands.join("\n");
}

function buildPdfFromLines(lines: string[]): Buffer {
  const pages = chunkLinesIntoPages(lines);

  const objects = new Map<number, string>();
  const catalogObjectId = 1;
  const pagesObjectId = 2;
  const fontObjectId = 3;
  const firstPageObjectId = 4;

  objects.set(fontObjectId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageObjectIds: number[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    const pageObjectId = firstPageObjectId + i * 2;
    const contentObjectId = pageObjectId + 1;
    const stream = buildPageContentStream(pages[i] ?? []);

    objects.set(
      contentObjectId,
      `<< /Length ${Buffer.byteLength(stream, "binary")} >>\nstream\n${stream}\nendstream`,
    );
    objects.set(
      pageObjectId,
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    pageObjectIds.push(pageObjectId);
  }

  objects.set(
    pagesObjectId,
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`,
  );
  objects.set(catalogObjectId, `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  const objectIds = Array.from(objects.keys()).sort((a, b) => a - b);
  const maxObjectId = objectIds[objectIds.length - 1] ?? 0;
  const offsets = new Array<number>(maxObjectId + 1).fill(0);

  let pdf = "%PDF-1.4\n";

  for (const objectId of objectIds) {
    offsets[objectId] = Buffer.byteLength(pdf, "binary");
    const objectContent = objects.get(objectId) ?? "";
    pdf += `${objectId} 0 obj\n${objectContent}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= maxObjectId; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root ${catalogObjectId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

export function generatePgrPdf(detail: PgrDetail, options: GeneratePgrPdfOptions): Buffer {
  const normalizedOptions: Required<GeneratePgrPdfOptions> = {
    documentId: options.documentId,
    tenantId: options.tenantId,
    userId: options.userId ?? "não informado",
    generatedAt: options.generatedAt ?? new Date(),
  };

  const documentLines = buildDocumentLines(detail, normalizedOptions);
  return buildPdfFromLines(documentLines);
}

export function generateDocumentPdf(
  payload: DocumentPdfPayload,
  options: GenerateDocumentPdfOptions,
): Buffer {
  const normalizedOptions: Required<GenerateDocumentPdfOptions> = {
    templateId: options.templateId,
    tenantId: options.tenantId,
    userId: options.userId ?? "não informado",
    generatedAt: options.generatedAt ?? new Date(),
  };

  const documentLines = buildGeneratedDocumentLines(payload, normalizedOptions);
  return buildPdfFromLines(documentLines);
}
