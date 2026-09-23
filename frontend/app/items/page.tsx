"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  PackageOpen,
  Plus,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { ItemCard } from "@/components/items/item-card";
import { ItemFilters } from "@/components/items/item-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, Category } from "@/lib/categories";
import { fetchItems, ItemsResponse, ItemType } from "@/lib/items";

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsLoadingSkeleton />}>
      <ItemsContent />
    </Suspense>
  );
}

function ItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [catError, setCatError] = useState<string | null>(null);
  const [itemsData, setItemsData] = useState<ItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const q = searchParams.get("q") || undefined;
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const type = (searchParams.get("type") as ItemType) || undefined;
  const minPriceVnd = searchParams.get("minPriceVnd") ? Number(searchParams.get("minPriceVnd")) : undefined;
  const maxPriceVnd = searchParams.get("maxPriceVnd") ? Number(searchParams.get("maxPriceVnd")) : undefined;
  const sort = (searchParams.get("sort") as "newest" | "price_asc" | "price_desc") || "newest";
  const rawPage = Number(searchParams.get("page"));
  const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

  const loadCategories = () => {
    setCatError(null);
    fetchCategories()
      .then((res) => setCategories(res))
      .catch((err: Error) => setCatError(err.message || "Không thể tải danh mục"));
  };

  useEffect(() => {
    let isCancelled = false;
    fetchCategories()
      .then((res) => {
        if (!isCancelled) {
          setCategories(res);
          setCatError(null);
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) setCatError(err.message || "Không thể tải danh mục");
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    fetchItems({
      q,
      categoryId,
      type,
      minPriceVnd,
      maxPriceVnd,
      sort,
      page,
      limit: 12,
    })
      .then((data) => {
        if (!isCancelled) {
          setError(null);
          setItemsData(data);
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [q, categoryId, type, minPriceVnd, maxPriceVnd, sort, page]);

  const handlePageChange = (newPage: number) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/items?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    params.set("page", "1");
    router.push(`/items?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Duyệt vật phẩm
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Khám phá và mượn/bán các đồ dùng thiết thực trong cộng đồng sinh viên S2S.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dang-bai" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-4 mr-1" /> Đăng vật phẩm
          </Link>

          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
                  <Filter className="size-4" /> Bộ lọc
                </Button>
              }
            />
            <SheetContent side="left" className="w-[min(22rem,85vw)] overflow-y-auto">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="size-5 text-primary" /> Bộ lọc vật phẩm
                </SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {catError && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Lỗi danh mục</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      {catError}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadCategories}
                        className="h-6 px-1.5 mt-1 block"
                      >
                        <RotateCw className="size-3 mr-1 inline" /> Thử lại
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <ItemFilters
                  key={searchParams.toString()}
                  categories={categories}
                  onApplyMobile={() => {
                    setLoading(true);
                    setMobileFilterOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-20 shadow-none">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-base font-semibold tracking-tight">
                Bộ lọc tìm kiếm
              </h2>
              {catError && (
                <Alert variant="destructive" className="p-3">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs">
                    {catError}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadCategories}
                      className="h-6 px-1.5 mt-1.5 block text-xs"
                    >
                      <RotateCw className="size-3 mr-1 inline" /> Thử lại
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <ItemFilters
                key={searchParams.toString()}
                categories={categories}
                onApplyMobile={() => setLoading(true)}
              />
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <p className="text-sm font-medium text-muted-foreground">
              {loading
                ? "Đang tải kết quả..."
                : `Hiển thị ${itemsData?.data.length || 0} / tổng số ${itemsData?.total || 0} vật phẩm`}
            </p>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Sắp xếp:</span>
              <NativeSelect
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="h-8 w-36 text-xs"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </NativeSelect>
            </div>
          </div>

          {loading ? (
            <ItemsGridSkeleton />
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5 text-center p-8">
              <CardContent className="space-y-3">
                <p className="text-destructive font-medium">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          ) : itemsData?.data.length === 0 ? (
            <Card className="p-12 text-center shadow-none">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <PackageOpen className="size-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Không tìm thấy vật phẩm phù hợp</h3>
                  <p className="text-sm text-muted-foreground">
                    Thử thay đổi từ khóa hoặc xóa bộ lọc để tìm thêm kết quả.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoading(true);
                    router.push("/items");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 3 cards per row on desktop as requested */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {itemsData?.data.map((item) => (
                  <ItemCard key={item.item_id} item={item} />
                ))}
              </div>

              {itemsData && itemsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <ChevronLeft className="size-4 mr-1" /> Trang trước
                  </Button>
                  <span className="text-sm font-medium px-2">
                    Trang {page} / {itemsData.totalPages} ({itemsData.total} vật phẩm)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= itemsData.totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Trang sau <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ItemsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-xl">
          <Skeleton className="aspect-[16/11] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2 pt-2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ItemsLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-96 w-full lg:block" />
        <ItemsGridSkeleton />
      </div>
    </div>
  );
}
