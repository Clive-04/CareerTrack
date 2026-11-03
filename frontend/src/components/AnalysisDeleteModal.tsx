import { Trash2 } from "lucide-react";

export default function AnalysisDeleteModal({
  resumeName,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  resumeName: string;
  deleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-analysis-title" aria-describedby="delete-analysis-description" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 size={21} aria-hidden="true" />
        </div>
        <h3 id="delete-analysis-title" className="mt-5 text-lg font-bold">Delete this saved analysis?</h3>
        <p id="delete-analysis-description" className="mt-2 text-sm leading-6 text-slate-600">The result for {resumeName} will be permanently removed. Your resume and saved job will remain.</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button type="button" disabled={deleting} onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={deleting} onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Delete analysis"}</button>
        </div>
      </section>
    </div>
  );
}
