"use client";

import type { RefObject } from "react";
import { Bold, Heading2, Italic, List } from "lucide-react";

type DescriptionFormattingToolbarProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
};

type InlineFormat = {
  label: string;
  icon: typeof Bold;
  prefix: string;
  suffix: string;
  placeholder: string;
};

const inlineFormats: InlineFormat[] = [
  { label: "Bold", icon: Bold, prefix: "**", suffix: "**", placeholder: "bold text" },
  { label: "Italic", icon: Italic, prefix: "*", suffix: "*", placeholder: "italic text" },
];

export default function DescriptionFormattingToolbar({
  textareaRef,
  value,
  maxLength,
  onChange,
}: DescriptionFormattingToolbarProps) {
  function applyInlineFormat(format: InlineFormat) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const selected = value.slice(start, end) || format.placeholder;
    const replacement = `${format.prefix}${selected}${format.suffix}`;
    const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
    if (nextValue.length > maxLength) return;

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      const selectionStart = start + format.prefix.length;
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
      textarea.scrollTop = scrollTop;
    });
  }

  function applyLineFormat(prefix: string, placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
    const nextLine = value.indexOf("\n", selectionEnd);
    const lineEnd = nextLine === -1 ? value.length : nextLine;
    const selectedLines = value.slice(lineStart, lineEnd) || placeholder;
    const replacement = selectedLines
      .split("\n")
      .map((line) => `${prefix}${line || placeholder}`)
      .join("\n");
    const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`;
    if (nextValue.length > maxLength) return;

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(lineStart, lineStart + replacement.length);
      textarea.scrollTop = scrollTop;
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 px-2 py-2" aria-label="Description formatting">
      {inlineFormats.map((format) => {
        const Icon = format.icon;
        return (
          <button
            key={format.label}
            type="button"
            title={format.label}
            aria-label={`Format as ${format.label.toLowerCase()}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyInlineFormat(format)}
            className="app-icon-button app-icon-button-ghost app-icon-button-compact hover:!bg-white hover:!text-indigo-600 hover:shadow-sm"
          >
            <Icon size={16} />
          </button>
        );
      })}

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />

      <button
        type="button"
        title="Heading"
        aria-label="Format as heading"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyLineFormat("## ", "Section heading")}
        className="app-icon-button app-icon-button-ghost app-icon-button-compact hover:!bg-white hover:!text-indigo-600 hover:shadow-sm"
      >
        <Heading2 size={17} />
      </button>
      <button
        type="button"
        title="Bulleted list"
        aria-label="Format as bulleted list"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyLineFormat("- ", "List item")}
        className="app-icon-button app-icon-button-ghost app-icon-button-compact hover:!bg-white hover:!text-indigo-600 hover:shadow-sm"
      >
        <List size={17} />
      </button>
    </div>
  );
}
