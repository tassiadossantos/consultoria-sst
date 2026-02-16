import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders and updates text", () => {
    render(<Textarea placeholder="Descreva" />);

    const textarea = screen.getByPlaceholderText("Descreva");
    fireEvent.change(textarea, { target: { value: "Texto de teste" } });

    expect(textarea).toHaveValue("Texto de teste");
  });

  it("supports disabled state", () => {
    render(<Textarea aria-label="Descrição" disabled />);

    expect(screen.getByLabelText("Descrição")).toBeDisabled();
  });
});
