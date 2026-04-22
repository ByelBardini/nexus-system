import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  PermissionCheckbox,
  SectorCheckbox,
} from "@/pages/cargos/CargoModalPermissionToggles";

describe("PermissionCheckbox", () => {
  it("chama onChange ao clicar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionCheckbox checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("não dispara onChange duas vezes por clique", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionCheckbox checked onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("SectorCheckbox", () => {
  it("alterna e repassa boolean para onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SectorCheckbox checked={false} onChange={onChange} />,
    );
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(true);

    onChange.mockClear();
    rerender(<SectorCheckbox checked onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
