import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** @deprecated Eyebrow labels were removed in the redesign; ignored. */
  eyebrow?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
      <div className="min-w-0 max-w-3xl">
        <h1 className="font-display text-[1.75rem] leading-tight text-slate-900 sm:text-[2.125rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-slate-500">{description}</p>
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
