export type JobStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Job {
  id: string;
  title: string;
  description?: string;
  status: JobStatus;
  assignee?: string;
  location?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
