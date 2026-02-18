import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, getQueryFn } from "./queryClient";
import { clearAuthToken, getAuthToken, setAuthToken } from "./auth-token";

describe("apiRequest", () => {
  afterEach(() => {
    clearAuthToken();
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("returns response when request succeeds", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

    const result = await apiRequest("GET", "/api/health");

    expect(fetchSpy).toHaveBeenCalledWith("/api/health", {
      method: "GET",
      headers: {},
      body: undefined,
      credentials: "include",
    });
    expect(result).toBe(response);
  });

  it("throws with status and body when request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("bad request", { status: 400, statusText: "Bad Request" }),
    );

    await expect(apiRequest("POST", "/api/items", { name: "x" })).rejects.toThrow(
      "400: bad request",
    );
  });

  it("clears auth token and redirects to login on 401", async () => {
    setAuthToken("token-123");
    window.history.replaceState({}, "", "/empresas");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("unauthorized", { status: 401, statusText: "Unauthorized" }),
    );

    await expect(apiRequest("GET", "/api/companies")).rejects.toThrow("401: unauthorized");

    expect(getAuthToken()).toBeNull();
    expect(window.location.pathname).toBe("/login");
    expect(window.location.search).toContain("redirect=%2Fempresas");
  });
});

describe("getQueryFn", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null on 401 when configured with returnNull", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));

    const queryFn = getQueryFn<{ id: number }>({ on401: "returnNull" });
    const result = await queryFn({ queryKey: ["/api/user"] } as never);

    expect(result).toBeNull();
  });

  it("throws on 401 when configured with throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("unauthorized", { status: 401, statusText: "Unauthorized" }),
    );

    const queryFn = getQueryFn<{ id: number }>({ on401: "throw" });

    await expect(queryFn({ queryKey: ["/api/user"] } as never)).rejects.toThrow(
      "401: unauthorized",
    );
  });

  it("returns parsed JSON on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );

    const queryFn = getQueryFn<{ id: number }>({ on401: "throw" });
    const result = await queryFn({ queryKey: ["/api/user"] } as never);

    expect(result).toEqual({ id: 1 });
  });
});
