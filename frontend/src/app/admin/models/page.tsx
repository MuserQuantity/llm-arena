"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ModelFormDrawer } from "@/components/admin/model-form-drawer";
import { ModelIcon } from "@/components/layout/model-icon";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiModels, ModelResponse } from "@/lib/api";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModel, setEditModel] = useState<ModelResponse | null>(null);
  const [deleteModel, setDeleteModel] = useState<ModelResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const data = await apiModels.list();
      setModels(data);
    } catch (e) {
      console.error("Failed to fetch models", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleDelete = async () => {
    if (!deleteModel) return;
    setDeleting(true);
    try {
      await apiModels.delete(deleteModel.id);
      setDeleteModel(null);
      fetchModels();
    } catch (e) {
      console.error("Failed to delete model", e);
    } finally {
      setDeleting(false);
    }
  };

  const handleDrawerClose = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setEditModel(null);
      fetchModels();
    }
  };

  const openEdit = (model: ModelResponse) => {
    setEditModel(model);
    setDrawerOpen(true);
  };

  return (
    <>
      <Topbar title="Admin > Models" />
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Model Registry</h1>
          <Button onClick={() => { setEditModel(null); setDrawerOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Model
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading models...</div>
        ) : models.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No models yet</p>
            <p className="text-sm">Click &quot;Add Model&quot; to register your first LLM model.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ModelIcon iconKey={model.icon_key} size="md" />
                      <span className="font-medium">{model.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{model.provider}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{model.model_id}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      model.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {model.status === "active" ? "Active" : "Archived"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(model.capabilities || []).map((cap) => (
                        <span key={cap} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/models/${model.id}/eval`)} title="View evaluations">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(model)} title="Edit model">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteModel(model)} title="Delete model" className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <ModelFormDrawer open={drawerOpen} onOpenChange={handleDrawerClose} editModel={editModel} />

        {/* Delete confirmation dialog */}
        <Dialog open={!!deleteModel} onOpenChange={(open) => { if (!open) setDeleteModel(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Model</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{deleteModel?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModel(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
