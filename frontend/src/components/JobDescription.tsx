"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const COLLAPSED_CHARACTERS = 520;
const SECTION_HEADING = /\b(about the role|responsibilities|key responsibilities|requirements|qualifications|preferred qualifications|what you(?:'|’)ll do|what we offer|benefits|skills|experience):\s*/giu;

function excerptAtWord(text: string, limit: number) {
  if (text.length <= limit) return text;
  const excerpt = text.slice(0, limit);
  const finalSpace = excerpt.lastIndexOf(" ");
  return `${excerpt.slice(0, finalSpace > limit * 0.75 ? finalSpace : limit).trim()}…`;
}

export function descriptionParagraphs(description: string) {
  const withSections = description
    .trim()
    .replace(/\r\n?/gu, "\n")
    .replace(SECTION_HEADING, "\n\n$1: ")
    .replace(/\s+([•▪◦])\s+/gu, "\n$1 ")
    .trim();

  const explicitBlocks = withSections
    .split(/\n{2,}/gu)
    .flatMap((block) => block.split(/\n(?=(?:[•▪◦]|[-*])\s+|#{1,3}\s)/gu))
    // A Markdown heading ends at its line break, even without a blank line after it.
    .flatMap((block) => {
      const heading = block.match(/^(#{1,3}\s[^\n]+)\n([\s\S]+)$/u);
      return heading ? [heading[1], heading[2]] : [block];
    })
    .map((block) => block.trim())
    .filter(Boolean);

  return explicitBlocks.flatMap((block) => {
    if (/^(?:[•▪◦]|[-*])\s+/u.test(block) || block.length <= 300) return [block];

    const sentences = block.split(/(?<=[.!?])\s+(?=[A-Z0-9])/gu);
    if (sentences.length === 1) return [block];

    const paragraphs: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if (current && `${current} ${sentence}`.length > 300) {
        paragraphs.push(current);
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }

    if (current) paragraphs.push(current);
    return paragraphs;
  });
}

function formattedInlineText(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/gu)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${index}-${part}`} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={`${index}-${part}`} className="italic text-slate-700">{part.slice(1, -1)}</em>;
      }
      return <Fragment key={`${index}-${part}`}>{part}</Fragment>;
    });
}

export default function JobDescription({
  description,
  collapsible = true,
  headingLevel = 3,
}: {
  description: string;
  collapsible?: boolean;
  headingLevel?: 3 | 4;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = collapsible && description.trim().length > COLLAPSED_CHARACTERS;
  const Heading = headingLevel === 3 ? "h3" : "h4";
  const visibleText = expanded || !isLong
    ? description
    : excerptAtWord(description, COLLAPSED_CHARACTERS);
  const blocks = descriptionParagraphs(visibleText);

  return (
    <div>
      <div className="max-w-[68ch] space-y-3 text-[0.9375rem] leading-7 text-slate-700">
        {blocks.map((block, index) => {
          const markdownHeading = block.match(/^#{1,3}\s+([\s\S]+)$/u);
          if (markdownHeading) {
            return (
              <Heading key={`${index}-${block.slice(0, 20)}`} className="pt-2 text-base font-semibold text-slate-900">
                {formattedInlineText(markdownHeading[1])}
              </Heading>
            );
          }

          const bullet = block.match(/^(?:[•▪◦]|[-*])\s+([\s\S]*)$/u);
          if (bullet) {
            return (
              <div key={`${index}-${block.slice(0, 20)}`} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-[0.7rem] h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                <p>{formattedInlineText(bullet[1])}</p>
              </div>
            );
          }

          const heading = block.startsWith("**")
            ? null
            : block.match(/^([^:]{2,40}):\s+([\s\S]+)$/u);
          if (heading) {
            return (
              <p key={`${index}-${block.slice(0, 20)}`}>
                <span className="font-semibold text-slate-800">{heading[1]}:</span>{" "}
                {formattedInlineText(heading[2])}
              </p>
            );
          }

          return <p key={`${index}-${block.slice(0, 20)}`}>{formattedInlineText(block)}</p>;
        })}
      </div>

      {isLong && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="app-expand-control mt-3 text-sm"
        >
          {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          {expanded ? "Show less" : "See more"}
        </button>
      )}
    </div>
  );
}
