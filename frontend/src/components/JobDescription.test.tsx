import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JobDescription, { descriptionParagraphs } from "@/components/JobDescription";

describe("JobDescription", () => {
  it("groups a dense description into readable paragraphs", () => {
    const text = [
      "Build accessible interfaces for customers and internal teams.",
      "Collaborate with designers and backend engineers on reliable releases.",
      "Document important decisions and review code carefully.",
      "Investigate production issues and improve automated test coverage.",
      "Support teammates through clear communication and practical feedback.",
    ].join(" ");

    expect(descriptionParagraphs(text).length).toBeGreaterThan(1);
  });

  it("collapses and expands a long description", () => {
    const ending = "This final requirement is only visible after expanding the description.";
    const description = `${"The candidate will build reliable interfaces and collaborate across teams. ".repeat(10)}${ending}`;
    render(<JobDescription description={description} />);

    expect(screen.queryByText(ending)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See more" }));
    expect(screen.getByText(/This final requirement is only visible/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders safe bold, italic, heading, and list formatting", () => {
    const { container } = render(
      <JobDescription description={"## Requirements\n\n- **React** experience\n\nWork *collaboratively*."} />,
    );

    expect(screen.getByRole("heading", { name: "Requirements" })).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("React");
    expect(container.querySelector("em")).toHaveTextContent("collaboratively");
  });

  it("does not interpret bold text at the start of a paragraph as a list", () => {
    const { container } = render(
      <JobDescription description="**Important:** Review the complete requirements before applying." />,
    );

    const boldText = container.querySelector("strong");
    expect(boldText).toHaveTextContent("Important:");
    expect(boldText?.closest("p")).not.toBeNull();
    expect(boldText?.closest(".flex.items-start")).toBeNull();
  });
});
