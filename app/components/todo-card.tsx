"use client";

import { Todo } from "../types";

const PRIORITY_STYLES: Record<string, { bg: string; label: string }> = {
  low: { bg: "bg-[#6bff9d]", label: "Low" },
  medium: { bg: "bg-[#ffd93d]", label: "Medium" },
  high: { bg: "bg-[#ff6b9d]", label: "High" },
};

interface TodoCardProps {
  todo: Todo;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

export function TodoCard({ todo, onDelete, onEdit }: TodoCardProps) {
  const priority = PRIORITY_STYLES[todo.priority];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", todo.id);
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onClick={() => onEdit(todo)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(todo);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${todo.title}`}
      className="bg-white border-3 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_#1a1a1a] cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-[4px_6px_0px_0px_#1a1a1a] focus:outline-none focus-visible:shadow-[4px_6px_0px_0px_#1a1a1a] focus-visible:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-base leading-tight break-words min-w-0 flex-1">
          {todo.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
          className="shrink-0 w-7 h-7 flex items-center justify-center bg-[#ff6b9d] border-2 border-black rounded font-bold text-sm shadow-[2px_2px_0px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          aria-label="Delete todo"
        >
          ×
        </button>
      </div>
      {todo.description && (
        <p className="text-sm text-gray-700 mb-3 break-words">
          {todo.description}
        </p>
      )}
      <span
        className={`inline-block ${priority.bg} border-2 border-black rounded-full px-3 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1a1a1a]`}
      >
        {priority.label}
      </span>
    </div>
  );
}
