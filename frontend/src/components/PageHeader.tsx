import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
};



export default function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        {eyebrow && (
            <p className="text-sm font-medium text-blue-600">
                {eyebrow}
            </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex shrink-0 items-center gap-3">
          {action}
        </div>
      )}
    </section>
  );
}