import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges and resolves Tailwind classes", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("supports conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe(
      "base visible",
    );
  });
});
