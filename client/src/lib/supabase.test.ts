import { describe, expect, it } from "vitest";

import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

describe("supabase config", () => {
  it("reports whether supabase is configured", () => {
    expect(typeof isSupabaseConfigured()).toBe("boolean");
  });

  it("getSupabaseClient behavior matches config state", () => {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      expect(client).toBeDefined();
      return;
    }

    expect(() => getSupabaseClient()).toThrow("Supabase não configurado");
  });
});
