"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiDimensions, DimensionResponse } from "@/lib/api";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";

export default function DimensionsPage() {
  const [dimensions, setDimensions] = useState<DimensionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDim, setEditDim] = useState<DimensionResponse | null>(null);
  const [deleteDim, setDeleteDim] = useState<DimensionResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const d = await apiDimensions.list();
      setDimensions(d);
    } catch (e) {
      console.error(e);
      toast.error("加载维度列表失败");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteDim) return;
    setDeleting(true);
    try {
      await apiDimensions.delete(deleteDim.id);
      toast.success(`已删除维度「${deleteDim.name}」`);
      setDeleteDim(null);
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("删除失败", { description: msg });
    } finally { setDeleting(false); }
  };

  return (
    <>
      <Topbar title="维度管理" />
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">维度管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              管理评测维度。维度用于对评测任务进行分类，如"代码能力"、"推理能力"、"创意写作"等
            </p>
          </div>
          <Button onClick={() => { setEditDim(null); setDrawerOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> 新建维度
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">加载维度列表中...</div>
        ) : dimensions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-semibold mb-2">暂无维度</p>
            <p className="text-sm mb-4">点击"新建维度"创建第一个评测维度，例如"代码能力"、"推理"</p>
            <Button onClick={() => { setEditDim(null); setDrawerOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> 新建维度
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-28">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dimensions.map(dim => (
                <TableRow key={dim.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-medium">{dim.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{dim.slug}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {dim.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(dim.created_at).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditDim(dim); setDrawerOpen(true); }} title="编辑">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteDim(dim)} className="text-red-500 hover:text-red-600" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DimensionDrawer
          open={drawerOpen}
          onOpenChange={o => { setDrawerOpen(o); if (!o) { setEditDim(null); fetchData(); } }}
          editDim={editDim}
        />

        <Dialog open={!!deleteDim} onOpenChange={o => { if (!o) setDeleteDim(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除维度</DialogTitle>
              <DialogDescription>
                确定要删除维度「{deleteDim?.name}」吗？如果该维度下还有任务，将无法删除。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDim(null)}>取消</Button>
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

function DimensionDrawer({ open, onOpenChange, editDim }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editDim: DimensionResponse | null;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!editDim;

  useEffect(() => {
    if (editDim) {
      setName(editDim.name);
      setSlug(editDim.slug);
      setDescription(editDim.description || "");
    } else {
      setName("");
      setSlug("");
      setDescription("");
    }
    setError("");
  }, [editDim, open]);

  const autoSlug = (input: string) => {
    return input
      .toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && !slug) {
      setSlug(autoSlug(val));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("请填写维度名称"); return; }
    if (!slug.trim()) { setError("请填写 Slug"); return; }
    setSaving(true);
    setError("");
    try {
      if (isEdit && editDim) {
        await apiDimensions.update(editDim.id, { name: name.trim(), slug: slug.trim(), description: description.trim() });
        toast.success(`维度「${name.trim()}」已更新`);
      } else {
        await apiDimensions.create({ name: name.trim(), slug: slug.trim(), description: description.trim() });
        toast.success(`维度「${name.trim()}」已创建`);
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">{isEdit ? "编辑维度" : "新建维度"}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? "修改维度信息。" : "创建一个新的评测维度，用于对任务进行分类。"}
            </p>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">名称 <span className="text-red-500">*</span></label>
            <Input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="例如：代码能力"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">维度的显示名称，将在排行榜和评测结果中展示</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slug <span className="text-red-500">*</span></label>
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="例如：code-quality"
              className="h-10 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">URL 友好的标识符，只能包含小写字母、数字和连字符</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">描述</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简要描述这个评测维度衡量的能力..."
              rows={3}
              className="resize-y min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">可选。会传递给 Judge 模型作为评分参考</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : isEdit ? "更新维度" : "创建维度"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
