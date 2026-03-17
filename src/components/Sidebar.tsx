"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <nav className="flex flex-col gap-1">
        <Link
          href="/jobs"
          className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Jobs
        </Link>
      </nav>
    </aside>
  );
}
