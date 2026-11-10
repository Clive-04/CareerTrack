import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AnalysisDeleteModal from "@/components/AnalysisDeleteModal";

describe("AnalysisDeleteModal", () => {
  it("describes the target and calls both actions", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<AnalysisDeleteModal resumeName="Frontend Resume" deleting={false} error="" onCancel={onCancel} onConfirm={onConfirm} />);

    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/Frontend Resume/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete analysis" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables actions while deleting and displays an error", () => {
    render(<AnalysisDeleteModal resumeName="Resume" deleting error="Unable to delete analysis." onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to delete analysis.");
  });
});
