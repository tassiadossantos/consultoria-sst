import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("calls onCheckedChange when clicked", () => {
    const onCheckedChange = vi.fn();

    render(<Checkbox aria-label="Aceite" onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Aceite" }));

    expect(onCheckedChange).toHaveBeenCalled();
  });

  it("respects disabled prop", () => {
    const onCheckedChange = vi.fn();

    render(
      <Checkbox aria-label="Bloqueado" disabled onCheckedChange={onCheckedChange} />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Bloqueado" }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
