"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatsRow from "@/components/StatsRow";
import JobsTable from "@/components/JobsTable";
import NewJobPanel from "@/components/NewJobPanel";
import DetailPanel from "@/components/DetailPanel";
import type { Job } from "@/types/job";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newPanelOpen, setNewPanelOpen] = useState(false);

  useEffect(() => {
    // TODO: load jobs from Firestore via getJobs()
    setJobs([]);
  }, []);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Jobs</h1>
            <button
              type="button"
              onClick={() => setNewPanelOpen(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              New job
            </button>
          </div>
          <StatsRow />
          <JobsTable jobs={jobs} onSelectJob={handleSelectJob} />
        </main>
      </div>
      <NewJobPanel
        isOpen={newPanelOpen}
        onClose={() => setNewPanelOpen(false)}
        onSubmit={() => {}}
      />
      <DetailPanel
        job={selectedJob}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
