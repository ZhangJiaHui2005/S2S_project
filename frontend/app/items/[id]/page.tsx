"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin, Package, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchItemById, formatVND, Item } from "@/lib/items";

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export default function ItemDetailPage({ params }: ItemPageProps) {
  const resolvedParams = use(params);
  const itemId = Number(resolvedParams.id);

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    fetchItemById(itemId)
      .then((data) => {
        if (!isCancelled) {
          setError(null);
          setItem(data);
        }
      })
      .catch((err) => {
        if (!isCancelled) setError(err.message || "Đã xảy ra lỗi khi lấy thông tin sản phẩm");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [itemId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="p-8 shadow-none">
          <CardContent className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {error || "Bài đăng không tồn tại hoặc đã bị xóa"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Vật phẩm bạn tìm kiếm có thể đã kết thúc giao dịch hoặc không còn sẵn có.
            </p>
            <Link href="/items" className={buttonVariants({ variant: "default" })}>
              <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách vật phẩm
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSell = item.type === "SELL";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/items" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl border bg-muted aspect-square">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  const fallback = parent.querySelector(".img-fallback");
                  if (fallback) fallback.classList.remove("hidden");
                }
              }}
            />
          ) : null}
          <div
            className={`img-fallback flex h-full w-full flex-col items-center justify-center text-muted-foreground ${
              item.image_url ? "hidden" : ""
            }`}
          >
            <Package className="size-16 stroke-[1.2]" />
            <span className="mt-2 text-sm font-medium">S2S Share Item</span>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isSell ? "default" : "secondary"} className="text-sm px-3 py-0.5">
                {isSell ? "Bán" : "Cho mượn"}
              </Badge>
              {item.Category?.name && (
                <Badge variant="outline" className="text-sm px-3 py-0.5">
                  {item.Category.name}
                </Badge>
              )}
              {item.status !== "AVAILABLE" && (
                <Badge variant="destructive" className="text-sm px-3 py-0.5">
                  {item.status}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {item.title}
            </h1>

            {item.price_confirmed === false ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <span className="font-semibold text-lg">Cần xác nhận giá</span>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Bài đăng này cần chủ bài xác nhận giá VND thực tế trước khi xuất hiện trên trang duyệt công khai.
                </p>
              </div>
            ) : (
              <div className="text-3xl font-bold text-primary">
                {formatVND(item.price_vnd)}
              </div>
            )}

            {item.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                <span>Địa điểm: <strong className="text-foreground">{item.location}</strong></span>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold">Mô tả sản phẩm</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                {item.description || "Không có mô tả chi tiết."}
              </p>
            </div>
          </div>

          <Card className="shadow-none border-primary/20 bg-muted/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Người đăng bài</p>
                  <p className="font-semibold text-sm">{item.User?.full_name || "Người dùng S2S"}</p>
                </div>
              </div>

              {item.is_owner ? (
                <Link
                  href={`/profile/bai-dang/${item.item_id}/chinh-sua`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Edit className="size-3.5 mr-1" /> Chỉnh sửa bài đăng
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
