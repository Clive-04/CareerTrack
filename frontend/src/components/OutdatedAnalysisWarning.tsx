export default function OutdatedAnalysisWarning({
  reasons,
  message,
}: {
  reasons: string[];
  message: string;
}) {
  return (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">The AI analysis for this job is outdated.</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <p className="mt-2">{message}</p>
    </div>
  );
}
