export type Priority = "low" | "medium" | "high";
export type Status = "backlog" | "in-progress" | "completed";

export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: number;
}

export const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: "backlog", label: "Backlogged", color: "#6bcbff" },
  { id: "in-progress", label: "In Progress", color: "#ffd93d" },
  { id: "completed", label: "Completed", color: "#6bff9d" },
];
