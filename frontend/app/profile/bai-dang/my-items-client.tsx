"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  Package,
  PackagePlus,
  Trash2,
} from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteItem, fetchMyItems, ItemsResponse } from "@/lib/items";

interface MyItemsClientProps {
  user: {
    id: string | number;
    name: string;
  };
}

export default function MyItemsClient({}: MyItemsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [itemsData, setItemsData] = useState<ItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback((pageToLoad: number) => {
    setLoading(true);
    setError(null);
    fetchMyItems({ page: pageToLoad, limit: 12 })
      .then((res) => {
        setItemsData(res);
      })
      .catch((err: Error) => setError(err.message || "Không thể tải danh sách bài đăng"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let isCancelled = false;
    fetchMyItems({ page: currentPage, limit: 12 })
      .then((res) => {
        if (!isCancelled) {
          setError(null);
          setItemsData(res);
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) setError(err.message || "Không thể tải danh sách bài đăng");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/profile/bai-dang?${params.toString()}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setActionError(null);

    try {
      await deleteItem(deleteTargetId);
      setDeleteTargetId(null);

      // If this was the only item on the current page and page > 1, go to previous page
      if (itemsData && itemsData.data.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        loadData(currentPage);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể xóa bài đăng";
      setActionError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/profile"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} mb-2 inline-flex`}
          >
            <ArrowLeft className="mr-1.5 size-4" /> Hồ sơ cá nhân
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bài đăng của tôi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý tất cả vật phẩm bạn đã đăng để bán hoặc cho mượn.
          </p>
        </div>

        <Link href="/dang-bai" className={buttonVariants({ size: "sm" })}>
          <PackagePlus className="mr-1.5 size-4" /> Đăng vật phẩm mới
        </Link>
      </div>

      {actionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Không thể xóa bài đăng</AlertTitle>
          <AlertDescription className="mt-1">{actionError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5 text-center p-8">
          <CardContent className="space-y-3">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={() => loadData(currentPage)}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : itemsData?.data.length === 0 ? (
        <Card className="p-12 text-center shadow-none">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {currentPage > 1 ? "Trang này không có bài đăng nào" : "Bạn chưa có bài đăng nào"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentPage > 1
                  ? "Vui lòng quay lại các trang trước để xem bài đăng của bạn."
                  : "Hãy đăng vật phẩm đầu tiên để chia sẻ với cộng đồng S2S."}
              </p>
            </div>
            {currentPage > 1 ? (
              <Button variant="outline" onClick={() => handlePageChange(1)}>
                Về trang đầu
              </Button>
            ) : (
              <Link href="/dang-bai" className={buttonVariants()}>
                <PackagePlus className="mr-1.5 size-4" /> Đăng vật phẩm ngay
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {itemsData?.data.map((item) => (
              <div key={item.item_id} className="flex flex-col space-y-2">
                <ItemCard item={item} showStatus />

                {item.price_confirmed === false && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>Bài đăng cần xác nhận lại giá VND để hiển thị công khai.</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {item.status === "AVAILABLE" ? (
                    <Link
                      href={`/profile/bai-dang/${item.item_id}/chinh-sua`}
                      className={`${buttonVariants({ variant: "outline", size: "sm" })} flex-1`}
                    >
                      <Edit className="mr-1.5 size-3.5" /> Sửa bài
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="flex-1">
                      Không thể sửa
                    </Button>
                  )}

                  {item.status === "AVAILABLE" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      aria-label="Xóa bài đăng"
                      onClick={() => setDeleteTargetId(item.item_id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {itemsData && itemsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="size-4 mr-1" /> Trang trước
              </Button>
              <span className="text-sm font-medium px-2">
                Trang {currentPage} / {itemsData.totalPages} ({itemsData.total} bài)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= itemsData.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Trang sau <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài đăng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài viết sẽ được chuyển sang trạng thái đã xóa và không còn xuất hiện trên trang duyệt công khai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Đang xóa..." : "Xóa bài đăng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
