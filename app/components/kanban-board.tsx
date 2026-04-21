"use client";

import { useState } from "react";
import { Todo, Status, COLUMNS } from "../types";
import { useLocalStorage } from "../hooks/use-local-storage";
import { Column } from "./column";
import { TodoModal, TodoFormData } from "./todo-modal";

export function KanbanBoard() {
  const [todos, setTodos, loaded] = useLocalStorage<Todo[]>(
    "kanban-todos",
    []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const openCreate = () => {
    setEditingTodo(null);
    setModalOpen(true);
  };

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTodo(null);
  };

  const handleSubmit = (data: TodoFormData) => {
    if (editingTodo) {
      setTodos((prev) =>
        prev.map((t) => (t.id === editingTodo.id ? { ...t, ...data } : t))
      );
    } else {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "backlog",
        createdAt: Date.now(),
      };
      setTodos((prev) => [...prev, newTodo]);
    }
  };

  const moveTodo = (todoId: string, newStatus: Status) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, status: newStatus } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="border-3 border-black rounded-xl bg-white px-8 py-4 shadow-[4px_4px_0px_0px_#1a1a1a] font-bold">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="border-b-3 border-black bg-white shadow-[0px_4px_0px_0px_#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-black text-2xl md:text-3xl tracking-tight">
            Kanban Board
          </h1>
          <button
            onClick={openCreate}
            className="bg-[#c77dff] border-3 border-black rounded-lg px-5 py-2.5 font-bold text-base shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-[0px_0px_0px_0px_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px] transition-all"
          >
            + New To-Do
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              todos={todos.filter((t) => t.status === col.id)}
              onDrop={moveTodo}
              onDelete={deleteTodo}
              onEdit={openEdit}
            />
          ))}
        </div>
      </main>

      <TodoModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        todo={editingTodo}
      />
    </>
  );
}
