import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { UsuariosTableFooter } from "@/pages/usuarios/components/UsuariosTableFooter";

describe("UsuariosTableFooter", () => {
  it("exibe totais, corrige setas de página e desabilita bordas", async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <UsuariosTableFooter
        totalUsers={3}
        activeCount={2}
        inactiveCount={1}
        page={1}
        totalPages={3}
        onPrevPage={onPrev}
        onNextPage={onNext}
      />,
    );
    expect(
      screen.getByText(/total de 3 usuários cadastrados/i),
    ).toBeInTheDocument();
    expect(screen.getByText("2 Ativos")).toBeInTheDocument();
    const prev = screen
      .getByRole("button", { name: /chevron_left/i });
    expect(prev).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: /chevron_right/i }),
    );
    expect(onNext).toHaveBeenCalled();
    rerender(
      <UsuariosTableFooter
        totalUsers={3}
        activeCount={2}
        inactiveCount={1}
        page={3}
        totalPages={3}
        onPrevPage={onPrev}
        onNextPage={onNext}
      />,
    );
    expect(
      screen.getByRole("button", { name: /chevron_right/i }),
    ).toBeDisabled();
  });
});
