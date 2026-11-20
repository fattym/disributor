export default function NotAvailable({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
      <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">Not available yet</p>
        <p className="mt-1">{reason}</p>
      </div>
    </div>
  );
}
