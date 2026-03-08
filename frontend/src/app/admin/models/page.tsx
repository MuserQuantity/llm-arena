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
import { apiModels, apiDashboard, ModelResponse, ModelEvalSummaryResponse } from "@/lib/api";
import { Plus, Pencil, Trash2, Play, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [evalProgress, setEvalProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModel, setEditModel] = useState<ModelResponse | null>(null);
  const [deleteModel, setDeleteModel] = useState<ModelResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const data = await apiModels.list();
      setModels(data);
      const progressMap: Record<string, { done: number; total: number }> = {};
      await Promise.all(
        data.map(async (m) => {
          try {
            const evalData: ModelEvalSummaryResponse = await apiDashboard.modelEval(m.id);
            const total = evalData.tasks.length;
            const done = evalData.tasks.filter((t) => t.run_status === "done").length;
            progressMap[m.id] = { done, total };
          } catch {
            progressMap[m.id] = { done: 0, total: 0 };
          }
        })
      );
      setEvalProgress(progressMap);
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
      <Topbar title="模型管理" />
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">模型管理</h1>
            <p className="text-sm text-muted-foreground mt-1">注册和管理被评测的 LLM 模型，点击"开始评测"进入评测流程</p>
          </div>
          <Button onClick={() => { setEditModel(null); setDrawerOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> 添加模型
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">加载模型列表中...</div>
        ) : models.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">暂无模型</p>
            <p className="text-sm">点击"添加模型"注册第一个 LLM 模型</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>评测进度</TableHead>
                <TableHead className="w-48">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => {
                const progress = evalProgress[model.id];
                return (
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
                        {model.status === "active" ? "活跃" : "已归档"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {progress && progress.total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${(progress.done / progress.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {progress.done}/{progress.total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">未开始</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/models/${model.id}/eval`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            开始评测
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(model)} title="编辑模型">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteModel(model)} title="删除模型" className="text-red-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <ModelFormDrawer open={drawerOpen} onOpenChange={handleDrawerClose} editModel={editModel} />

        <Dialog open={!!deleteModel} onOpenChange={(open) => { if (!open) setDeleteModel(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除模型</DialogTitle>
              <DialogDescription>
                确定要删除 &quot;{deleteModel?.name}&quot; 吗？此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModel(null)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "删除中..." : "确认删除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
