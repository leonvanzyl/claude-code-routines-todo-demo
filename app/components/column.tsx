"use client";

import { useState } from "react";
import { Todo, Status } from "../types";
import { TodoCard } from "./todo-card";

interface ColumnProps {
  id: Status;
  label: string;
  color: string;
  todos: Todo[];
  onDrop: (todoId: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

export function Column({
  id,
  label,
  color,
  todos,
  onDrop,
  onDelete,
  onEdit,
}: ColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`flex flex-col border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_#1a1a1a] min-h-[500px] transition-shadow ${
        dragOver ? "shadow-[8px_8px_0px_0px_#1a1a1a]" : ""
      }`}
      style={{ backgroundColor: dragOver ? `${color}33` : "#fff" }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const todoId = e.dataTransfer.getData("text/plain");
        if (todoId) onDrop(todoId, id);
      }}
    >
      <div
        className="border-b-3 border-black rounded-t-xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: color }}
      >
        <h2 className="font-black text-lg tracking-tight">{label}</h2>
        <span className="bg-white border-2 border-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_0px_#1a1a1a]">
          {todos.length}
        </span>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-3">
        {todos.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8 font-medium">
            Drop items here
          </p>
        )}
        {todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
