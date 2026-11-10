import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OutdatedAnalysisWarning from "@/components/OutdatedAnalysisWarning";

describe("OutdatedAnalysisWarning", () => {
  it("shows every stale reason and the supplied guidance", () => {
    render(
      <OutdatedAnalysisWarning
        reasons={["The job description changed.", "The resume content changed."]}
        message="Analyze again before applying."
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("The job description changed.")).toBeInTheDocument();
    expect(screen.getByText("The resume content changed.")).toBeInTheDocument();
    expect(screen.getByText("Analyze again before applying.")).toBeInTheDocument();
  });
});
