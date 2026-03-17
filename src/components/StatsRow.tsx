"use client";

export default function StatsRow() {
  const stats = [
    { label: "Total", value: "0" },
    { label: "Pending", value: "0" },
    { label: "In progress", value: "0" },
    { label: "Completed", value: "0" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}
