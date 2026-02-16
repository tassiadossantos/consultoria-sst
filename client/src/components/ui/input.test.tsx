import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("renders with provided type and updates value", () => {
    render(<Input type="email" placeholder="E-mail" />);

    const input = screen.getByPlaceholderText("E-mail");
    expect(input).toHaveAttribute("type", "email");

    fireEvent.change(input, { target: { value: "contato@empresa.com" } });
    expect(input).toHaveValue("contato@empresa.com");
  });

  it("applies custom className", () => {
    render(<Input aria-label="Campo" className="custom-class" />);

    expect(screen.getByLabelText("Campo")).toHaveClass("custom-class");
  });
});
