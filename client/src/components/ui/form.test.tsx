import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import { Input } from "./input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

type FormValues = {
  name: string;
};

function RequiredNameForm() {
  const form = useForm<FormValues>({
    defaultValues: { name: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Nome obrigatório" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome" {...field} />
              </FormControl>
              <FormDescription>Informe o nome completo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <button type="submit">Salvar</button>
      </form>
    </Form>
  );
}

function MessageFallbackForm() {
  const form = useForm<FormValues>({
    defaultValues: { name: "Maria" },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome" {...field} />
              </FormControl>
              <FormMessage>Mensagem auxiliar</FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe("Form components", () => {
  it("shows validation message and invalid state on submit", async () => {
    render(<RequiredNameForm />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    const input = await screen.findByPlaceholderText("Nome");

    expect(screen.getByText("Nome obrigatório")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby");
  });

  it("renders fallback message when there is no error", () => {
    render(<MessageFallbackForm />);

    expect(screen.getByText("Mensagem auxiliar")).toBeInTheDocument();
  });
});
