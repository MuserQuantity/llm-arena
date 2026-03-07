"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ModelFormDrawer } from "@/components/admin/model-form-drawer";
import { ModelIcon } from "@/components/layout/model-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { models } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export default function ModelsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Topbar title="Admin › Models" />
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Model Registry</h1>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Model
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead>API Key</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ModelIcon iconKey={model.icon_key} size="md" />
                    <span className="font-medium">{model.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {model.provider}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {model.model_id}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      model.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {model.status === "active" ? "Active" : "Archived"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {model.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  ••••••••
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <ModelFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </main>
    </>
  );
}
