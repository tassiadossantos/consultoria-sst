export type HelpGuideSection = {
  id: string;
  title: string;
  normativeBase: string;
  paragraphs: string[];
  bullets?: string[];
  notes?: string[];
};

export type HelpGuideAutonomyRow = {
  item: string;
  reference: string;
  autonomy: string;
};

export const GUIDE_HEADER = {
  title: "Guia Completo de Atuação do Técnico de Segurança do Trabalho",
  subtitle: "Documentos, Treinamentos e Fundamentos Normativos",
};

export const GUIDE_INTRO = {
  sectionTitle: "Documentos que o TST Autônomo Pode Assinar",
  summary:
    "Além do PGR, o Técnico de Segurança do Trabalho autônomo e consultor possui um portfólio amplo de documentos e treinamentos que pode elaborar e assinar com validade legal, respeitando a norma aplicável em cada caso.",
  principleTitle: "Princípio Geral Fundamental",
  principleText:
    "Quem elabora, assina. Separar elaboração e assinatura pode caracterizar falsidade ideológica (Art. 299 do Código Penal).",
};

export const GUIDE_DOCUMENT_SECTIONS: HelpGuideSection[] = [
  {
    id: "pgr",
    title: "PGR — Programa de Gerenciamento de Riscos",
    normativeBase: "NR 1, item 1.5.7.2",
    paragraphs: [
      "O PGR materializa o processo de Gerenciamento de Riscos Ocupacionais e substitui o antigo PPRA, com foco em melhoria contínua das condições de trabalho.",
      "A estrutura mínima do PGR exige Inventário de Riscos Ocupacionais e Plano de Ação.",
      "A avaliação de riscos deve ser revisada em até dois anos e também quando houver mudança relevante em tecnologia, ambiente, processo ou organização do trabalho.",
    ],
    bullets: [
      "NR 1 (geral): pode elaborar e assinar, sem exigência de profissão específica na redação do item.",
      "NR 18 (construção): pode elaborar para obra com menos de 7 m e menos de 10 trabalhadores.",
      "NR 22 (mineração): pode elaborar sob determinação da empresa/permissionário.",
    ],
  },
  {
    id: "apr",
    title: "APR — Análise Preliminar de Risco",
    normativeBase: "NR 12 (12.16), NR 18, NR 20, NR 33 e NR 35",
    paragraphs: [
      "A APR identifica riscos de uma atividade e define medidas de controle antes da execução.",
      "É documento operacional e dinâmico, devendo ser refeito quando houver mudança de atividade, ambiente ou equipe.",
    ],
    bullets: [
      "Identificar riscos por setor e função.",
      "Orientar trabalhadores sobre riscos e prevenção.",
      "Planejar prevenção por etapa e ambiente.",
      "Prevenir acidentes por falha humana ou mecânica.",
    ],
  },
  {
    id: "oss",
    title: "Ordem de Serviço de Segurança (OSS)",
    normativeBase: "NR 1, item 1.4.1; CLT, Art. 157, II",
    paragraphs: [
      "Documento obrigatório para instruir empregados sobre precauções para evitar acidentes e doenças ocupacionais.",
      "Deve detalhar atividades, riscos, uso de EPIs, instruções de segurança, proibições e responsabilidades.",
      "Costuma ser entregue na admissão; em mudança de função, deve ser atualizada.",
    ],
  },
  {
    id: "dds",
    title: "DDS — Diálogo Diário de Segurança",
    normativeBase: "NR 1, item 1.4.1 (comunicação de riscos)",
    paragraphs: [
      "Ferramenta de comunicação para conscientização e prevenção de acidentes nas atividades diárias.",
      "Reunião rápida (geralmente 5 a 10 minutos), comum em áreas operacionais.",
      "Mesmo sem citação nominal em todas as normas, atende ao dever de informar riscos, controles e orientações de segurança.",
    ],
  },
  {
    id: "parecer-tecnico",
    title: "Parecer Técnico",
    normativeBase: "Lei nº 7.410/1985 e NR 1 (base de atuação)",
    paragraphs: [
      "Registra formalmente a avaliação técnica do TST sobre riscos, conformidade e recomendações.",
      "Difere de laudo formal de insalubridade/periculosidade, que é privativo de Engenheiro de Segurança ou Médico do Trabalho.",
    ],
    bullets: [
      "Avaliar condições antes da emissão de PGR.",
      "Registrar conclusões de inspeção de segurança.",
      "Recomendar medidas após APR.",
      "Documentar avaliações qualitativas sem configurar laudo legal privativo.",
    ],
  },
  {
    id: "matriz-certificados",
    title: "Matriz de Treinamentos e Certificados",
    normativeBase: "NR 1, item 1.7.1.1",
    paragraphs: [
      "A matriz mapeia treinamentos obrigatórios por cargo/função conforme NRs aplicáveis.",
      "O TST pode elaborar matriz, ministrar treinamentos permitidos e assinar certificados como instrutor responsável quando houver competência técnica comprovada.",
    ],
    bullets: [
      "Nome do treinando.",
      "Carga horária.",
      "Conteúdo programático.",
      "Data e local.",
      "Assinatura do instrutor com registro profissional.",
      "Assinatura do treinando (preferencial).",
    ],
  },
  {
    id: "cat",
    title: "CAT — Comunicação de Acidente de Trabalho",
    normativeBase: "Lei nº 8.213/1991, Art. 22; Decreto nº 3.048/1999",
    paragraphs: [
      "A CAT formaliza acidente de trabalho, de trajeto ou doença ocupacional para fins previdenciários e de comunicação institucional.",
      "Prazo padrão de emissão: até o primeiro dia útil seguinte à ocorrência, inclusive sem afastamento.",
      "O TST autônomo pode emitir em nome do empregador quando formalmente designado e com acesso às informações necessárias.",
    ],
    bullets: [
      "CAT Inicial: primeira ocorrência.",
      "CAT Reabertura: novo afastamento pelo mesmo motivo.",
      "CAT Óbito: quando o evento resulta em morte.",
    ],
  },
  {
    id: "gro",
    title: "Documentos do GRO — Gerenciamento de Riscos Ocupacionais",
    normativeBase: "NR 1",
    paragraphs: [
      "O GRO é o processo de gestão de riscos; os documentos operacionais são os registros que comprovam a execução desse processo.",
      "Esses documentos alimentam o ciclo de melhoria contínua da gestão de SST.",
    ],
    bullets: [
      "Inventário de Riscos Ocupacionais.",
      "Plano de Ação.",
      "Relatório de Análise de Acidente e Doença do Trabalho (AAT).",
      "Registros de comunicação de riscos aos trabalhadores.",
    ],
  },
];

