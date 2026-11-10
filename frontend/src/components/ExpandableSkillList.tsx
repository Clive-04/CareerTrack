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
    return <span className="text-xs text-gray-400">No skills added</span>;
  }

  return (
    <div>
      <div
        ref={listRef}
        id={listId}
        role="list"
        aria-label="Resume skills"
        className="flex flex-wrap gap-2"
        style={expanded ? undefined : { maxHeight: "1.5rem", overflow: "hidden" }}
      >
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            role="listitem"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
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
          className="app-expand-control group mt-1.5 text-[10px]"
        >
          {expanded ? (
            <ChevronUp className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:-rotate-6" size={11} />
          ) : (
            <ChevronDown className="transition-transform duration-200 ease-out group-hover:translate-y-0.5 group-hover:rotate-6" size={11} />
          )}
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
