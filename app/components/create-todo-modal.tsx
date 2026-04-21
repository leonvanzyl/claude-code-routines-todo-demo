"use client";

import { useState } from "react";
import { Priority } from "../types";

interface CreateTodoModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, priority: Priority) => void;
}

export function CreateTodoModal({
  open,
  onClose,
  onCreate,
}: CreateTodoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim(), priority);
    setTitle("");
    setDescription("");
    setPriority("medium");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="relative bg-white border-3 border-black rounded-xl shadow-[8px_8px_0px_0px_#1a1a1a] w-full max-w-md p-6 flex flex-col gap-4"
      >
        <h2 className="font-black text-xl">New To-Do</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="font-bold text-sm">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            className="border-3 border-black rounded-lg px-3 py-2 text-base shadow-[3px_3px_0px_0px_#1a1a1a] focus:shadow-[1px_1px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="font-bold text-sm">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some details..."
            rows={3}
            className="border-3 border-black rounded-lg px-3 py-2 text-base shadow-[3px_3px_0px_0px_#1a1a1a] focus:shadow-[1px_1px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm">Priority</span>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as Priority[]).map((p) => {
              const colors: Record<Priority, string> = {
                low: "#6bff9d",
                medium: "#ffd93d",
                high: "#ff6b9d",
              };
              const selected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 border-3 border-black rounded-lg py-2 font-bold text-sm capitalize transition-all ${
                    selected
                      ? "shadow-[1px_1px_0px_0px_#1a1a1a] translate-x-[2px] translate-y-[2px]"
                      : "shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px]"
                  }`}
                  style={{ backgroundColor: colors[p] }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-3 border-black rounded-lg py-2.5 font-bold bg-white shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 border-3 border-black rounded-lg py-2.5 font-bold bg-[#6bcbff] shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
