"use client";

import type { Job } from "@/types/job";

interface JobsTableProps {
  jobs: Job[];
  onSelectJob?: (job: Job) => void;
}

export default function JobsTable({ jobs, onSelectJob }: JobsTableProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="text-sm text-zinc-500">Filter pills</span>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Due date</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                No jobs yet
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr
                key={job.id}
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                onClick={() => onSelectJob?.(job)}
              >
                <td className="px-4 py-3">{job.title}</td>
                <td className="px-4 py-3">{job.status}</td>
                <td className="px-4 py-3">{job.assignee ?? "—"}</td>
                <td className="px-4 py-3">{job.dueDate ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