export const GUIDE_TRAINING_CONTEXT = {
  title: "Fundamentos Normativos Específicos por Treinamento",
  paragraph:
    "A NR 1, conforme atualização da Portaria MTE nº 1.419/2024 (vigência em 26/05/2025), define que o responsável técnico pela capacitação pode ser profissional legalmente habilitado ou trabalhador qualificado, conforme a NR específica.",
};

export const GUIDE_TRAINING_SECTIONS: HelpGuideSection[] = [
  {
    id: "nr5-cipa",
    title: "NR 5 — CIPA",
    normativeBase: "NR 5, item 5.35",
    paragraphs: [
      "O treinamento pode ser ministrado por SESMT, entidade patronal, entidade de trabalhadores ou profissional com conhecimento sobre os temas.",
      "Como o SESMT pode incluir TST, há possibilidade de atuação e assinatura nos termos da norma aplicável.",
    ],
  },
  {
    id: "nr10-eletricidade",
    title: "NR 10 — Segurança em Instalações Elétricas",
    normativeBase: "NR 10 (conteúdo por especialidade técnica)",
    paragraphs: [
      "O TST não ministra sozinho todo o conteúdo da NR 10.",
      "Partes elétricas exigem profissional habilitado em eletricidade, e primeiros socorros requerem profissional de saúde competente.",
      "O TST atua na parte de prevenção de acidentes, EPI e medidas de controle em SST.",
    ],
  },
  {
    id: "nr12-maquinas",
    title: "NR 12 — Máquinas e Equipamentos",
    normativeBase: "NR 12, item 12.16.6",
    paragraphs: [
      "A capacitação é vinculada às condições estabelecidas por profissional legalmente habilitado responsável pela supervisão.",
      "O TST pode atuar como responsável técnico supervisor, desde que o conteúdo técnico específico da máquina seja ministrado por profissional habilitado na especialidade.",
    ],
  },
  {
    id: "nr33-espacos-confinados",
    title: "NR 33 — Espaços Confinados",
    normativeBase: "NR 33 (PLH ou qualificado em segurança do trabalho)",
    paragraphs: [
      "A própria norma usa o conectivo 'ou', permitindo atuação de profissional legalmente habilitado ou qualificado em segurança do trabalho como responsável técnico.",
      "O TST pode assumir responsabilidade técnica e assinatura de certificados quando cumpridos os requisitos da norma.",
    ],
  },
  {
    id: "nr35-altura",
    title: "NR 35 — Trabalho em Altura",
    normativeBase: "NR 35, itens 35.3.6 e 35.3.7",
    paragraphs: [
      "Treinamento ministrado por instrutores com proficiência comprovada e sob responsabilidade de profissional qualificado em segurança no trabalho.",
      "O certificado deve conter identificação do trabalhador, conteúdo, carga horária, data/local, qualificação dos instrutores e assinatura do responsável.",
    ],
  },
];

