"use client";

export default function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <input
        type="search"
        placeholder="Search jobs..."
        className="max-w-md flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
    </header>
  );
}
