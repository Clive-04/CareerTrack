import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExpandableSkillList from "@/components/ExpandableSkillList";

const skills = ["React", "TypeScript", "Next.js", "CSS", "Testing", "Git", "Accessibility", "REST APIs"];

describe("ExpandableSkillList", () => {
  it("collapses wrapped skills to one row and expands the list", async () => {
    const scrollHeight = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(56);
    const clientHeight = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(24);

    render(<ExpandableSkillList skills={skills} />);

    const list = screen.getByRole("list", { name: "Resume skills" });
    expect(list).toHaveStyle({ maxHeight: "1.5rem", overflow: "hidden" });

    const seeMore = await screen.findByRole("button", { name: "See more" });
    expect(seeMore).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(seeMore);

    expect(screen.getByRole("button", { name: "See less" })).toHaveAttribute("aria-expanded", "true");
    expect(list).not.toHaveStyle({ maxHeight: "1.5rem" });

    scrollHeight.mockRestore();
    clientHeight.mockRestore();
  });

  it("does not show a control when the skills fit on one row", async () => {
    const scrollHeight = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(24);
    const clientHeight = vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(24);

    render(<ExpandableSkillList skills={["React", "TypeScript"]} />);

    await waitFor(() => expect(screen.queryByRole("button")).not.toBeInTheDocument());

    scrollHeight.mockRestore();
    clientHeight.mockRestore();
  });
});
