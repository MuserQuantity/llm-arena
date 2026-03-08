"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ModelIcon } from "@/components/layout/model-icon";
import { apiDashboard, SummaryResponse } from "@/lib/api";
import Link from "next/link";
import { Eye, BarChart3, ClipboardCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

function scoreBg(score: number | null | undefined): string {
  if (score == null) return "";
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  if (score >= 40) return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

export default function SummaryPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await apiDashboard.summary()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <><Topbar title="评测汇总" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">加载汇总数据中...</div></main></>;
  if (!data) return <><Topbar title="评测汇总" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">暂无数据</div></main></>;

  return (
    <>
      <Topbar title="评测汇总" />
      <main className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold">评测汇总</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          所有模型在各维度上的归一化评分（百分制）。点击分数单元格可跳转到对应模型的评测详情页。
        </p>

        {data.models.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Info className="w-5 h-5" />
              <p className="text-lg font-semibold">暂无评测数据</p>
            </div>
            <p className="text-sm mb-4">请按以下步骤开始评测：</p>
            <div className="text-sm space-y-1 max-w-md mx-auto text-left bg-secondary rounded-lg p-4 mb-4">
              <p>1. 在<strong>任务管理</strong>中创建评测维度和任务</p>
              <p>2. 在<strong>模型管理</strong>中注册 LLM 模型</p>
              <p>3. 在侧边栏设置 <strong>Judge 模型</strong></p>
              <p>4. 点击模型的<strong>"开始评测"</strong>按钮执行任务并评分</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link href="/admin/models">
                <Button variant="outline" size="sm">前往模型管理</Button>
              </Link>
              <Link href="/admin/tasks">
                <Button variant="outline" size="sm">前往任务管理</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">模型</TableHead>
                  {data.dimensions.map(dim => (
                    <TableHead key={dim.id} className="text-center">{dim.name}</TableHead>
                  ))}
                  <TableHead className="text-center">总体均分</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.models.map(model => (
                  <TableRow key={model.model_id}>
                    <TableCell className="sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-2">
                        <ModelIcon iconKey={model.model_icon_key} size="sm" />
                        <div>
                          <span className="font-medium">{model.model_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{model.provider}</span>
                        </div>
                      </div>
                    </TableCell>
                    {data.dimensions.map(dim => {
                      const score = model.dimensions[dim.name];
                      return (
                        <TableCell key={dim.id} className="text-center">
                          {score != null ? (
                            <Link href={`/models/${model.model_id}/eval`} title={`查看 ${model.model_name} 的 ${dim.name} 评测详情`}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${scoreBg(score)}`}>
                                {score.toFixed(1)}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      {model.overall_avg != null ? (
                        <span className={`inline-flex items-center px-3 py-0.5 rounded text-sm font-extrabold ${scoreBg(model.overall_avg)}`}>
                          {model.overall_avg.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/models/${model.model_id}/eval`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <ClipboardCheck className="w-3.5 h-3.5" /> 评测详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  );
}
