import { describe, expect, it } from "vitest";

import {
  calculateRiskLevel,
  mockCompanies,
  mockPGRs,
  riskTypes,
} from "./mock-data";

describe("mock-data", () => {
  it("has seed data for companies, pgrs and risk types", () => {
    expect(mockCompanies.length).toBeGreaterThan(0);
    expect(mockPGRs.length).toBeGreaterThan(0);
    expect(riskTypes.length).toBe(5);
  });

  it("calculates low risk when score is up to 6", () => {
    expect(calculateRiskLevel(2, 3)).toEqual({
      label: "Baixo",
      class: "risk-low",
      score: 6,
    });
  });

  it("calculates medium risk when score is between 7 and 15", () => {
    expect(calculateRiskLevel(3, 4)).toEqual({
      label: "Médio",
      class: "risk-medium",
      score: 12,
    });
  });

  it("calculates high risk when score is above 15", () => {
    expect(calculateRiskLevel(4, 4)).toEqual({
      label: "Alto",
      class: "risk-high",
      score: 16,
    });
  });
});
