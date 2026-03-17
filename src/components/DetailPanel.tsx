"use client";

import type { Job } from "@/types/job";

interface DetailPanelProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailPanel({ job, isOpen, onClose }: DetailPanelProps) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <h2 className="font-semibold">Job details</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Close
        </button>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <p className="text-sm text-zinc-500">Title</p>
          <p className="font-medium">{job.title}</p>
        </div>
        {job.description && (
          <div>
            <p className="text-sm text-zinc-500">Description</p>
            <p>{job.description}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-zinc-500">Status</p>
          <p>{job.status}</p>
        </div>
        {job.assignee && (
          <div>
            <p className="text-sm text-zinc-500">Assignee</p>
            <p>{job.assignee}</p>
          </div>
        )}
        {job.dueDate && (
          <div>
            <p className="text-sm text-zinc-500">Due date</p>
            <p>{job.dueDate}</p>
          </div>
        )}
      </div>
    </div>
  );
}
