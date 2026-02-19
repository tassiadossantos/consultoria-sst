import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPIRING_WINDOW_DAYS,
  listExpiringTrainingsByDate,
  parseWindowDays,
} from "./trainingDue";

describe("trainingDue", () => {
  it("defaults window days when input is invalid", () => {
    expect(parseWindowDays(undefined)).toBe(DEFAULT_EXPIRING_WINDOW_DAYS);
    expect(parseWindowDays("abc")).toBe(DEFAULT_EXPIRING_WINDOW_DAYS);
    expect(parseWindowDays("-5")).toBe(DEFAULT_EXPIRING_WINDOW_DAYS);
    expect(parseWindowDays("0")).toBe(DEFAULT_EXPIRING_WINDOW_DAYS);
  });

  it("returns only trainings due in the configured window", () => {
    const now = new Date("2026-02-19T12:00:00.000Z");
    const trainings = [
      {
        id: "t-1",
        training_date: "2026-02-20",
        status: "agendado",
      },
      {
        id: "t-2",
        training_date: "2026-03-10",
        status: "agendado",
      },
      {
        id: "t-3",
        training_date: "2026-02-18",
        status: "agendado",
      },
    ];

    const expiring = listExpiringTrainingsByDate(trainings, now, 7);
    expect(expiring).toHaveLength(1);
    expect(expiring[0]).toMatchObject({
      id: "t-1",
      days_until_due: 1,
    });
  });

  it("ignores trainings marked as realizado", () => {
    const now = new Date("2026-02-19T12:00:00.000Z");
    const trainings = [
      {
        id: "t-1",
        training_date: "2026-02-20",
        status: "realizado",
      },
      {
        id: "t-2",
        training_date: "2026-02-21",
        status: "agendado",
      },
    ];

    const expiring = listExpiringTrainingsByDate(trainings, now, 7);
    expect(expiring).toHaveLength(1);
    expect(expiring[0].id).toBe("t-2");
  });
});
