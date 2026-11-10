"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type ExpandableTextProps = {
  text: string;
  label?: string;
  collapsedLines?: number;
  className?: string;
};

export default function ExpandableText({
  text,
  label,
  collapsedLines = 2,
  className = "",
}: ExpandableTextProps) {
  const contentId = useId();
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [canExpand, setCanExpand] = useState(false);
  const expanded = expandedText === text;

  useLayoutEffect(() => {
    if (expanded) return;

    const measureOverflow = () => {
      const content = contentRef.current;
      if (!content) return;
      setCanExpand(content.scrollHeight > content.clientHeight + 1);
    };

    const frame = window.requestAnimationFrame(measureOverflow);
    window.addEventListener("resize", measureOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureOverflow);
    };
  }, [collapsedLines, expanded, text]);

  return (
    <div className={className}>
      <p
        ref={contentRef}
        id={contentId}
        className="whitespace-pre-wrap break-words"
        style={expanded ? undefined : {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: collapsedLines,
          overflow: "hidden",
        }}
      >
        {label && <span className="font-semibold text-slate-600">{label}: </span>}
        {text}
      </p>

      {canExpand && (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpandedText(expanded ? null : text)}
          className="app-expand-control group mt-1.5 text-xs"
        >
          {expanded ? (
            <ChevronUp className="transition-transform duration-200 group-hover:-translate-y-0.5" size={14} />
          ) : (
            <ChevronDown className="transition-transform duration-200 group-hover:translate-y-0.5" size={14} />
          )}
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
