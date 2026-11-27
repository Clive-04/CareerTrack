"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableSkillList({ skills }: {
  skills: string[];
}) {
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    if (expanded) return;

    const measureOverflow = () => {
      const list = listRef.current;
      if (!list) return;
      setCanExpand(list.scrollHeight > list.clientHeight + 1);
    };

    const frame = window.requestAnimationFrame(measureOverflow);
    window.addEventListener("resize", measureOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureOverflow);
    };
  }, [expanded, skills]);

  if (skills.length === 0) {
    return <span className="text-sm text-slate-500">No skills added</span>;
  }

  return (
    <div>
      <div
        ref={listRef}
        id={listId}
        role="list"
        aria-label="Resume skills"
        className="flex flex-wrap gap-2"
        style={expanded ? undefined : { maxHeight: "1.75rem", overflow: "hidden" }}
      >
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            role="listitem"
            className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.8125rem] text-slate-700"
          >
            {skill}
          </span>
        ))}
      </div>

      {canExpand && (
        <button
          type="button"
          aria-controls={listId}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="app-expand-control mt-1 text-[0.8125rem]"
        >
          {expanded ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
