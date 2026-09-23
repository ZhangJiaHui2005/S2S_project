"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  Baby,
  Bike,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Car,
  CircleAlert,
  CookingPot,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Headphones,
  House,
  LampDesk,
  Laptop,
  Leaf,
  LoaderCircle,
  Monitor,
  Music,
  Package,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  Smartphone,
  Tags,
  TentTree,
  Trash2,
  Wrench,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Category {
  category_id: number;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  _count: { Item: number };
}

interface IconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

const categoryIcons: IconOption[] = [
  { name: "BookOpen", label: "Sách", icon: BookOpen },
  { name: "GraduationCap", label: "Học tập", icon: GraduationCap },
  { name: "Laptop", label: "Laptop", icon: Laptop },
  { name: "Monitor", label: "Màn hình", icon: Monitor },
  { name: "Smartphone", label: "Điện thoại", icon: Smartphone },
  { name: "Headphones", label: "Âm thanh", icon: Headphones },
  { name: "Camera", label: "Máy ảnh", icon: Camera },
  { name: "Shirt", label: "Trang phục", icon: Shirt },
  { name: "Bike", label: "Xe đạp", icon: Bike },
  { name: "Car", label: "Phương tiện", icon: Car },
  { name: "Wrench", label: "Dụng cụ", icon: Wrench },
  { name: "Gamepad2", label: "Trò chơi", icon: Gamepad2 },
  { name: "Music", label: "Âm nhạc", icon: Music },
  { name: "Dumbbell", label: "Thể thao", icon: Dumbbell },
  { name: "CookingPot", label: "Nhà bếp", icon: CookingPot },
  { name: "Baby", label: "Trẻ em", icon: Baby },
  { name: "BriefcaseBusiness", label: "Công việc", icon: BriefcaseBusiness },
  { name: "Palette", label: "Nghệ thuật", icon: Palette },
  { name: "TentTree", label: "Ngoài trời", icon: TentTree },
  { name: "House", label: "Gia dụng", icon: House },
  { name: "LampDesk", label: "Nội thất", icon: LampDesk },
  { name: "Leaf", label: "Cây xanh", icon: Leaf },
  { name: "Package", label: "Khác", icon: Package },
  { name: "Tags", label: "Danh mục", icon: Tags },
];

const iconByName = new Map(categoryIcons.map((option) => [option.name, option.icon]));

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || !("message" in data)) return fallback;
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(" ");
  return typeof message === "string" ? message : fallback;
}

async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const response = await fetch("/api/categories", {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Không thể tải danh sách danh mục."));
  }

  return Array.isArray(data) ? (data as Category[]) : [];
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Tags");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setCategories(await fetchCategories());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải danh sách danh mục.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchCategories(controller.signal)
      .then(setCategories)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải danh sách danh mục.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) return categories;
    return categories.filter((category) =>
      category.name.toLocaleLowerCase("vi").includes(normalizedQuery),
    );
  }, [categories, query]);

  function openCreateModal() {
    setEditing(null);
    setName("");
    setIcon("Tags");
    setError("");
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditing(category);
    setName(category.name);
    setIcon(iconByName.has(category.icon ?? "") ? category.icon! : "Tags");
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      setError("Tên danh mục phải có từ 2 đến 80 ký tự.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        editing ? `/api/categories/${editing.category_id}` : "/api/categories",
        {
          method: editing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: normalizedName, icon }),
        },
      );
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Không thể lưu danh mục."));
      }

      setModalOpen(false);
      setNotice(editing ? "Đã cập nhật danh mục." : "Đã thêm danh mục mới.");
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể lưu danh mục.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/categories/${deleteTarget.category_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, "Không thể xóa danh mục."));
      }

      setDeleteTarget(null);
      setNotice("Đã xóa danh mục.");
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể xóa danh mục.",
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý danh mục</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và sắp xếp nhóm vật phẩm được sử dụng trên S2S.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus />
          Thêm danh mục
        </Button>
      </div>

      {notice && (
        <Alert variant="success">
          <Tags />
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {error && !modalOpen && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Không thể thực hiện</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Danh sách danh mục</CardTitle>
            <CardDescription>
              {categories.length} danh mục, {categories.reduce((sum, item) => sum + item._count.Item, 0)} vật phẩm
            </CardDescription>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm danh mục..."
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void loadCategories()}
              disabled={loading}
              aria-label="Tải lại danh sách"
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin" />
              Đang tải danh mục...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
                <Tags className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Không có danh mục phù hợp</p>
                <p className="text-sm text-muted-foreground">
                  {query ? "Hãy thử từ khóa khác." : "Thêm danh mục đầu tiên để bắt đầu."}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Số vật phẩm</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => {
                  const CategoryIcon = iconByName.get(category.icon ?? "") ?? Tags;
                  return (
                    <TableRow key={category.category_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                            <CategoryIcon className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.icon ?? "Tags"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category._count.Item}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(category.updated_at).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditModal(category)}
                            aria-label={`Chỉnh sửa ${category.name}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(category)}
                            disabled={category._count.Item > 0}
                            title={category._count.Item > 0 ? "Không thể xóa danh mục đang có vật phẩm" : undefined}
                            aria-label={`Xóa ${category.name}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="contents">
            <DialogHeader>
              <DialogTitle>{editing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}</DialogTitle>
              <DialogDescription>
                Đặt tên và chọn biểu tượng Lucide hiển thị cho danh mục.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {error && (
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircleIcon />
                  <AlertTitle>Error!!!</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="category-name">Tên danh mục</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  autoFocus
                  placeholder="Ví dụ: Giáo trình"
                  disabled={saving}
                />
              </div>

              <fieldset className="space-y-2" disabled={saving}>
                <legend className="text-sm font-medium">Biểu tượng</legend>
                <div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto rounded-lg border p-2 sm:grid-cols-8">
                  {categoryIcons.map((option) => {
                    const IconComponent = option.icon;
                    const selected = icon === option.name;
                    return (
                      <button
                        key={option.name}
                        type="button"
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                        )}
                        onClick={() => setIcon(option.name)}
                        aria-label={option.label}
                        aria-pressed={selected}
                        title={option.label}
                      >
                        <IconComponent className="size-5" />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Đã chọn: {categoryIcons.find((option) => option.name === icon)?.label}
                </p>
              </fieldset>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <LoaderCircle className="animate-spin" />}
                {editing ? "Lưu thay đổi" : "Thêm danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục “{deleteTarget?.name}” sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting && <LoaderCircle className="animate-spin" />}
              Xóa danh mục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
