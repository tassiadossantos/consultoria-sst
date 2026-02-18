export const riskTypes = [
  { id: "fisico", label: "Físico", color: "bg-green-100 text-green-800" },
  { id: "quimico", label: "Químico", color: "bg-red-100 text-red-800" },
  { id: "biologico", label: "Biológico", color: "bg-amber-800 text-white" },
  { id: "ergonomico", label: "Ergonômico", color: "bg-yellow-100 text-yellow-800" },
  { id: "acidente", label: "Acidente", color: "bg-blue-100 text-blue-800" },
];

export const calculateRiskLevel = (prob: number, sev: number) => {
  const score = prob * sev;
  if (score <= 6) return { label: "Baixo", class: "risk-low", score };
  if (score <= 15) return { label: "Médio", class: "risk-medium", score };
  return { label: "Alto", class: "risk-high", score };
};
