import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExpandableText from "@/components/ExpandableText";

describe("ExpandableText", () => {
  it("offers expansion only when the rendered note is truncated", async () => {
    const scrollHeight = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(96);
    const clientHeight = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(40);

    render(<ExpandableText text="A detailed note that occupies more than two rendered lines." />);

    const seeMore = await screen.findByRole("button", { name: "See more" });
    expect(seeMore).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(seeMore);
    await waitFor(() => expect(screen.getByRole("button", { name: "See less" })).toHaveAttribute("aria-expanded", "true"));

    scrollHeight.mockRestore();
    clientHeight.mockRestore();
  });

  it("does not show an expansion control for a short note", async () => {
    const scrollHeight = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(32);
    const clientHeight = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(32);

    render(<ExpandableText text="Short note." />);

    await waitFor(() => expect(screen.queryByRole("button", { name: "See more" })).not.toBeInTheDocument());

    scrollHeight.mockRestore();
    clientHeight.mockRestore();
  });
});