export const GUIDE_AUTONOMY_ROWS: HelpGuideAutonomyRow[] = [
  { item: "PGR (geral)", reference: "NR 1, item 1.5.7.2", autonomy: "Sim, sem restrição geral na regra-base." },
  { item: "PGR (construção civil)", reference: "NR 18, item 18.4.2.1", autonomy: "Sim, se obra < 7 m e < 10 trabalhadores." },
  { item: "PGR (mineração)", reference: "NR 22", autonomy: "Sim, sob designação da empresa." },
  { item: "Inventário de Riscos", reference: "NR 1", autonomy: "Sim." },
  { item: "Plano de Ação", reference: "NR 1", autonomy: "Sim." },
  { item: "APR", reference: "NR 12, 18, 33, 35", autonomy: "Sim." },
  { item: "Ordem de Serviço", reference: "NR 1 / CLT Art. 157", autonomy: "Sim." },
  { item: "DDS", reference: "NR 1, item 1.4.1", autonomy: "Sim." },
  { item: "Parecer Técnico", reference: "NR 1 / Lei 7.410/85", autonomy: "Sim." },
  { item: "Certificado de Treinamento CIPA", reference: "NR 5, item 5.35", autonomy: "Sim." },
  { item: "Certificado de Treinamento NR 33", reference: "NR 33", autonomy: "Sim, como responsável técnico." },
  { item: "Certificado de Treinamento NR 35", reference: "NR 35, itens 35.3.6 e 35.3.7", autonomy: "Sim, como responsável técnico." },
  { item: "Certificado de Treinamento NR 12", reference: "NR 12, item 12.16.6", autonomy: "Sim, como responsável técnico supervisor." },
  { item: "Certificado de Treinamento NR 10", reference: "NR 10", autonomy: "Parcial: apenas conteúdos de SST da sua competência." },
  { item: "CAT", reference: "Lei 8.213/91, Art. 22", autonomy: "Sim, sob designação do empregador." },
  { item: "Laudo de Insalubridade", reference: "NR 15 / Lei 8.213/91", autonomy: "Não (documento privativo)." },
  { item: "LTCAT", reference: "Decreto 3.048/99", autonomy: "Não (documento privativo)." },
  { item: "PCMSO", reference: "NR 7", autonomy: "Não (coordenação médica)." },
  { item: "PCMAT (obras grandes)", reference: "NR 18 + NT 96/2009", autonomy: "Não." },
];

export const GUIDE_KEY_PRINCIPLES = [
  {
    title: "Princípio Geral",
    text: "Quem elabora, assina. Separar elaboração e assinatura pode configurar falsidade ideológica (Art. 299 do Código Penal).",
  },
  {
    title: "NR 1 como regra-mãe",
    text: "O PGR deve ser datado e assinado no processo documental da organização, com responsabilidade formal.",
  },
  {
    title: "Laudo vs. Parecer",
    text: "Laudo formal de caracterização legal é privativo; parecer técnico é manifestação profissional e pode ser emitido pelo TST.",
  },
  {
    title: "TST como RT de treinamentos",
    text: "Em NRs como 33 e 35, a expressão 'PLH ou qualificado' abre atuação plena do TST como responsável técnico.",
  },
];

export const GUIDE_METADATA = {
  elaboratedAt: "Fevereiro de 2025",
  legalBase: "NRs vigentes e Portaria MTE nº 1.419/2024",
};
