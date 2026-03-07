"use client";

import React from "react";
import { Topbar } from "@/components/layout/topbar";
import { TaskForm } from "@/components/admin/task-form";

export default function TasksPage() {
  return (
    <>
      <Topbar title="Admin › Tasks › New Task" />
      <main className="p-8">
        <h1 className="text-2xl font-extrabold mb-6">Create Task</h1>
        <TaskForm />
      </main>
    </>
  );
}
