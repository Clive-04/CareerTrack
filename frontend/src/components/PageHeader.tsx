import type { CSSProperties, ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="app-enter flex flex-col justify-between gap-4 sm:flex-row sm:items-end" style={{ "--i": 0 } as CSSProperties}>
      <div className="min-w-0 max-w-3xl">
        <h1 className="font-display text-[1.75rem] leading-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-6 text-slate-500">{description}</p>
        )}
      </div>

      {action && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
          {action}
        </div>
      )}
    </header>
  );
}
