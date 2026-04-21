"use client";

import { useMemo, useState } from "react";
import { Todo, Status, Priority, COLUMNS } from "../types";
import { useLocalStorage } from "../hooks/use-local-storage";
import { Column } from "./column";
import { TodoModal, TodoFormData } from "./todo-modal";

type PriorityFilter = Priority | "all";

const PRIORITY_FILTERS: { value: PriorityFilter; label: string; color: string }[] = [
  { value: "all", label: "All", color: "#ffffff" },
  { value: "low", label: "Low", color: "#6bff9d" },
  { value: "medium", label: "Medium", color: "#ffd93d" },
  { value: "high", label: "High", color: "#ff6b9d" },
];

export function KanbanBoard() {
  const [todos, setTodos, loaded] = useLocalStorage<Todo[]>(
    "kanban-todos",
    []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

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

  const filtersActive = searchQuery.trim() !== "" || priorityFilter !== "all";

  const filteredTodos = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return todos.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (needle === "") return true;
      return (
        t.title.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle)
      );
    });
  }, [todos, searchQuery, priorityFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
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
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search todos..."
              aria-label="Search todos"
              className="w-full border-3 border-black rounded-lg px-3 py-2 text-base bg-white shadow-[3px_3px_0px_0px_#1a1a1a] focus:shadow-[1px_1px_0px_0px_#1a1a1a] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
            />
          </div>
          <div
            role="group"
            aria-label="Filter by priority"
            className="flex flex-wrap items-center gap-2"
          >
            {PRIORITY_FILTERS.map((f) => {
              const selected = priorityFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setPriorityFilter(f.value)}
                  aria-pressed={selected}
                  style={{ backgroundColor: f.color }}
                  className={`border-3 border-black rounded-lg px-3 py-1.5 font-bold text-sm transition-all ${
                    selected
                      ? "shadow-[1px_1px_0px_0px_#1a1a1a] translate-x-[2px] translate-y-[2px]"
                      : "shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-bold text-sm underline underline-offset-4 hover:no-underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const visible = filteredTodos.filter((t) => t.status === col.id);
            const total = todos.filter((t) => t.status === col.id).length;
            return (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                todos={visible}
                totalCount={filtersActive ? total : undefined}
                onDrop={moveTodo}
                onDelete={deleteTodo}
                onEdit={openEdit}
              />
            );
          })}
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
