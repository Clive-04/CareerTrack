import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DescriptionFormattingToolbar from "@/components/DescriptionFormattingToolbar";

function EditorHarness() {
  const [value, setValue] = useState("React experience");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <DescriptionFormattingToolbar
        textareaRef={textareaRef}
        value={value}
        maxLength={500}
        onChange={setValue}
      />
      <textarea ref={textareaRef} aria-label="Description" value={value} onChange={(event) => setValue(event.target.value)} />
    </>
  );
}

describe("DescriptionFormattingToolbar", () => {
  it("wraps selected text in safe bold formatting", () => {
    render(<EditorHarness />);
    const textarea = screen.getByLabelText("Description") as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 5);

    fireEvent.click(screen.getByRole("button", { name: "Format as bold" }));

    expect(textarea).toHaveValue("**React** experience");
  });
});
